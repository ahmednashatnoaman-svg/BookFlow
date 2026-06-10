'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, MapPin, Eye, ArrowLeftRight, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, conditionLabels, listingTypeLabels, formatPrice, formatRelativeTime, getImageUrl } from '@/lib/utils';
import type { BookListing } from '@/types';
import { useState } from 'react';
import { wishlistApi } from '@/lib/api';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';

interface BookCardProps {
  book: BookListing;
  showWishlist?: boolean;
  className?: string;
}

export default function BookCard({ book, showWishlist = true, className }: BookCardProps) {
  const locale = useLocale();
  const [wishlisted, setWishlisted] = useState(book.is_wishlisted ?? false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const coverUrl = getImageUrl(book.cover_image, supabaseUrl);

  const conditionInfo = conditionLabels[book.condition];
  const typeInfo = listingTypeLabels[book.listing_type];

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlistLoading(true);
    try {
      if (wishlisted) {
        await wishlistApi.remove(book.id);
        setWishlisted(false);
        toast.info(locale === 'ar' ? 'تمت الإزالة من قائمة الرغبات' : 'Removed from wishlist');
      } else {
        await wishlistApi.add(book.id);
        setWishlisted(true);
        toast.success(locale === 'ar' ? 'تمت الإضافة إلى قائمة الرغبات' : 'Added to wishlist');
      }
    } catch {
      toast.error(locale === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please sign in first');
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('group relative', className)}
    >
      <Link href={`/books/${book.id}`}>
        <div className="book-card overflow-hidden cursor-pointer">
          {/* Cover image */}
          <div className="relative aspect-[3/4] overflow-hidden bg-muted/30">
            <Image
              src={coverUrl}
              alt={book.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Badges overlay */}
            <div className="absolute top-2 start-2 flex flex-col gap-1">
              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', conditionInfo.color)}>
                {conditionInfo[locale as 'en' | 'ar']}
              </span>
            </div>
            {/* Listing type */}
            <div className="absolute top-2 end-2">
              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1', typeInfo.color)}>
                {book.listing_type === 'exchange'
                  ? <ArrowLeftRight className="w-2.5 h-2.5" />
                  : <Tag className="w-2.5 h-2.5" />
                }
                {typeInfo[locale as 'en' | 'ar']}
              </span>
            </div>
            {/* Wishlist button */}
            {showWishlist && (
              <button
                onClick={handleWishlist}
                disabled={wishlistLoading}
                className={cn(
                  'absolute bottom-2 end-2 p-1.5 rounded-full backdrop-blur-sm transition-all',
                  wishlisted
                    ? 'bg-destructive/90 text-white'
                    : 'bg-black/40 text-white/70 opacity-0 group-hover:opacity-100 hover:bg-black/60'
                )}
              >
                <Heart className={cn('w-3.5 h-3.5', wishlisted && 'fill-current')} />
              </button>
            )}
          </div>

          {/* Book info */}
          <div className="p-3">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
              {book.title}
            </h3>
            <p className="text-xs text-muted-foreground truncate mb-2">{book.author}</p>

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-primary">
                {formatPrice(book.price, locale)}
              </span>
              {book.city && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <MapPin className="w-2.5 h-2.5" />
                  {book.city}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground ms-auto">
                <Eye className="w-2.5 h-2.5" />
                {book.view_count}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {formatRelativeTime(book.created_at, locale)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
