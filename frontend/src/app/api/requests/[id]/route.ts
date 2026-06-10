import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

interface Params { params: Promise<{ id: string }> }

function genericError(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return genericError('Authentication required', 401);

  let body: { status?: string };
  try { body = await request.json(); } catch { return genericError('Invalid request body'); }

  const { status } = body;
  if (!['accepted', 'rejected'].includes(status ?? '')) {
    return genericError('Status must be "accepted" or "rejected"');
  }

  if (status === 'accepted') {
    const admin = await createAdminClient();
    // Use auth context from user JWT for permission check
    const { data, error } = await supabase.rpc('accept_request', { p_request_id: id });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('not authorized')) return genericError('You can only accept requests for your own listings', 403);
      if (msg.includes('not found')) return genericError('Request not found', 404);
      return genericError('Failed to accept request. Please try again.', 400);
    }

    // Notify requester about acceptance (use admin client to bypass RLS)
    const { data: req } = await admin
      .from('book_requests')
      .select('requester_id, listing:book_listings(title, user_id)')
      .eq('id', id)
      .single();

    if (req) {
      const listing = (Array.isArray(req.listing) ? req.listing[0] : req.listing) as { title: string; user_id: string } | null;
      await admin.rpc('send_notification', {
        p_user_id: req.requester_id,
        p_type: 'request_accepted',
        p_title: 'Request Accepted!',
        p_body: `Your request for "${listing?.title ?? 'the book'}" has been accepted. Check your dashboard for contact details.`,
        p_data: { request_id: id, listing_id: listing ? (listing as any).id : null },
      });
    }

    return NextResponse.json({ success: true, ...data });
  }

  // Reject
  const { data, error } = await supabase
    .from('book_requests')
    .update({ status: 'rejected' })
    .eq('id', id)
    .select('id, status, requester_id, listing:book_listings(title)')
    .single();

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('not found') || msg.includes('0 rows')) return genericError('Request not found', 404);
    return genericError('Failed to update request. Please try again.', 400);
  }

  // Notify requester about rejection
  const admin = await createAdminClient();
  const listing = data?.listing as { title?: string } | null;
  await admin.rpc('send_notification', {
    p_user_id: data.requester_id,
    p_type: 'request_rejected',
    p_title: 'Request Update',
    p_body: `Your request for "${listing?.title ?? 'the book'}" was not accepted this time.`,
    p_data: { request_id: id },
  });

  return NextResponse.json({ success: true, status: 'rejected' });
}
