'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, X, Loader2, MessageSquare } from 'lucide-react';
import { requestsApi } from '@/lib/api';
import { formatRelativeTime, cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { BookRequest } from '@/types';

interface RequestCardProps {
  request: BookRequest;
  type: 'incoming' | 'outgoing';
  locale: 'en' | 'ar';
  userId: string;
}

const statusColors: Record<string, string> = {
  pending: 'text-amber-500 bg-amber-500/10',
  accepted: 'text-green-500 bg-green-500/10',
  rejected: 'text-red-500 bg-red-500/10',
};

export default function RequestCard({ request, type, locale, userId }: RequestCardProps) {
  const [status, setStatus] = useState(request.status);
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null);

  const handleAction = async (action: 'accepted' | 'rejected') => {
    setLoading(action === 'accepted' ? 'accept' : 'reject');
    try {
      await requestsApi.updateStatus(request.id, action);
      setStatus(action);
      toast.success(action === 'accepted'
        ? (locale === 'ar' ? 'تم قبول الطلب' : 'Request accepted')
        : (locale === 'ar' ? 'تم رفض الطلب' : 'Request rejected')
      );
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  const listing = request.listing as any;
  const requester = request.requester as any;
  const offerListing = (request as any).offer_listing;

  return (
    <div className="glass-card p-4">
      <div className="flex items-start gap-3">
        {/* Book info */}
        <Link href={`/books/${listing?.id ?? ''}`} className="w-12 h-16 bg-muted/40 rounded-lg flex-shrink-0 flex items-center justify-center text-xl hover:opacity-80 transition-opacity">
          📚
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link href={`/books/${listing?.id ?? ''}`} className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1">
                {listing?.title}
              </Link>
              <p className="text-xs text-muted-foreground">{listing?.author}</p>
            </div>
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0', statusColors[status] ?? '')}>
              {status}
            </span>
          </div>

          {type === 'incoming' && requester && (
            <p className="text-xs text-muted-foreground mt-1">
              {locale === 'ar' ? 'من: ' : 'From: '}<span className="text-foreground">{requester.full_name}</span>
            </p>
          )}

          {offerListing && (
            <div className="mt-2 p-2 bg-teal-500/5 border border-teal-500/20 rounded-lg">
              <p className="text-[10px] text-teal-400 font-semibold mb-0.5">{locale === 'ar' ? 'عرض تبادل:' : 'Exchange offer:'}</p>
              <p className="text-xs">{offerListing.title} — {offerListing.author}</p>
            </div>
          )}

          {request.message && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
              <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{request.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] text-muted-foreground">{formatRelativeTime(request.created_at, locale)}</span>
            {type === 'incoming' && status === 'pending' && (
              <div className="flex gap-2">
                <button onClick={() => handleAction('rejected')} disabled={!!loading}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs border border-destructive/40 text-destructive rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50"
                >
                  {loading === 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                  {locale === 'ar' ? 'رفض' : 'Reject'}
                </button>
                <button onClick={() => handleAction('accepted')} disabled={!!loading}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs bg-green-500/15 text-green-500 border border-green-500/30 rounded-lg hover:bg-green-500/25 transition-colors disabled:opacity-50"
                >
                  {loading === 'accept' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  {locale === 'ar' ? 'قبول' : 'Accept'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
