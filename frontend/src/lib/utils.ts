import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { BookCondition, ListingType, ListingStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | null, locale: string = 'en', currency: string = 'EGP'): string {
  if (price === null) return locale === 'ar' ? 'مجاناً (تبادل)' : 'Free (Exchange)';
  const intlLocale = locale === 'ar' ? 'ar-EG' : 'en-US';
  try {
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: currency || 'EGP',
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
}

export function formatDate(date: string, locale: string = 'en'): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string, locale: string = 'en'): string {
  const rtf = new Intl.RelativeTimeFormat(locale === 'ar' ? 'ar' : 'en', { numeric: 'auto' });
  const diff = (new Date(date).getTime() - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000], ['month', 2592000], ['week', 604800],
    ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1],
  ];
  for (const [unit, seconds] of units) {
    if (Math.abs(diff) >= seconds) {
      return rtf.format(Math.round(diff / seconds), unit);
    }
  }
  return rtf.format(0, 'second');
}

export const conditionLabels: Record<BookCondition, { en: string; ar: string; color: string }> = {
  new: { en: 'New', ar: 'جديد', color: 'text-emerald-500 bg-emerald-500/10' },
  good: { en: 'Good', ar: 'جيد', color: 'text-blue-500 bg-blue-500/10' },
  acceptable: { en: 'Acceptable', ar: 'مقبول', color: 'text-amber-500 bg-amber-500/10' },
  poor: { en: 'Poor', ar: 'سيء', color: 'text-red-500 bg-red-500/10' },
};

export const listingTypeLabels: Record<ListingType, { en: string; ar: string; color: string }> = {
  sale: { en: 'For Sale', ar: 'للبيع', color: 'text-purple-500 bg-purple-500/10' },
  exchange: { en: 'For Exchange', ar: 'للتبادل', color: 'text-teal-500 bg-teal-500/10' },
};

export const statusLabels: Record<ListingStatus, { en: string; ar: string; color: string }> = {
  available: { en: 'Available', ar: 'متاح', color: 'text-green-500 bg-green-500/10' },
  sold: { en: 'Sold', ar: 'مُباع', color: 'text-gray-500 bg-gray-500/10' },
  exchanged: { en: 'Exchanged', ar: 'تم التبادل', color: 'text-blue-500 bg-blue-500/10' },
  unavailable: { en: 'Unavailable', ar: 'غير متاح', color: 'text-red-500 bg-red-500/10' },
};

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}

export function isRTL(locale: string): boolean {
  return locale === 'ar';
}

export function getImageUrl(path: string | null, supabaseUrl: string): string {
  if (!path) return '/placeholder-book.svg';
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/book-images/${path}`;
}
