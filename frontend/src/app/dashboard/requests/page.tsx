import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import Header from '@/components/layout/Header';
import RequestCard from '@/components/requests/RequestCard';
import { createClient } from '@/lib/supabase/server';

export default async function RequestsPage() {
  const locale = await getLocale() as 'en' | 'ar';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [{ data: incoming }, { data: outgoing }] = await Promise.all([
    supabase.from('book_requests').select('*, listing:book_listings(id, title, author, cover_image), requester:user_profiles(id, full_name, avatar_url, city)').eq('listing.user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('book_requests').select('*, listing:book_listings(id, title, author, cover_image), offer_listing:book_listings(id, title, author)').eq('requester_id', user.id).order('created_at', { ascending: false }),
  ]);

  const tabs = [
    { key: 'incoming', label: locale === 'ar' ? 'الطلبات الواردة' : 'Incoming', count: incoming?.length ?? 0 },
    { key: 'outgoing', label: locale === 'ar' ? 'الطلبات الصادرة' : 'Outgoing', count: outgoing?.length ?? 0 },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <div className="page-container py-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">{locale === 'ar' ? 'الطلبات' : 'Requests'}</h1>

        <div className="flex border-b border-border mb-6 gap-1">
          {tabs.map(tab => (
            <Link key={tab.key} href={`/dashboard/requests?tab=${tab.key}`}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 border-primary text-primary"
            >
              {tab.label}
              <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">{tab.count}</span>
            </Link>
          ))}
        </div>

        <div className="space-y-3">
          {incoming && incoming.map((req: any) => (
            <RequestCard key={req.id} request={req} type="incoming" locale={locale} userId={user.id} />
          ))}
          {(!incoming || incoming.length === 0) && (
            <div className="glass-card p-10 text-center text-muted-foreground text-sm">
              {locale === 'ar' ? 'لا توجد طلبات واردة' : 'No incoming requests yet'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
