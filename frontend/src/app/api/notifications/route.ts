import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Authentication required', 401);

  const { searchParams } = new URL(request.url);
  const unread_only = searchParams.get('unread_only') === 'true';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (unread_only) query = query.eq('read', false);

  const { data, error, count } = await query;
  if (error) return err('Failed to fetch notifications', 500);

  return NextResponse.json({ data: data ?? [], total: count ?? 0, page, per_page: limit });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Authentication required', 401);

  let body: { notification_id?: string; mark_all?: boolean };
  try { body = await request.json().catch(() => ({})); } catch { body = {}; }

  const { notification_id, mark_all } = body;

  if (mark_all) {
    const { error } = await supabase.rpc('mark_all_notifications_read');
    if (error) {
      // Fallback: direct update
      await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    }
    return NextResponse.json({ success: true });
  }

  if (notification_id) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notification_id)
      .eq('user_id', user.id);

    if (error) return err('Failed to mark notification as read', 500);
    return NextResponse.json({ success: true });
  }

  return err('"notification_id" or "mark_all" is required');
}
