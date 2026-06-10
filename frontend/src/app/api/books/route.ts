import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

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
  const per_page     = Math.min(50, Number(searchParams.get('per_page') ?? 24));
  const page         = Math.max(1, Number(searchParams.get('page') ?? 1));
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

  if (error) return err('Failed to fetch listings. Please try again.', 500);

  const total = data?.[0]?.total_count ?? 0;
  const books = (data ?? []).map(({ total_count, ...b }: Record<string, unknown>) => b);

  // Enrich with owner info (only public fields)
  const ownerIds = [...new Set(books.map((b: Record<string, unknown>) => b.user_id as string))];
  let ownerMap: Record<string, { id: string; full_name: string; avatar_url: string; city: string }> = {};
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase
      .from('user_profiles')
      .select('id, full_name, avatar_url, city')
      .in('id', ownerIds);
    ownerMap = Object.fromEntries((owners ?? []).map(o => [o.id, o]));
  }

  const enriched = books.map((b: Record<string, unknown>) => ({
    ...b,
    owner: ownerMap[b.user_id as string] ?? null,
  }));

  return NextResponse.json({ data: enriched, total, page, per_page, has_more: offset + per_page < total });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Authentication required', 401);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return err('Invalid request body'); }

  // Whitelist allowed fields for security
  const allowed = ['title', 'author', 'isbn', 'category_id', 'condition', 'listing_type', 'price',
                   'description', 'images', 'cover_image', 'language', 'city', 'publisher', 'published_year'];
  const sanitized: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) sanitized[key] = body[key];
  }

  if (!sanitized.title || !sanitized.author || !sanitized.condition || !sanitized.listing_type) {
    return err('Title, author, condition, and listing type are required');
  }
  if (sanitized.listing_type === 'sale' && !sanitized.price) {
    return err('Price is required for sale listings');
  }

  const { data, error } = await supabase
    .from('book_listings')
    .insert({ ...sanitized, user_id: user.id })
    .select()
    .single();

  if (error) return err('Failed to create listing. Please try again.', 400);

  // Trigger background embedding (fire and forget)
  const aiUrl = process.env.AI_SERVICE_URL;
  if (aiUrl) {
    fetch(`${aiUrl}/recommend/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-service-secret': process.env.AI_SERVICE_SECRET ?? '' },
      body: JSON.stringify({ listing_id: data.id, title: data.title, author: data.author, description: data.description }),
    }).catch(() => {});
  }

  return NextResponse.json(data, { status: 201 });
}
