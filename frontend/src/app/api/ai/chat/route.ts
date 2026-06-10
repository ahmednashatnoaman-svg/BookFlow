import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'placeholder' });
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
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
    });
    return NextResponse.json({ response: response.choices[0].message.content });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
