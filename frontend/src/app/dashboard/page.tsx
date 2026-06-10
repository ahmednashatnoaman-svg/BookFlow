import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen, ArrowLeftRight, Heart, Clock, Bell, Plus, ChevronRight,
  TrendingUp, Eye, Star, Activity, Edit2,
} from 'lucide-react';
import { getLocale } from 'next-intl/server';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/server';
import { formatRelativeTime, formatPrice } from '@/lib/utils';

interface UserStats {
  total_listings: number;
  active_listings: number;
  sold_listings: number;
  exchanged_listings: number;
  requests_sent: number;
  requests_received: number;
  total_transactions: number;
  books_sold: number;
  books_exchanged: number;
  wishlist_count: number;
  total_views: number;
  member_since: string;
}

export default async function DashboardPage() {
  const locale = await getLocale() as 'en' | 'ar';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [
    { data: profile },
    { data: userStatsRaw },
    { data: notifications },
    { data: recentListings },
    { data: pendingRequests },
  ] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    Promise.resolve(supabase.rpc('get_user_stats', { p_user_id: user.id })).catch(() => ({ data: null })),
    supabase.from('notifications').select('*').eq('user_id', user.id).eq('read', false).order('created_at', { ascending: false }).limit(4),
    supabase.from('book_listings').select('*, category:categories(name_en, name_ar, icon)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
    supabase.from('book_requests').select('id, status, created_at, listing:book_listings(title)').eq('requester_id', user.id).eq('status', 'pending').order('created_at', { ascending: false }).limit(3),
  ]);

  const us: UserStats = (userStatsRaw ?? {}) as UserStats;

  const primaryStats = [
    { icon: BookOpen, label: locale === 'ar' ? 'الكتب المعروضة' : 'Active Listings', value: us.active_listings ?? 0, href: '/dashboard/listings', color: 'text-primary bg-primary/10' },
    { icon: ArrowLeftRight, label: locale === 'ar' ? 'الطلبات المعلقة' : 'Pending Requests', value: us.requests_sent ?? 0, href: '/dashboard/requests', color: 'text-teal-400 bg-teal-400/10' },
    { icon: Heart, label: locale === 'ar' ? 'قائمة الرغبات' : 'Wishlist', value: us.wishlist_count ?? 0, href: '/dashboard/wishlist', color: 'text-rose-400 bg-rose-400/10' },
    { icon: TrendingUp, label: locale === 'ar' ? 'الصفقات المكتملة' : 'Completed Deals', value: us.total_transactions ?? 0, href: '/dashboard/history', color: 'text-amber-400 bg-amber-400/10' },
  ];

  const activityStats = [
    { label: locale === 'ar' ? 'إجمالي الكتب' : 'Total Books', value: us.total_listings ?? 0, icon: BookOpen, color: 'text-primary' },
    { label: locale === 'ar' ? 'مُباع' : 'Sold', value: us.books_sold ?? 0, icon: Star, color: 'text-green-400' },
    { label: locale === 'ar' ? 'مُتبادل' : 'Exchanged', value: us.books_exchanged ?? 0, icon: ArrowLeftRight, color: 'text-teal-400' },
    { label: locale === 'ar' ? 'مشاهدات' : 'Views', value: (us.total_views ?? 0).toLocaleString(), icon: Eye, color: 'text-blue-400' },
    { label: locale === 'ar' ? 'طلبات استلمتها' : 'Requests In', value: us.requests_received ?? 0, icon: Activity, color: 'text-amber-400' },
  ];

  const navItems = [
    { href: '/dashboard/listings', icon: BookOpen, label: locale === 'ar' ? 'كتبي' : 'My Books' },
    { href: '/dashboard/requests', icon: ArrowLeftRight, label: locale === 'ar' ? 'الطلبات' : 'Requests' },
    { href: '/dashboard/wishlist', icon: Heart, label: locale === 'ar' ? 'المفضلة' : 'Wishlist' },
    { href: '/dashboard/history', icon: Clock, label: locale === 'ar' ? 'السجل' : 'History' },
    { href: '/dashboard/profile', icon: Star, label: locale === 'ar' ? 'الملف الشخصي' : 'Profile' },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <div className="page-container py-8">
        {/* Welcome banner */}
        <div className="glass-card p-5 mb-6 bg-gradient-to-r from-primary/10 to-teal-500/5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              {locale === 'ar' ? `مرحباً، ${profile?.full_name}` : `Welcome back, ${profile?.full_name}`} 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {us.member_since
                ? (locale === 'ar' ? `عضو منذ ${new Date(us.member_since).toLocaleDateString('ar')}` : `Member since ${new Date(us.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`)
                : (locale === 'ar' ? 'هنا لوحة تحكم حسابك' : "Here's your account overview")
              }
            </p>
          </div>
          <Link href="/list-book"
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> {locale === 'ar' ? 'أضف كتاباً' : 'List Book'}
          </Link>
        </div>

        {/* Primary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {primaryStats.map(stat => (
            <Link key={stat.href} href={stat.href} className="glass-card p-4 hover:border-primary/40 transition-all group">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-between">
                {stat.label} <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </Link>
          ))}
        </div>

        {/* Activity mini-stats */}
        <div className="grid grid-cols-5 gap-3 mb-8">
          {activityStats.map(item => (
            <div key={item.label} className="glass-card p-3 text-center">
              <item.icon className={`w-4 h-4 ${item.color} mx-auto mb-1`} />
              <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
              <p className="text-[9px] text-muted-foreground leading-tight">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent listings */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">{locale === 'ar' ? 'آخر الإعلانات' : 'Recent Listings'}</h2>
                <Link href="/dashboard/listings" className="text-xs text-primary hover:underline">{locale === 'ar' ? 'عرض الكل' : 'View all'}</Link>
              </div>
              {recentListings && recentListings.length > 0 ? (
                <div className="space-y-2">
                  {recentListings.map((listing: Record<string, unknown>) => {
                    const cat = listing.category as { icon?: string } | null;
                    return (
                      <div key={listing.id as string} className="glass-card p-3 flex items-center gap-3">
                        <div className="w-10 h-12 rounded-lg bg-muted/40 flex-shrink-0 flex items-center justify-center text-lg">
                          {cat?.icon ?? '📚'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/books/${listing.id}`} className="text-sm font-semibold truncate block hover:text-primary transition-colors">{listing.title as string}</Link>
                          <p className="text-xs text-muted-foreground">{listing.author as string}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Eye className="w-2.5 h-2.5" />{listing.view_count as number} views · {formatRelativeTime(listing.created_at as string, locale)}
                          </p>
                        </div>
                        <div className="text-end flex-shrink-0 flex items-center gap-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${listing.status === 'available' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                            {listing.status as string}
                          </span>
                          <Link href={`/dashboard/listings/${listing.id}/edit`}
                            className="p-1.5 hover:bg-muted/50 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="glass-card p-8 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">{locale === 'ar' ? 'لا توجد إعلانات بعد' : 'No listings yet'}</p>
                  <Link href="/list-book" className="text-primary text-sm hover:underline font-medium">{locale === 'ar' ? 'أضف كتابك الأول' : 'List your first book'}</Link>
                </div>
              )}
            </div>

            {/* Pending requests */}
            {pendingRequests && pendingRequests.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">{locale === 'ar' ? 'الطلبات المعلقة' : 'Pending Requests'}</h2>
                  <Link href="/dashboard/requests" className="text-xs text-primary hover:underline">{locale === 'ar' ? 'عرض الكل' : 'View all'}</Link>
                </div>
                <div className="space-y-2">
                  {pendingRequests.map((req: Record<string, unknown>) => {
                    const listing = req.listing as { title: string } | null;
                    return (
                      <div key={req.id as string} className="glass-card p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{listing?.title ?? 'Book'}</p>
                          <p className="text-[10px] text-muted-foreground">{formatRelativeTime(req.created_at as string, locale)}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold flex-shrink-0">
                          pending
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick nav */}
            <div className="glass-card p-3 space-y-1">
              {navItems.map(item => (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors text-sm"
                >
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                  {item.label}
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ms-auto" />
                </Link>
              ))}
            </div>

            {/* Unread notifications */}
            {notifications && notifications.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" /> {locale === 'ar' ? 'الإشعارات الجديدة' : 'New Notifications'}
                </h3>
                <div className="space-y-2">
                  {notifications.map((n: Record<string, unknown>) => (
                    <div key={n.id as string} className="p-2.5 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-xs font-semibold">{n.title as string}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.body as string}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
