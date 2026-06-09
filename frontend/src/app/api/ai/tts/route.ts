import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  const { listing_id } = await request.json();
  const supabase = await createClient();

  const { data: book } = await supabase
    .from('book_listings')
    .select('title, author, description, language, audio_url')
    .eq('id', listing_id)
    .single();

  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  if (book.audio_url) return NextResponse.json({ audio_url: book.audio_url });

  const text = `${book.title} by ${book.author}. ${book.description ?? ''}`.slice(0, 900);
  const voice = book.language === 'ar' ? 'shimmer' : 'alloy';

  try {
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input: text,
      response_format: 'mp3',
    });

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    const filename = `audio/${listing_id}.mp3`;

    const { error: uploadError } = await supabase.storage
      .from('book-audio')
      .upload(filename, audioBuffer, { contentType: 'audio/mpeg', upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('book-audio').getPublicUrl(filename);

    await supabase.from('book_listings').update({ audio_url: publicUrl }).eq('id', listing_id);

    return NextResponse.json({ audio_url: publicUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
