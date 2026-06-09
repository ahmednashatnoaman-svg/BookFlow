import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Calendar, Eye, ArrowLeftRight, Tag, MessageSquare, Heart } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import Header from '@/components/layout/Header';
import ReadingAssistant from '@/components/ai/ReadingAssistant';
import AudioPlayer from '@/components/ai/AudioPlayer';
import Recommender from '@/components/ai/Recommender';
import RequestModal from '@/components/requests/RequestModal';
import { createClient } from '@/lib/supabase/server';
import {
  conditionLabels, listingTypeLabels, statusLabels,
  formatPrice, formatDate, getImageUrl, cn
} from '@/lib/utils';
import type { BookListing } from '@/types';

interface Props { params: Promise<{ id: string }> }

async function getBookWithDetails(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('book_listings')
    .select(`
      *,
      owner:user_profiles(id, full_name, avatar_url, city, created_at),
      category:categories(id, name_en, name_ar, icon, slug)
    `)
    .eq('id', id)
    .single();
  if (error || !data) return null;
  await supabase.rpc('increment_view_count', { p_listing_id: id });
  return data as BookListing;
}

export default async function BookDetailPage({ params }: Props) {
  const { id } = await params;
  const locale = await getLocale() as 'en' | 'ar';
  const t = await getTranslations('bookDetail');
  const book = await getBookWithDetails(id);
  if (!book) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const condInfo = conditionLabels[book.condition];
  const typeInfo = listingTypeLabels[book.listing_type];
  const statusInfo = statusLabels[book.status];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const images = book.images?.length ? book.images : [book.cover_image].filter(Boolean) as string[];
  const isOwner = user?.id === book.user_id;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="page-container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Images */}
          <div className="lg:col-span-1 space-y-3">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted/30 relative">
              <Image
                src={getImageUrl(images[0] ?? null, supabaseUrl)}
                alt={book.title}
                fill className="object-cover"
                priority
              />
              {book.status !== 'available' && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className={cn('px-4 py-2 rounded-full text-sm font-bold', statusInfo.color)}>
                    {statusInfo[locale]}
                  </span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.slice(1).map((img, i) => (
                  <div key={i} className="w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden relative">
                    <Image src={getImageUrl(img, supabaseUrl)} alt={`${book.title} ${i+2}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Audio player */}
            {book.description && <AudioPlayer book={book} />}
          </div>

          {/* Middle: Details */}
          <div className="lg:col-span-1 space-y-5">
            {/* Category */}
            {book.category && (
              <Link href={`/books?category=${book.category.slug}`}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {book.category.icon} {book.category[`name_${locale}`]}
              </Link>
            )}

            <h1 className="text-2xl font-bold leading-tight">{book.title}</h1>
            <p className="text-muted-foreground">{t('by')} <span className="text-foreground font-medium">{book.author}</span></p>

            {/* Price & type */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-3xl font-bold text-primary">{formatPrice(book.price, locale)}</span>
              <span className={cn('px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5', typeInfo.color)}>
                {book.listing_type === 'exchange' ? <ArrowLeftRight className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
                {typeInfo[locale]}
              </span>
              <span className={cn('px-3 py-1 text-xs font-semibold rounded-full', condInfo.color)}>
                {condInfo[locale]}
              </span>
            </div>

            {/* Description */}
            {book.description && (
              <div>
                <h3 className="text-sm font-semibold mb-2">{t('description')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{book.description}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {book.publisher && <div><span className="text-muted-foreground">{t('publisher')}: </span>{book.publisher}</div>}
              {book.published_year && <div><span className="text-muted-foreground">{t('year')}: </span>{book.published_year}</div>}
              {book.isbn && <div><span className="text-muted-foreground">ISBN: </span>{book.isbn}</div>}
              <div><span className="text-muted-foreground">{t('language')}: </span>{book.language?.toUpperCase()}</div>
            </div>

            {/* Owner */}
            {book.owner && (
              <div className="glass-card p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {book.owner.full_name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{book.owner.full_name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {book.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{book.city}</span>}
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{t('member')} {formatDate(book.owner.created_at, locale)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{book.view_count} {t('views')}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(book.created_at, locale)}</span>
            </div>

            {/* CTA */}
            {!isOwner && book.status === 'available' && (
              <RequestModal book={book} userId={user?.id ?? null} locale={locale} />
            )}
            {isOwner && (
              <div className="flex gap-2">
                <Link href={`/dashboard/listings/${book.id}/edit`}
                  className="flex-1 py-2.5 text-center border border-border rounded-xl text-sm font-medium hover:bg-muted/40 transition-colors"
                >
                  {t('edit')}
                </Link>
              </div>
            )}
          </div>

          {/* Right: AI */}
          <div className="lg:col-span-1 space-y-4">
            <ReadingAssistant book={book} />
            <Recommender listingId={book.id} title={t('similar')} />
          </div>
        </div>
      </div>
    </div>
  );
}
