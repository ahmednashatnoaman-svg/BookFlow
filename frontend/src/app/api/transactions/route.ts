import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id, type, completed_at,
      listing:book_listings(id, title, author, price, images, cover_image, listing_type),
      seller:user_profiles!transactions_seller_id_fkey(id, full_name, avatar_url),
      buyer:user_profiles!transactions_buyer_id_fkey(id, full_name, avatar_url)
    `)
    .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
    .order('completed_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const withRole = (data ?? []).map((tx: any) => ({
    ...tx,
    role: tx.seller?.id === user.id ? 'seller' : 'buyer',
  }));

  return NextResponse.json(withRole);
}
