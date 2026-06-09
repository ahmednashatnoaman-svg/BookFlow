import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('wishlist')
    .select(`
      id, created_at,
      listing:book_listings(
        id, title, author, price, condition, listing_type, status,
        images, cover_image, city, language,
        category:categories(name_en, name_ar, icon)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { listing_id } = await request.json();
  if (!listing_id) return NextResponse.json({ error: 'listing_id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('wishlist')
    .upsert({ user_id: user.id, listing_id }, { onConflict: 'user_id,listing_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
