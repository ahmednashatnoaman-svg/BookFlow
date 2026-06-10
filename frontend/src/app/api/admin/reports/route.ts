import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? user : null;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? 'pending';
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '20');
  const offset = (page - 1) * limit;

  const query = supabase
    .from('reports')
    .select(`
      *,
      reporter:user_profiles!reporter_id(id, full_name, avatar_url, email),
      listing:book_listings(id, title, author, cover_image, status),
      reported_user:user_profiles!user_id(id, full_name, avatar_url, email),
      admin:user_profiles!admin_id(id, full_name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status !== 'all') query.eq('status', status);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });

  return NextResponse.json({ data, total: count, page, per_page: limit });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { report_id, action, note } = await request.json();
  if (!report_id || !action) return NextResponse.json({ error: 'report_id and action required' }, { status: 400 });

  const { data, error } = await supabase.rpc('resolve_report', {
    p_report_id: report_id,
    p_action: action,
    p_note: note ?? null,
  });

  if (error) return NextResponse.json({ error: 'Failed to update report. Please try again.' }, { status: 500 });
  return NextResponse.json(data);
}
