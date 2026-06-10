'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import {
  BookOpen, Plus, Edit2, Trash2, Eye, Loader2, PackageOpen,
  CheckCircle, XCircle, Clock, AlertCircle,
} from 'lucide-react';
import { booksApi } from '@/lib/api';
import { formatPrice, formatRelativeTime, getImageUrl, cn } from '@/lib/utils';
import type { BookListing, ListingStatus } from '@/types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

const STATUS_CONFIG: Record<ListingStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  available: { label: 'Available', color: 'bg-green-500/10 text-green-400', icon: CheckCircle },
  sold: { label: 'Sold', color: 'bg-muted text-muted-foreground', icon: CheckCircle },
  exchanged: { label: 'Exchanged', color: 'bg-teal-500/10 text-teal-400', icon: CheckCircle },
  unavailable: { label: 'Unavailable', color: 'bg-destructive/10 text-destructive', icon: XCircle },
};

const STATUS_OPTIONS: ListingStatus[] = ['available', 'unavailable'];

export default function MyListingsPage() {
  const [listings, setListings] = useState<BookListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [filter, setFilter] = useState<ListingStatus | 'all'>('all');

  const loadListings = useCallback(async () => {
    try {
      const all = await booksApi.myListings();
      setListings(all);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadListings(); }, [loadListings]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await booksApi.delete(id);
      setListings(prev => prev.filter(b => b.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusChange = async (id: string, status: ListingStatus) => {
    setUpdatingStatus(id);
    try {
      await booksApi.update(id, { status });
      setListings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filtered = filter === 'all' ? listings : listings.filter(b => b.status === filter);

  const counts = listings.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen">
      <Header />
      <div className="page-container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">My Listings</h1>
              <p className="text-muted-foreground text-sm">{listings.length} total book{listings.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Link href="/list-book"
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Book
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {(['all', 'available', 'sold', 'exchanged', 'unavailable'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex-shrink-0',
                filter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/40 text-muted-foreground hover:text-foreground',
              )}
            >
              {s === 'all' ? `All (${listings.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${counts[s] ?? 0})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center">
              <PackageOpen className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <div>
              <p className="font-semibold">{filter === 'all' ? 'No listings yet' : `No ${filter} listings`}</p>
              {filter === 'all' && (
                <p className="text-sm text-muted-foreground mt-1">Start selling or exchanging your books</p>
              )}
            </div>
            {filter === 'all' && (
              <Link href="/list-book"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                List Your First Book
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(book => {
              const statusCfg = STATUS_CONFIG[book.status];
              const img = getImageUrl((book.images?.[0] ?? book.cover_image) ?? null, SUPABASE_URL);

              return (
                <div key={book.id} className="glass-card p-4 flex items-center gap-4">
                  {/* Thumbnail */}
                  <Link href={`/books/${book.id}`} className="flex-shrink-0">
                    <div className="w-14 h-18 relative rounded-lg overflow-hidden bg-muted/40 w-14" style={{ height: '4.5rem' }}>
                      <Image src={img} alt={book.title} fill className="object-cover" />
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusCfg.color)}>
                        {statusCfg.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Eye className="w-2.5 h-2.5" />{book.view_count} views
                      </span>
                    </div>
                    <Link href={`/books/${book.id}`} className="hover:underline">
                      <p className="text-sm font-semibold truncate">{book.title}</p>
                    </Link>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{formatPrice(book.price, 'en')} · {book.listing_type}</span>
                      <span>{formatRelativeTime(book.created_at, 'en')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Quick status toggle for available/unavailable */}
                    {(book.status === 'available' || book.status === 'unavailable') && (
                      <select
                        value={book.status}
                        onChange={e => handleStatusChange(book.id, e.target.value as ListingStatus)}
                        disabled={updatingStatus === book.id}
                        aria-label="Change status"
                        className="text-xs bg-muted/40 border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    )}

                    <Link href={`/dashboard/listings/${book.id}/edit`}
                      aria-label="Edit listing"
                      className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(book.id)}
                      disabled={deleting === book.id}
                      aria-label="Delete listing"
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                    >
                      {deleting === book.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
