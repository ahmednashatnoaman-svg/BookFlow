import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import Header from '@/components/layout/Header';
import RequestCard from '@/components/requests/RequestCard';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function RequestsPage({ searchParams }: PageProps) {
  const locale = await getLocale() as 'en' | 'ar';
  const { tab } = await searchParams;
  const activeTab = tab === 'outgoing' ? 'outgoing' : 'incoming';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // PostgREST can't filter on joined columns — get owned listing IDs first
  const { data: ownedListings } = await supabase
    .from('book_listings')
    .select('id')
    .eq('user_id', user.id);

  const ownedIds = ownedListings?.map(l => l.id) ?? [];

  const [incomingResult, outgoingResult] = await Promise.all([
    ownedIds.length > 0
      ? supabase
          .from('book_requests')
          .select('*, listing:book_listings!listing_id(id, title, author, cover_image), requester:user_profiles!requester_id(id, full_name, avatar_url, city)')
          .in('listing_id', ownedIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
    supabase
      .from('book_requests')
      .select('*, listing:book_listings!listing_id(id, title, author, cover_image), offer_listing:book_listings!offer_listing_id(id, title, author)')
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  const incoming = incomingResult.data ?? [];
  const outgoing = outgoingResult.data ?? [];
  const displayList = activeTab === 'outgoing' ? outgoing : incoming;

  const tabs = [
    { key: 'incoming', label: locale === 'ar' ? 'الطلبات الواردة' : 'Incoming', count: incoming.length },
    { key: 'outgoing', label: locale === 'ar' ? 'الطلبات الصادرة' : 'Outgoing', count: outgoing.length },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <div className="page-container py-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">{locale === 'ar' ? 'الطلبات' : 'Requests'}</h1>

        <div className="flex border-b border-border mb-6 gap-1">
          {tabs.map(t => (
            <Link
              key={t.key}
              href={`/dashboard/requests?tab=${t.key}`}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === t.key ? 'bg-primary/15 text-primary' : 'bg-muted/50 text-muted-foreground'
              }`}>
                {t.count}
              </span>
            </Link>
          ))}
        </div>

        <div className="space-y-3">
          {displayList.map((req: any) => (
            <RequestCard
              key={req.id}
              request={req}
              type={activeTab as 'incoming' | 'outgoing'}
              locale={locale}
              userId={user.id}
            />
          ))}
          {displayList.length === 0 && (
            <div className="glass-card p-10 text-center text-muted-foreground text-sm">
              {activeTab === 'incoming'
                ? (locale === 'ar' ? 'لا توجد طلبات واردة' : 'No incoming requests yet')
                : (locale === 'ar' ? 'لا توجد طلبات صادرة' : 'No outgoing requests yet')
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
