import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const { listing_id, message } = await request.json();
  const supabase = await createClient();

  const { data: book } = await supabase
    .from('book_listings')
    .select('title, author, description, language')
    .eq('id', listing_id)
    .single();

  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });

  const lang = book.language ?? 'en';
  const systemPrompt = `You are an enthusiastic reading assistant helping a user understand the book "${book.title}" by ${book.author}.
Description: ${book.description ?? 'Not provided'}
${lang === 'ar' ? 'أجب باللغة العربية فقط. كن مفيداً وموجزاً ومتحمساً للكتب.' : 'Respond in English only. Be helpful, concise, and enthusiastic about books.'}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    });

    return NextResponse.json({ response: (response.content[0] as any).text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
