import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'placeholder' });
  const { listing_id } = await request.json();
  const supabase = await createClient();

  const { data: book } = await supabase
    .from('book_listings')
    .select('title, author, description, language, ai_summary, category:categories(name_en)')
    .eq('id', listing_id)
    .single();

  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  if (book.ai_summary) return NextResponse.json(book.ai_summary);

  const lang = book.language ?? 'en';
  const prompt = lang === 'ar'
    ? `أنت خبير أدبي. حلّل هذا الكتاب وأجب بـ JSON فقط.\nالكتاب: "${book.title}" للمؤلف ${book.author}\nالفئة: ${(book.category as any)?.name_en ?? 'General'}\nالوصف: ${book.description ?? 'لا يوجد وصف'}\n\nأعد هذا JSON بالضبط:\n{"summary":"ملخص 2-3 جمل","key_themes":["موضوع1","موضوع2"],"target_audience":"الجمهور","mood":"المزاج","similar_books":["كتاب 1","كتاب 2"],"reading_time_estimate":"X ساعات"}`
    : `You are a literary expert. Analyze this book and respond in JSON only.\nBook: "${book.title}" by ${book.author}\nCategory: ${(book.category as any)?.name_en ?? 'General'}\nDescription: ${book.description ?? 'No description'}\n\nReturn exactly this JSON:\n{"summary":"2-3 sentence summary","key_themes":["theme1","theme2"],"target_audience":"who","mood":"tone","similar_books":["Book 1","Book 2"],"reading_time_estimate":"X hours"}`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const summary = JSON.parse(response.choices[0].message.content ?? '{}');
    await supabase.from('book_listings').update({ ai_summary: summary }).eq('id', listing_id);
    return NextResponse.json(summary);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
