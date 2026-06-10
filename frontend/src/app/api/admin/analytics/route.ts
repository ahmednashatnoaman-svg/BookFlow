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
  const days = parseInt(searchParams.get('days') ?? '30');

  const [
    { data: stats },
    { data: growth },
    { data: categories },
    { data: topBooks },
  ] = await Promise.all([
    supabase.from('admin_stats').select('*').single(),
    supabase.rpc('get_growth_data', { p_days: days }),
    supabase.rpc('get_category_stats'),
    supabase.rpc('get_top_requested_books', { p_limit: 10 }),
  ]);

  return NextResponse.json({
    stats,
    growth_data: growth ?? [],
    categories_breakdown: categories ?? [],
    top_requested_books: topBooks ?? [],
  });
}
