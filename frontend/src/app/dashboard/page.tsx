import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen, ArrowLeftRight, Heart, Clock, Bell, Plus, ChevronRight,
  TrendingUp, Eye, Star, Activity, Edit2,
} from 'lucide-react';
import { getLocale } from 'next-intl/server';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/server';
import { formatRelativeTime } from '@/lib/utils';

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
    { icon: BookOpen, label: locale === 'ar' ? 'الكتب النشطة' : 'Active Listings', value: us.active_listings ?? 0, href: '/dashboard/listings', accent: 'text-primary', bg: 'bg-primary/10', glow: 'hover:shadow-primary/10' },
    { icon: ArrowLeftRight, label: locale === 'ar' ? 'الطلبات المعلقة' : 'Pending Requests', value: us.requests_sent ?? 0, href: '/dashboard/requests', accent: 'text-[hsl(168_76%_42%)]', bg: 'bg-[hsl(168_76%_42%)]/10', glow: 'hover:shadow-teal-500/10' },
    { icon: Heart, label: locale === 'ar' ? 'قائمة الرغبات' : 'Wishlist', value: us.wishlist_count ?? 0, href: '/dashboard/wishlist', accent: 'text-rose-400', bg: 'bg-rose-500/10', glow: 'hover:shadow-rose-500/10' },
    { icon: TrendingUp, label: locale === 'ar' ? 'الصفقات المكتملة' : 'Completed', value: us.total_transactions ?? 0, href: '/dashboard/history', accent: 'text-primary', bg: 'bg-primary/10', glow: 'hover:shadow-primary/10' },
  ];

  const activityStats = [
    { label: locale === 'ar' ? 'إجمالي' : 'Total', value: us.total_listings ?? 0, icon: BookOpen, color: 'text-primary' },
    { label: locale === 'ar' ? 'مُباع' : 'Sold', value: us.books_sold ?? 0, icon: Star, color: 'text-emerald-400' },
    { label: locale === 'ar' ? 'تبادل' : 'Exchanged', value: us.books_exchanged ?? 0, icon: ArrowLeftRight, color: 'text-[hsl(168_76%_42%)]' },
    { label: locale === 'ar' ? 'مشاهدات' : 'Views', value: (us.total_views ?? 0).toLocaleString(), icon: Eye, color: 'text-primary/70' },
    { label: locale === 'ar' ? 'طلبات' : 'Req. In', value: us.requests_received ?? 0, icon: Activity, color: 'text-primary' },
  ];

  const navItems = [
    { href: '/dashboard/listings', icon: BookOpen, label: locale === 'ar' ? 'كتبي' : 'My Books' },
    { href: '/dashboard/requests', icon: ArrowLeftRight, label: locale === 'ar' ? 'الطلبات' : 'Requests' },
    { href: '/dashboard/wishlist', icon: Heart, label: locale === 'ar' ? 'المفضلة' : 'Wishlist' },
    { href: '/dashboard/history', icon: Clock, label: locale === 'ar' ? 'السجل' : 'History' },
    { href: '/dashboard/profile', icon: Star, label: locale === 'ar' ? 'الملف الشخصي' : 'Profile' },
  ];

  const memberSince = us.member_since
    ? new Date(us.member_since).toLocaleDateString(locale === 'ar' ? 'ar' : 'en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="page-container py-8">

        {/* Welcome banner — editorial */}
        <div className="relative glass-card p-6 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/6 via-transparent to-[hsl(168_76%_42%)]/5 pointer-events-none rounded-xl" />
          <div className="absolute bottom-0 right-0 w-48 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-primary mb-1.5">
                {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
              </p>
              <h1 className="font-display text-2xl font-bold mb-1">
                {locale === 'ar' ? `مرحباً، ${profile?.full_name}` : `Welcome back, ${profile?.full_name}`}
              </h1>
              <p className="text-sm text-muted-foreground">
                {memberSince
                  ? (locale === 'ar' ? `عضو منذ ${memberSince}` : `Member since ${memberSince}`)
                  : (locale === 'ar' ? 'نظرة عامة على حسابك' : "Here's your account overview")
                }
              </p>
            </div>
            <Link href="/list-book" className="btn-primary shrink-0 text-sm py-2.5 px-4 rounded-xl">
              <Plus className="w-4 h-4" />
              {locale === 'ar' ? 'أضف كتاباً' : 'List Book'}
            </Link>
          </div>
        </div>

        {/* Primary KPI stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {primaryStats.map(stat => (
            <Link key={stat.href} href={stat.href}
              className={`stat-card p-5 group hover:shadow-lg transition-all ${stat.glow}`}
            >
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-4`}>
                <stat.icon className={`w-5 h-5 ${stat.accent}`} />
              </div>
              <p className={`kpi-value text-3xl ${stat.accent}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center justify-between">
                {stat.label}
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
              </p>
            </Link>
          ))}
        </div>

        {/* Activity strip */}
        <div className="grid grid-cols-5 gap-3 mb-8">
          {activityStats.map(item => (
            <div key={item.label} className="glass-card p-3.5 text-center">
              <item.icon className={`w-4 h-4 ${item.color} mx-auto mb-1.5`} />
              <p className={`font-display text-xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent listings */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-lg">
                  {locale === 'ar' ? 'آخر الإعلانات' : 'Recent Listings'}
                </h2>
                <Link href="/dashboard/listings" className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                  {locale === 'ar' ? 'عرض الكل' : 'View all'} →
                </Link>
              </div>
              {recentListings && recentListings.length > 0 ? (
                <div className="space-y-2">
                  {recentListings.map((listing: Record<string, unknown>) => {
                    const cat = listing.category as { icon?: string } | null;
                    return (
                      <div key={listing.id as string}
                        className="glass-card-hover p-3.5 flex items-center gap-3"
                      >
                        <div className="w-10 h-12 rounded-lg bg-muted/40 flex-shrink-0 flex items-center justify-center text-xl">
                          {cat?.icon ?? '📚'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/books/${listing.id}`}
                            className="text-sm font-semibold truncate block hover:text-primary transition-colors"
                          >
                            {listing.title as string}
                          </Link>
                          <p className="text-xs text-muted-foreground truncate">{listing.author as string}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Eye className="w-2.5 h-2.5" />
                            {listing.view_count as number} · {formatRelativeTime(listing.created_at as string, locale)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            listing.status === 'available' ? 'badge-available' : 'badge-sold'
                          }`}>
                            {listing.status as string}
                          </span>
                          <Link href={`/dashboard/listings/${listing.id as string}/edit`}
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
                <div className="glass-card p-10 text-center">
                  <BookOpen className="w-10 h-10 text-muted-foreground/25 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">
                    {locale === 'ar' ? 'لا توجد إعلانات بعد' : 'No listings yet'}
                  </p>
                  <Link href="/list-book" className="btn-ghost-amber text-xs py-2 px-4">
                    {locale === 'ar' ? 'أضف كتابك الأول' : 'List your first book'}
                  </Link>
                </div>
              )}
            </div>

            {/* Pending requests */}
            {pendingRequests && pendingRequests.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display font-semibold text-lg">
                    {locale === 'ar' ? 'الطلبات المعلقة' : 'Pending Requests'}
                  </h2>
                  <Link href="/dashboard/requests" className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                    {locale === 'ar' ? 'عرض الكل' : 'View all'} →
                  </Link>
                </div>
                <div className="space-y-2">
                  {pendingRequests.map((req: Record<string, unknown>) => {
                    const listing = req.listing as { title: string } | null;
                    return (
                      <div key={req.id as string}
                        className="glass-card p-3.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{listing?.title ?? 'Book'}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatRelativeTime(req.created_at as string, locale)}
                          </p>
                        </div>
                        <span className="badge-pending text-[10px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0">
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
            <div className="glass-card p-3">
              <p className="eyebrow text-muted-foreground px-3 py-1 mb-1">
                {locale === 'ar' ? 'التنقل السريع' : 'Quick Nav'}
              </p>
              {navItems.map(item => (
                <Link key={item.href} href={item.href} className="admin-nav-item">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  <ChevronRight className="w-3.5 h-3.5 ms-auto" />
                </Link>
              ))}
            </div>

            {/* Unread notifications */}
            {notifications && notifications.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  {locale === 'ar' ? 'إشعارات جديدة' : 'New Notifications'}
                  <span className="ms-auto badge-new text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {notifications.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {notifications.map((n: Record<string, unknown>) => (
                    <div key={n.id as string}
                      className="p-2.5 bg-primary/6 rounded-lg border border-primary/10"
                    >
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
