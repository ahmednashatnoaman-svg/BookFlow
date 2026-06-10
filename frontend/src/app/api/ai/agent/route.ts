import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient } from '@/lib/supabase/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' });

const GROQ_TOOL_MODELS = [
  'llama-3.3-70b-versatile',
  'llama3-groq-70b-8192-tool-use-preview',
  'llama3-groq-8b-8192-tool-use-preview',
];

const SYSTEM_PROMPT = `You are BookFlow's smart book assistant — friendly and expert, helping users discover books on a peer-to-peer marketplace in Egypt and the Arab world.

When users ask to find, search, or browse books, use the search_books function to query real listings.

Capabilities:
- Natural language search: "find me a thriller under 100 EGP in good condition"
- Price, condition, city, language, listing_type filters
- Sort: newest, cheapest first, most expensive first
- Egyptian cities: Cairo (القاهرة), Alexandria (الإسكندرية), Giza (الجيزة), Mansoura, Tanta, etc.

After searching, present results conversationally. Mention title, author, price/type, condition, city.
If no results, suggest adjustments.

Respond in the same language the user writes in (Arabic or English).`;

const SEARCH_TOOL: Groq.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'search_books',
    description: 'Search BookFlow marketplace for available book listings.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Text search for title, author, or description.' },
        min_price: { type: 'number', description: 'Minimum price in EGP.' },
        max_price: { type: 'number', description: 'Maximum price in EGP.' },
        condition: {
          type: 'array',
          items: { type: 'string', enum: ['new', 'good', 'acceptable', 'poor'] },
        },
        listing_type: { type: 'string', enum: ['sale', 'exchange'] },
        city: { type: 'string' },
        language: { type: 'string', enum: ['en', 'ar'] },
        sort: { type: 'string', enum: ['newest', 'price_asc', 'price_desc'] },
        limit: { type: 'number' },
      },
      required: [],
    },
  },
};

interface SearchParams {
  query?: string;
  min_price?: number;
  max_price?: number;
  condition?: string[];
  listing_type?: string;
  city?: string;
  language?: string;
  sort?: string;
  limit?: number;
}

async function executeBookSearch(params: SearchParams) {
  const supabase = await createClient();
  let q = supabase
    .from('book_listings')
    .select('id,title,author,price,condition,listing_type,city,language,status,cover_image,category:categories(name_en,icon)')
    .eq('status', 'available');

  if (params.query) q = q.or(`title.ilike.%${params.query}%,author.ilike.%${params.query}%`);
  if (params.min_price !== undefined) q = q.gte('price', params.min_price);
  if (params.max_price !== undefined) q = q.lte('price', params.max_price);
  if (params.condition?.length) q = q.in('condition', params.condition);
  if (params.listing_type) q = q.eq('listing_type', params.listing_type);
  if (params.city) q = q.ilike('city', `%${params.city}%`);
  if (params.language) q = q.eq('language', params.language);

  const sortMap: Record<string, { col: string; asc: boolean }> = {
    newest: { col: 'created_at', asc: false },
    price_asc: { col: 'price', asc: true },
    price_desc: { col: 'price', asc: false },
  };
  const sort = sortMap[params.sort ?? 'newest'] ?? sortMap.newest;
  q = q.order(sort.col, { ascending: sort.asc }).limit(Math.min(params.limit ?? 8, 20));

  const { data, error } = await q;
  return { books: data ?? [], count: data?.length ?? 0, error: error?.message };
}

function containsArabic(text: string) {
  return /[؀-ۿ]/.test(text);
}

async function runGroqAgent(messages: Groq.Chat.ChatCompletionMessageParam[], locale: string) {
  let foundBooks: unknown[] = [];
  let finalText = '';

  // Detect Arabic from last user message OR locale
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  const isArabic = locale === 'ar' || (lastUserMsg && typeof lastUserMsg.content === 'string' && containsArabic(lastUserMsg.content));

  let systemMsg = SYSTEM_PROMPT;
  if (isArabic) {
    systemMsg += `

IMPORTANT — Arabic mode:
- The user is writing in Arabic. You MUST respond in Arabic (Modern Standard Arabic).
- When calling search_books, ALWAYS translate Arabic titles, authors, genres, and keywords into English for the "query" parameter. For example, if the user says "روايات تاريخية" use query "historical novels". If they say "أرخص الكتب" set sort to "price_asc" instead.
- The search database only contains English text for titles/authors, so English queries return better results.
- After getting results, present them conversationally in Arabic.`;
  }

  for (const model of GROQ_TOOL_MODELS) {
    try {
      const workingMessages = [...messages];
      for (let iter = 0; iter < 5; iter++) {
        const response = await groq.chat.completions.create({
          model,
          messages: [{ role: 'system', content: systemMsg }, ...workingMessages],
          tools: [SEARCH_TOOL],
          tool_choice: 'auto',
          max_tokens: 1024,
          temperature: 0.3,
        });

        const choice = response.choices[0];

        if (choice.finish_reason === 'stop') {
          finalText = choice.message.content ?? '';
          return { finalText, foundBooks };
        }

        if (choice.finish_reason === 'tool_calls') {
          const toolCalls = choice.message.tool_calls ?? [];
          workingMessages.push({ role: 'assistant', content: choice.message.content, tool_calls: toolCalls });

          for (const call of toolCalls) {
            const args = JSON.parse(call.function.arguments || '{}') as SearchParams;
            const result = await executeBookSearch(args);
            foundBooks = result.books;
            workingMessages.push({
              role: 'tool',
              tool_call_id: call.id,
              content: JSON.stringify(result),
            });
          }
          continue;
        }

        finalText = choice.message.content ?? '';
        return { finalText, foundBooks };
      }
      return { finalText, foundBooks };
    } catch (err) {
      console.warn(`Groq model ${model} failed:`, err);
    }
  }
  throw new Error('All Groq models failed');
}

export async function POST(request: NextRequest) {
  try {
    const { messages, locale = 'en' } = await request.json() as {
      messages: { role: string; content: string }[];
      locale?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI backend not configured' }, { status: 503 });
    }

    const groqMessages = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const result = await runGroqAgent(groqMessages, locale);
    return NextResponse.json({ response: result.finalText, books: result.foundBooks });
  } catch (e: unknown) {
    const err = e as Error;
    console.error('AI agent error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}
