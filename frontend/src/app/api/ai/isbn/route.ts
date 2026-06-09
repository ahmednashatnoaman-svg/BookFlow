import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const isbn = new URL(request.url).searchParams.get('isbn');
  if (!isbn) return NextResponse.json({ error: 'isbn required' }, { status: 400 });

  const clean = isbn.replace(/[-\s]/g, '');
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${clean}${apiKey ? `&key=${apiKey}` : ''}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.totalItems > 0) {
      const info = data.items[0].volumeInfo;
      const cover = info.imageLinks?.thumbnail?.replace('http://', 'https://') ?? null;
      return NextResponse.json({
        title: info.title ?? null,
        author: info.authors?.join(', ') ?? null,
        publisher: info.publisher ?? null,
        published_year: info.publishedDate ? parseInt(info.publishedDate) : null,
        cover_image: cover,
        description: info.description ?? null,
        language: info.language ?? 'en',
      });
    }

    // Fallback: OpenLibrary
    const olRes = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`);
    const olData = await olRes.json();
    const key = `ISBN:${clean}`;
    if (olData[key]) {
      const b = olData[key];
      return NextResponse.json({
        title: b.title ?? null,
        author: b.authors?.map((a: any) => a.name).join(', ') ?? null,
        publisher: b.publishers?.[0]?.name ?? null,
        cover_image: b.cover?.medium ?? b.cover?.small ?? null,
      });
    }

    return NextResponse.json({});
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
