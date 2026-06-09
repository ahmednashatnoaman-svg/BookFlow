'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Loader2 } from 'lucide-react';
import { aiApi } from '@/lib/api';
import type { BookRecommendation } from '@/types';
import { formatPrice, getImageUrl, cn } from '@/lib/utils';
import { useLocale } from 'next-intl';

interface RecommenderProps {
  listingId?: string;
  userId?: string;
  title?: string;
  className?: string;
}

export default function Recommender({ listingId, userId, title, className }: RecommenderProps) {
  const locale = useLocale() as 'en' | 'ar';
  const [recs, setRecs] = useState<BookRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await aiApi.recommend(listingId);
        setRecs(data);
      } catch {
        setRecs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [listingId, userId]);

  const heading = title ?? (locale === 'ar' ? 'كتب مشابهة' : 'Similar Books');

  if (!loading && recs.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">{heading}</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {recs.map(rec => (
            <Link key={rec.listing.id} href={`/books/${rec.listing.id}`}
              className="glass-card p-2.5 hover:border-primary/40 transition-all group"
            >
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted/30 mb-2 relative">
                <Image
                  src={getImageUrl(rec.listing.cover_image, supabaseUrl)}
                  alt={rec.listing.title}
                  fill className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">{rec.listing.title}</p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{rec.listing.author}</p>
              <p className="text-xs font-bold text-primary mt-1">{formatPrice(rec.listing.price, locale)}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1 truncate">{rec.reason}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
