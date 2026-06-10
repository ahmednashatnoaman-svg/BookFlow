import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface Params { params: Promise<{ id: string }> }

function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('book_listings')
    .select('*, owner:user_profiles!user_id(id, full_name, avatar_url, city, created_at), category:categories(id, name_en, name_ar, icon)')
    .eq('id', id)
    .single();

  if (error || !data) return err('Listing not found', 404);

  // Increment view count (fire and forget)
  void supabase.rpc('increment_view_count', { p_listing_id: id });

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Authentication required', 401);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return err('Invalid request body'); }

  // Whitelist allowed update fields
  const allowed = ['title', 'author', 'isbn', 'category_id', 'condition', 'listing_type', 'price',
                   'description', 'images', 'cover_image', 'language', 'city', 'publisher',
                   'published_year', 'status'];
  const sanitized: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) sanitized[key] = body[key];
  }

  if (Object.keys(sanitized).length === 0) return err('No valid fields to update');

  const { data, error } = await supabase
    .from('book_listings')
    .update(sanitized)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, category:categories(id, name_en, name_ar, icon)')
    .single();

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('0 rows') || msg.includes('not found')) return err('Listing not found or you do not have permission', 404);
    return err('Failed to update listing. Please try again.', 400);
  }

  return NextResponse.json(data);
}

// Alias PUT to PATCH for compatibility
export { PATCH as PUT };

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Authentication required', 401);

  const { error } = await supabase
    .from('book_listings')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return err('Failed to delete listing. Please try again.', 400);
  return NextResponse.json({ success: true });
}
