import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are BookFlow's smart book assistant — a friendly, expert AI helping users discover the perfect books on a peer-to-peer book marketplace in Saudi Arabia and the MENA region.

You have access to the BookFlow marketplace. When users ask to find, search, or browse books, use the search_books tool to query real listings.

Key capabilities:
- Natural language search: "find me a thriller novel under 50 SAR in good condition"
- Price filtering: "books under 20 SAR", "exchange only books", "free books"
- Condition filtering: new, good, acceptable, poor
- Location filtering: by city (Riyadh, Jeddah, Dammam, etc.)
- Type filtering: sale vs exchange
- Language filtering: Arabic or English books
- Sorting: newest, cheapest first, most expensive first

After searching, present results in a friendly conversational way. Mention the book title, author, price/type, condition, and city.

If no results found, suggest adjusting the search (broader terms, different filters).

Respond in the same language the user writes in (Arabic or English).
For Arabic responses, be warm and use formal Modern Standard Arabic.`;

const SEARCH_TOOL: Anthropic.Tool = {
  name: 'search_books',
  description: 'Search BookFlow marketplace for available book listings. Use this whenever the user asks to find, show, browse, or search for books with any criteria.',
  input_schema: {
    type: 'object' as const,
    properties: {
      query: { type: 'string', description: 'Text search query for title, author, or description. Leave empty to browse all.' },
      min_price: { type: 'number', description: 'Minimum price in SAR. Use 0 for exchange/free books.' },
      max_price: { type: 'number', description: 'Maximum price in SAR.' },
      condition: {
        type: 'array',
        items: { type: 'string', enum: ['new', 'good', 'acceptable', 'poor'] },
        description: 'Book condition filters.',
      },
      listing_type: { type: 'string', enum: ['sale', 'exchange'], description: 'Filter by sale or exchange.' },
      city: { type: 'string', description: 'City to filter by (e.g. Riyadh, Jeddah, Dammam).' },
      language: { type: 'string', enum: ['en', 'ar'], description: 'Book language filter.' },
      sort: {
        type: 'string',
        enum: ['newest', 'price_asc', 'price_desc'],
        description: 'Sort order: newest, cheapest first, most expensive first.',
      },
      limit: { type: 'number', description: 'Number of results to return (default 8, max 20).' },
    },
    required: [],
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
    .select('id, title, author, price, condition, listing_type, city, language, status, images, cover_image, category:categories(name_en, name_ar, icon)')
    .eq('status', 'available');

  if (params.query) {
    q = q.or(`title.ilike.%${params.query}%,author.ilike.%${params.query}%,description.ilike.%${params.query}%`);
  }
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
  q = q.order(sort.col, { ascending: sort.asc });

  q = q.limit(Math.min(params.limit ?? 8, 20));

  const { data, error } = await q;
  if (error) return { books: [], error: error.message };

  return {
    books: data ?? [],
    count: data?.length ?? 0,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { messages, locale = 'en' } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    const anthropicMessages: Anthropic.MessageParam[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    let foundBooks: any[] = [];
    let finalText = '';

    // Agentic loop: allow up to 5 iterations for tool use
    for (let iter = 0; iter < 5; iter++) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT + (locale === 'ar' ? '\n\nالمستخدم يتحدث بالعربية. أجب بالعربية الفصحى.' : ''),
        tools: [SEARCH_TOOL],
        messages: anthropicMessages,
      });

      if (response.stop_reason === 'end_turn') {
        finalText = response.content
          .filter(b => b.type === 'text')
          .map(b => (b as Anthropic.TextBlock).text)
          .join('');
        break;
      }

      if (response.stop_reason === 'tool_use') {
        const toolUse = response.content.find(b => b.type === 'tool_use') as Anthropic.ToolUseBlock | undefined;
        if (!toolUse) break;

        anthropicMessages.push({ role: 'assistant', content: response.content });

        const searchResult = await executeBookSearch(toolUse.input as SearchParams);
        foundBooks = searchResult.books ?? [];

        anthropicMessages.push({
          role: 'user',
          content: [{
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(searchResult),
          }],
        });

        continue;
      }

      break;
    }

    return NextResponse.json({ response: finalText, books: foundBooks });
  } catch (e: any) {
    console.error('AI agent error:', e);
    return NextResponse.json({ error: e.message ?? 'Internal error' }, { status: 500 });
  }
}
