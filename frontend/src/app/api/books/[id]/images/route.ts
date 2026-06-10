import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('book_images')
    .select('*')
    .eq('listing_id', params.id)
    .order('sort_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ownership
  const { data: listing } = await supabase
    .from('book_listings')
    .select('user_id')
    .eq('id', params.id)
    .single();

  if (listing?.user_id !== user.id)
    return NextResponse.json({ error: 'Not your listing' }, { status: 403 });

  const { url, storage_path, is_primary, sort_order, width, height, size_bytes } = await request.json();
  if (!url || !storage_path) return NextResponse.json({ error: 'url and storage_path required' }, { status: 400 });

  // Get current image count
  const { count } = await supabase
    .from('book_images')
    .select('*', { count: 'exact', head: true })
    .eq('listing_id', params.id);

  if ((count ?? 0) >= 8) return NextResponse.json({ error: 'Maximum 8 images per listing' }, { status: 400 });

  const { data, error } = await supabase
    .from('book_images')
    .insert({
      listing_id: params.id,
      user_id: user.id,
      url,
      storage_path,
      is_primary: is_primary ?? (count === 0),
      sort_order: sort_order ?? (count ?? 0),
      width, height, size_bytes,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If primary, update listing cover_image
  if (data.is_primary) {
    await supabase.from('book_listings').update({ cover_image: url }).eq('id', params.id);
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { image_id } = await request.json();
  if (!image_id) return NextResponse.json({ error: 'image_id required' }, { status: 400 });

  const { data: storagePath, error } = await supabase.rpc('delete_book_image', { p_image_id: image_id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Delete from storage
  if (storagePath) {
    await supabase.storage.from('book-images').remove([storagePath]);
  }

  return NextResponse.json({ success: true, storage_path: storagePath });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { image_id } = await request.json();
  if (!image_id) return NextResponse.json({ error: 'image_id required' }, { status: 400 });

  const { error } = await supabase.rpc('set_primary_image', {
    p_image_id: image_id,
    p_listing_id: params.id,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
