import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const { listing_id } = await request.json();
  const supabase = await createClient();

  if (!listing_id) return NextResponse.json([]);

  const { data } = await supabase.rpc('get_similar_books', {
    source_listing_id: listing_id,
    match_count: 6,
  });

  const recommendations = (data ?? []).map((b: any) => ({
    listing: {
      id: b.id, title: b.title, author: b.author,
      cover_image: b.cover_image, listing_type: b.listing_type,
      condition: b.condition, price: b.price, city: b.city,
    },
    score: b.similarity ?? 0.5,
    reason: 'Similar book',
  }));

  return NextResponse.json(recommendations);
}
