import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendRequestReceivedEmail } from '@/lib/email';

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

  // Validate listing exists, is available, and isn't owned by requester
  const { data: listing, error: listingError } = await supabase
    .from('book_listings')
    .select('id, user_id, title, status')
    .eq('id', listing_id)
    .single();

  if (listingError || !listing) return genericError('This listing is no longer available', 404);
  if (listing.status !== 'available') return genericError('This listing is no longer available', 404);
  if (listing.user_id === user.id) return genericError('You cannot request your own listing', 400);

  // Check for existing pending request
  const { data: existing } = await supabase
    .from('book_requests')
    .select('id')
    .eq('listing_id', listing_id)
    .eq('requester_id', user.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) return genericError('You already have a pending request for this listing', 409);

  // Insert request and notification using service role to bypass RLS
  const admin = await createAdminClient();
  const { data: newRequest, error: requestError } = await admin
    .from('book_requests')
    .insert({
      listing_id,
      requester_id: user.id,
      offer_listing_id: offer_listing_id ?? null,
      message: message?.trim() ?? null,
      status: 'pending',
    })
    .select()
    .single();

  if (requestError) {
    if (requestError.code === '23505') return genericError('You already have a pending request for this listing', 409);
    return genericError('Failed to send request. Please try again.', 400);
  }

  // Notify listing owner (in-app) — fire-and-forget
  admin.from('notifications').insert({
    user_id: listing.user_id,
    type: 'request_received',
    title: 'New Request for Your Book',
    body: `Someone is interested in "${listing.title}"`,
    data: { request_id: newRequest.id, listing_id, requester_id: user.id },
  }).then(() => {}, () => {});

  // Email notification to listing owner — fire-and-forget
  (async () => {
    try {
      const [requesterProfile, ownerAuth] = await Promise.all([
        admin.from('user_profiles').select('full_name').eq('id', user.id).single(),
        admin.auth.admin.getUserById(listing.user_id),
      ]);
      const ownerEmail = ownerAuth.data.user?.email;
      if (ownerEmail) {
        const ownerProfile = await admin.from('user_profiles').select('full_name').eq('id', listing.user_id).single();
        await sendRequestReceivedEmail({
          to: ownerEmail,
          ownerName: ownerProfile.data?.full_name ?? '',
          requesterName: requesterProfile.data?.full_name ?? user.email ?? 'A BookFlow user',
          bookTitle: listing.title,
          bookId: listing_id,
          message: message?.trim() ?? null,
        });
      }
    } catch (e) {
      console.error('[email] request received notification failed:', e);
    }
  })();

  return NextResponse.json(newRequest, { status: 201 });
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

  let listingIds: string[] = [];
  if (type === 'received') {
    const { data: owned } = await supabase
      .from('book_listings')
      .select('id')
      .eq('user_id', user.id);
    listingIds = owned?.map(l => l.id) ?? [];
    if (listingIds.length === 0) {
      return NextResponse.json({ data: [], total: 0, page, per_page: limit });
    }
  }

  let query = supabase
    .from('book_requests')
    .select(`
      id, status, message, created_at, updated_at, offer_listing_id,
      listing:book_listings!listing_id(id, title, author, cover_image, listing_type, price, user_id),
      requester:user_profiles!requester_id(id, full_name, avatar_url),
      offer:book_listings!offer_listing_id(id, title, author, cover_image)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type === 'received') {
    query = query.in('listing_id', listingIds);
  } else {
    query = query.eq('requester_id', user.id);
  }

  const { data, error, count } = await query;
  if (error) return genericError('Failed to fetch requests', 500);

  return NextResponse.json({ data: data ?? [], total: count ?? 0, page, per_page: limit });
}
