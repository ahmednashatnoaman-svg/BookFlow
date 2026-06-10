'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { BookOpen, ChevronLeft, Eye, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ListingStatus } from '@/types';

interface AdminListing {
  id: string;
  title: string;
  author: string;
  price: number | null;
  condition: string;
  listing_type: 'sale' | 'exchange';
  status: ListingStatus;
  view_count: number;
  created_at: string;
  owner: { full_name: string } | null;
  category: { name_en: string; icon: string } | null;
}

const STATUS_COLORS: Record<ListingStatus, string> = {
  available:   'bg-green-500/10 text-green-400',
  sold:        'bg-muted text-muted-foreground',
  exchanged:   'bg-teal-500/10 text-teal-400',
  unavailable: 'bg-destructive/10 text-destructive',
};

export default function AdminListingsPage() {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [removeModal, setRemoveModal] = useState<AdminListing | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/listings');
    const data = await res.json();
    setListings(data.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleRemove = async () => {
    if (!removeModal || !reason.trim()) return;
    setSubmitting(true);
    setActionError('');
    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_listing',
          target_id: removeModal.id,
          reason: reason.trim(),
        }),
      });
      if (!res.ok) {
        setActionError('Failed to remove listing. Please try again.');
        return;
      }
      setRemoveModal(null);
      setReason('');
      await fetchListings();
    } finally {
      setSubmitting(false);
    }
  };

  const counts = listings.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen">
      <Header />
      <div className="page-container py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">All Listings</h1>
            <p className="text-muted-foreground text-sm">
              {listings.length} total · {counts.available ?? 0} available
            </p>
          </div>
          <button type="button" aria-label="Refresh listings" onClick={fetchListings} className="ml-auto p-2 glass-card hover:border-primary/40 transition-all rounded-lg">
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Status summary pills */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['available', 'sold', 'exchanged', 'unavailable'] as ListingStatus[]).map(s => (
            <span key={s} className={cn('text-xs font-semibold px-3 py-1 rounded-full', STATUS_COLORS[s])}>
              {s.charAt(0).toUpperCase() + s.slice(1)}: {counts[s] ?? 0}
            </span>
          ))}
        </div>

        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">Book</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Owner</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">Price</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Views</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {listings.map(listing => (
                    <tr key={listing.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{listing.category?.icon ?? '📚'}</span>
                          <div>
                            <p className="font-medium truncate max-w-[200px]">{listing.title}</p>
                            <p className="text-xs text-muted-foreground">{listing.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {listing.owner?.full_name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        {listing.listing_type === 'exchange'
                          ? <span className="text-xs text-teal-400">Exchange</span>
                          : <span className="text-primary font-semibold text-xs">
                              {listing.price != null ? `${listing.price} SAR` : '—'}
                            </span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', STATUS_COLORS[listing.status])}>
                          {listing.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{listing.view_count}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                        {new Date(listing.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <Link href={`/books/${listing.id}`} className="text-xs text-primary hover:underline">View</Link>
                          {listing.status === 'available' && (
                            <button
                              type="button"
                              aria-label={`Remove listing "${listing.title}"`}
                              onClick={() => setRemoveModal(listing)}
                              className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Remove Modal */}
      {removeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-5 h-5 text-destructive" />
              <h3 className="font-bold">Remove Listing</h3>
            </div>
            <p className="text-sm mb-1">
              <span className="font-semibold">{removeModal.title}</span>
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              This listing will be marked as unavailable and the owner will be notified.
            </p>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Reason <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
              placeholder="Prohibited content, spam, etc."
            />
            {actionError && (
              <div className="flex items-center gap-2 text-destructive text-xs mb-3">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {actionError}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setRemoveModal(null); setReason(''); setActionError(''); }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={submitting || !reason.trim()}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-destructive text-white hover:bg-destructive/90 transition-all disabled:opacity-60"
              >
                {submitting ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
