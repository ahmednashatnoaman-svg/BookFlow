import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { listing_id, offer_listing_id, message } = await request.json();

  // Prevent self-request
  const { data: listing } = await supabase.from('book_listings').select('user_id').eq('id', listing_id).single();
  if (listing?.user_id === user.id) return NextResponse.json({ error: 'Cannot request your own listing' }, { status: 400 });

  const { data, error } = await supabase.from('book_requests').insert({
    listing_id,
    requester_id: user.id,
    offer_listing_id: offer_listing_id ?? null,
    message: message ?? null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Notify listing owner
  if (listing) {
    await supabase.from('notifications').insert({
      user_id: listing.user_id,
      type: 'request_received',
      title: 'New Request',
      body: 'Someone is interested in your book.',
      data: { listing_id, request_id: data.id },
    });
  }

  return NextResponse.json(data, { status: 201 });
}
