import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

function genericError(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return genericError('Authentication required', 401);

  let body: { listing_id?: string; offer_listing_id?: string; message?: string };
  try { body = await request.json(); } catch { return genericError('Invalid request body'); }

  const { listing_id, offer_listing_id, message } = body;
  if (!listing_id) return genericError('listing_id is required');

  // Use service-role for the atomic create_contact_request RPC
  // This function handles validation + notification atomically
  const admin = await createAdminClient();
  const { data, error } = await admin.rpc('create_contact_request', {
    p_listing_id: listing_id,
    p_offer_listing_id: offer_listing_id ?? null,
    p_message: message?.trim() ?? null,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('not found') || msg.includes('unavailable')) return genericError('This listing is no longer available', 404);
    if (msg.includes('own listing')) return genericError('You cannot request your own listing', 400);
    if (msg.includes('already have a pending')) return genericError('You already have a pending request for this listing', 409);
    return genericError('Failed to send request. Please try again.', 400);
  }

  return NextResponse.json(data, { status: 201 });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return genericError('Authentication required', 401);

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'received'; // 'received' | 'sent'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('book_requests')
    .select(`
      id, status, message, created_at, updated_at, offer_listing_id,
      listing:book_listings(id, title, author, cover_image, listing_type, price, user_id),
      requester:user_profiles!requester_id(id, full_name, avatar_url),
      offer:book_listings!offer_listing_id(id, title, author, cover_image)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type === 'received') {
    query = query.eq('listing.user_id', user.id);
  } else {
    query = query.eq('requester_id', user.id);
  }

  const { data, error, count } = await query;
  if (error) return genericError('Failed to fetch requests', 500);

  return NextResponse.json({ data: data ?? [], total: count ?? 0, page, per_page: limit });
}
