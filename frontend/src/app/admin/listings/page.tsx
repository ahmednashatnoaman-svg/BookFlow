import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/server';
import { BookOpen, ChevronLeft, Eye } from 'lucide-react';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import type { ListingStatus } from '@/types';

const STATUS_COLORS: Record<ListingStatus, string> = {
  available: 'bg-green-500/10 text-green-400',
  sold: 'bg-muted text-muted-foreground',
  exchanged: 'bg-teal-500/10 text-teal-400',
  unavailable: 'bg-destructive/10 text-destructive',
};

export default async function AdminListingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/');

  const { data: listings } = await supabase
    .from('book_listings')
    .select(`
      id, title, author, price, condition, listing_type, status, view_count, created_at,
      owner:user_profiles(full_name),
      category:categories(name_en, icon)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  const counts = (listings ?? []).reduce<Record<string, number>>((acc, l: any) => {
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
              {listings?.length ?? 0} total · {counts.available ?? 0} available
            </p>
          </div>
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
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {(listings ?? []).map((listing: any) => (
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
                        : <span className="text-primary font-semibold">{formatPrice(listing.price, 'en')}</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', STATUS_COLORS[listing.status as ListingStatus])}>
                        {listing.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{listing.view_count}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                      {formatDate(listing.created_at, 'en')}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/books/${listing.id}`} className="text-xs text-primary hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
