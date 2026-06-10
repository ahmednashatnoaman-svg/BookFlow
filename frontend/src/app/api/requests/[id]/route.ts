import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendRequestAcceptedEmail, sendRequestRejectedEmail } from '@/lib/email';

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

  const admin = await createAdminClient();

  if (status === 'accepted') {
    // Fetch request info before calling RPC so we can send email on success
    const { data: reqRow, error: fetchError } = await admin
      .from('book_requests')
      .select('id, requester_id, listing:book_listings!listing_id(id, title, user_id)')
      .eq('id', id)
      .single();

    if (fetchError || !reqRow) return genericError('Request not found', 404);
    const listing = (Array.isArray(reqRow.listing) ? reqRow.listing[0] : reqRow.listing) as
      { id: string; title: string; user_id: string } | null;

    // accept_request RPC: verifies ownership via auth.uid(), auto-rejects
    // other pending requests, marks listing sold/exchanged, creates transaction,
    // and inserts in-app notifications for the requester and all rejected parties.
    const { data, error } = await supabase.rpc('accept_request', { p_request_id: id });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('not authorized')) return genericError('You can only accept requests for your own listings', 403);
      if (msg.includes('not found')) return genericError('Request not found', 404);
      return genericError('Failed to accept request. Please try again.', 400);
    }

    // Send acceptance email to requester — fire-and-forget
    (async () => {
      try {
        const [requesterAuth, requesterProfile, ownerProfile] = await Promise.all([
          admin.auth.admin.getUserById(reqRow.requester_id),
          admin.from('user_profiles').select('full_name').eq('id', reqRow.requester_id).single(),
          admin.from('user_profiles').select('full_name').eq('id', user.id).single(),
        ]);
        const requesterEmail = requesterAuth.data.user?.email;
        if (requesterEmail && listing) {
          await sendRequestAcceptedEmail({
            to: requesterEmail,
            requesterName: requesterProfile.data?.full_name ?? '',
            ownerName: ownerProfile.data?.full_name ?? 'The seller',
            bookTitle: listing.title,
            bookId: listing.id,
          });
        }
      } catch (e) {
        console.error('[email] request accepted notification failed:', e);
      }
    })();

    return NextResponse.json({ success: true, ...data });
  }

  // ── Reject flow ─────────────────────────────────────────────────────────
  const { data: reqRow } = await admin
    .from('book_requests')
    .select('id, requester_id, listing:book_listings!listing_id(title, user_id)')
    .eq('id', id)
    .single();

  if (!reqRow) return genericError('Request not found', 404);

  const listing = (Array.isArray(reqRow.listing) ? reqRow.listing[0] : reqRow.listing) as
    { title: string; user_id: string } | null;

  if (listing?.user_id !== user.id) {
    return genericError('You can only reject requests for your own listings', 403);
  }

  const { error: updateError } = await admin
    .from('book_requests')
    .update({ status: 'rejected' })
    .eq('id', id);

  if (updateError) return genericError('Failed to update request. Please try again.', 400);

  // In-app notification for requester
  admin.from('notifications').insert({
    user_id: reqRow.requester_id,
    type: 'request_rejected',
    title: 'Request Update',
    body: `Your request for "${listing?.title ?? 'the book'}" was not accepted this time.`,
    data: { request_id: id },
  }).then(() => {}, () => {});

  // Email rejection notice to requester — fire-and-forget
  (async () => {
    try {
      const [requesterAuth, requesterProfile] = await Promise.all([
        admin.auth.admin.getUserById(reqRow.requester_id),
        admin.from('user_profiles').select('full_name').eq('id', reqRow.requester_id).single(),
      ]);
      const requesterEmail = requesterAuth.data.user?.email;
      if (requesterEmail) {
        await sendRequestRejectedEmail({
          to: requesterEmail,
          requesterName: requesterProfile.data?.full_name ?? '',
          bookTitle: listing?.title ?? 'the book',
        });
      }
    } catch (e) {
      console.error('[email] request rejected notification failed:', e);
    }
  })();

  return NextResponse.json({ success: true, status: 'rejected' });
}
