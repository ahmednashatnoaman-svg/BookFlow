import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? user : null;
}

// GET /api/admin/moderation — moderation log
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '20');
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('moderation_logs')
    .select('*, admin:user_profiles!admin_id(id, full_name, avatar_url)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: 'Failed to fetch moderation logs' }, { status: 500 });
  return NextResponse.json({ data, total: count, page, per_page: limit });
}

// POST /api/admin/moderation — take action (suspend user, remove listing)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { action, target_id, reason, metadata } = await request.json();
  if (!action || !target_id) return NextResponse.json({ error: 'action and target_id required' }, { status: 400 });

  let result;

  if (action === 'suspend_user' || action === 'unsuspend_user') {
    const { data, error } = await supabase.rpc('suspend_user', {
      p_user_id: target_id,
      p_reason: reason ?? '',
      p_suspend: action === 'suspend_user',
    });
    if (error) return NextResponse.json({ error: 'Failed to update user status. Please try again.' }, { status: 500 });
    result = data;
  } else if (action === 'remove_listing') {
    const { data, error } = await supabase.rpc('admin_remove_listing', {
      p_listing_id: target_id,
      p_reason: reason ?? '',
    });
    if (error) return NextResponse.json({ error: 'Failed to remove listing. Please try again.' }, { status: 500 });
    result = data;
  } else {
    // Generic log entry
    const { error } = await supabase.from('moderation_logs').insert({
      admin_id: admin.id,
      action,
      target_type: metadata?.target_type ?? 'listing',
      target_id,
      reason,
      metadata: metadata ?? {},
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = { success: true };
  }

  return NextResponse.json(result);
}
