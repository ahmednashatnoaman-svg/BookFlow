'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import { Heart, Trash2, ArrowLeftRight, Tag, MapPin, Loader2, PackageOpen } from 'lucide-react';
import { wishlistApi } from '@/lib/api';
import { formatPrice, getImageUrl, cn } from '@/lib/utils';
import type { WishlistItem } from '@/types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    wishlistApi.list()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (listingId: string) => {
    setRemoving(listingId);
    try {
      await wishlistApi.remove(listingId);
      setItems(prev => prev.filter(i => i.listing_id !== listingId));
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="page-container py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Wishlist</h1>
            <p className="text-muted-foreground text-sm">{items.length} saved book{items.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center">
              <PackageOpen className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <div>
              <p className="font-semibold">Your wishlist is empty</p>
              <p className="text-sm text-muted-foreground mt-1">Save books you&apos;re interested in by clicking the heart icon</p>
            </div>
            <Link href="/books"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Browse Books
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map(item => {
              const book = item.listing;
              if (!book) return null;
              const img = getImageUrl((book.images?.[0] ?? book.cover_image) ?? null, SUPABASE_URL);
              const isAvailable = book.status === 'available';

              return (
                <div key={item.id} className="glass-card overflow-hidden group relative">
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(item.listing_id)}
                    disabled={removing === item.listing_id}
                    className="absolute top-2 right-2 z-10 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/80"
                  >
                    {removing === item.listing_id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      : <Trash2 className="w-3.5 h-3.5 text-white" />
                    }
                  </button>

                  {!isAvailable && (
                    <div className="absolute inset-0 z-10 bg-black/50 flex items-center justify-center">
                      <span className="px-3 py-1.5 bg-muted text-muted-foreground text-xs font-semibold rounded-full">
                        {book.status}
                      </span>
                    </div>
                  )}

                  <Link href={`/books/${book.id}`}>
                    <div className="aspect-[3/4] relative overflow-hidden bg-muted/30">
                      <Image src={img} alt={book.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold truncate">{book.title}</p>
                      <p className="text-xs text-muted-foreground truncate mb-2">{book.author}</p>
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1',
                          book.listing_type === 'exchange'
                            ? 'bg-teal-500/10 text-teal-400'
                            : 'bg-primary/10 text-primary',
                        )}>
                          {book.listing_type === 'exchange'
                            ? <><ArrowLeftRight className="w-2.5 h-2.5" /> Exchange</>
                            : <><Tag className="w-2.5 h-2.5" /> {formatPrice(book.price, 'en')}</>
                          }
                        </span>
                        {book.city && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" />{book.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
