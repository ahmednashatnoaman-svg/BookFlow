import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const query        = searchParams.get('query') ?? undefined;
  const category_id  = searchParams.get('category_id') ?? undefined;
  const condition    = searchParams.get('condition')?.split(',') ?? undefined;
  const listing_type = searchParams.get('listing_type') ?? undefined;
  const min_price    = searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined;
  const max_price    = searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined;
  const city         = searchParams.get('city') ?? undefined;
  const language     = searchParams.get('language') ?? undefined;
  const sort         = searchParams.get('sort') ?? 'newest';
  const per_page     = Number(searchParams.get('per_page') ?? 24);
  const page         = Number(searchParams.get('page') ?? 1);
  const offset       = (page - 1) * per_page;

  const { data, error } = await supabase.rpc('search_listings', {
    p_query: query ?? null,
    p_category_id: category_id ?? null,
    p_condition: condition ?? null,
    p_listing_type: listing_type ?? null,
    p_min_price: min_price ?? null,
    p_max_price: max_price ?? null,
    p_city: city ?? null,
    p_language: language ?? null,
    p_sort: sort,
    p_limit: per_page,
    p_offset: offset,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = data?.[0]?.total_count ?? 0;
  const books = (data ?? []).map(({ total_count, ...b }: any) => b);

  // Fetch owner info
  const ownerIds = [...new Set(books.map((b: any) => b.user_id))];
  const { data: owners } = await supabase.from('user_profiles').select('id, full_name, avatar_url, city').in('id', ownerIds as string[]);
  const ownerMap = Object.fromEntries((owners ?? []).map((o: any) => [o.id, o]));

  const enriched = books.map((b: any) => ({ ...b, owner: ownerMap[b.user_id] ?? null }));

  return NextResponse.json({ data: enriched, total, page, per_page, has_more: offset + per_page < total });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabase
    .from('book_listings')
    .insert({ ...body, user_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Trigger background embedding generation
  const aiUrl = process.env.AI_SERVICE_URL;
  if (aiUrl) {
    fetch(`${aiUrl}/recommend/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-service-secret': process.env.AI_SERVICE_SECRET ?? '' },
      body: JSON.stringify({ listing_id: data.id, title: data.title, author: data.author, description: data.description, category: data.category_id }),
    }).catch(() => {});
  }

  return NextResponse.json(data, { status: 201 });
}
