'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { Clock, ArrowLeftRight, Tag, TrendingUp, TrendingDown, Loader2, PackageOpen } from 'lucide-react';
import { transactionsApi } from '@/lib/api';
import { formatPrice, formatDate, cn } from '@/lib/utils';

interface TransactionWithRole {
  id: string;
  type: 'sale' | 'exchange';
  completed_at: string;
  role: 'seller' | 'buyer';
  listing?: {
    id: string;
    title: string;
    author: string;
    price: number | null;
    listing_type: string;
  };
  seller?: { id: string; full_name: string | null };
  buyer?: { id: string; full_name: string | null };
}

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<TransactionWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    transactionsApi.list()
      .then(data => setTransactions(data as unknown as TransactionWithRole[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalSales = transactions.filter(t => t.role === 'seller' && t.type === 'sale').length;
  const totalPurchases = transactions.filter(t => t.role === 'buyer' && t.type === 'sale').length;
  const totalExchanges = transactions.filter(t => t.type === 'exchange').length;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="page-container py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Transaction History</h1>
            <p className="text-muted-foreground text-sm">{transactions.length} completed deal{transactions.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Stats */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Books Sold', value: totalSales, icon: TrendingUp, color: 'text-green-400 bg-green-400/10' },
              { label: 'Purchases', value: totalPurchases, icon: TrendingDown, color: 'text-primary bg-primary/10' },
              { label: 'Exchanges', value: totalExchanges, icon: ArrowLeftRight, color: 'text-teal-400 bg-teal-400/10' },
            ].map(s => (
              <div key={s.label} className="glass-card p-4">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-2', s.color)}>
                  <s.icon className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center">
              <PackageOpen className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <div>
              <p className="font-semibold">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">Completed sales and exchanges will appear here</p>
            </div>
            <Link href="/books"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Browse Books
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx.id} className="glass-card p-4 flex items-center gap-4">
                {/* Icon */}
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  tx.type === 'exchange'
                    ? 'bg-teal-500/10 text-teal-400'
                    : tx.role === 'seller'
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-primary/10 text-primary',
                )}>
                  {tx.type === 'exchange' ? <ArrowLeftRight className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide',
                      tx.role === 'seller' ? 'bg-green-500/10 text-green-400' : 'bg-primary/10 text-primary',
                    )}>
                      {tx.role === 'seller' ? 'Sold' : tx.type === 'exchange' ? 'Exchanged' : 'Bought'}
                    </span>
                  </div>
                  {tx.listing ? (
                    <Link href={`/books/${tx.listing.id}`} className="hover:underline">
                      <p className="text-sm font-semibold truncate">{tx.listing.title}</p>
                      <p className="text-xs text-muted-foreground">{tx.listing.author}</p>
                    </Link>
                  ) : (
                    <p className="text-sm text-muted-foreground">Listing removed</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {tx.role === 'seller' ? `Buyer: ${tx.buyer?.full_name ?? 'Unknown'}` : `Seller: ${tx.seller?.full_name ?? 'Unknown'}`}
                  </p>
                </div>

                {/* Amount + date */}
                <div className="text-end flex-shrink-0">
                  {tx.type === 'sale' && tx.listing?.price && (
                    <p className={cn('text-sm font-bold', tx.role === 'seller' ? 'text-green-400' : 'text-primary')}>
                      {tx.role === 'seller' ? '+' : '-'}{formatPrice(tx.listing.price, 'en')}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(tx.completed_at, 'en')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
