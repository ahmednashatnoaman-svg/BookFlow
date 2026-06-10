import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? user : null;
}

export async function GET() {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { data, error } = await supabase
    .from('book_listings')
    .select(`
      id, title, author, price, condition, listing_type, status, view_count, created_at,
      owner:user_profiles(full_name),
      category:categories(name_en, icon)
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}
