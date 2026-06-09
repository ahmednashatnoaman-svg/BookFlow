import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, ArrowLeftRight, Heart, Clock, Bell, Plus, ChevronRight, TrendingUp } from 'lucide-react';
import { getLocale } from 'next-intl/server';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/server';
import { formatRelativeTime } from '@/lib/utils';

export default async function DashboardPage() {
  const locale = await getLocale() as 'en' | 'ar';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [
    { data: profile },
    { count: listingsCount },
    { count: requestsCount },
    { count: wishlistCount },
    { count: txCount },
    { data: notifications },
    { data: recentListings },
  ] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('book_listings').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'available'),
    supabase.from('book_requests').select('*', { count: 'exact', head: true }).eq('requester_id', user.id).eq('status', 'pending'),
    supabase.from('wishlist').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('transactions').select('*', { count: 'exact', head: true }).or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`),
    supabase.from('notifications').select('*').eq('user_id', user.id).eq('read', false).order('created_at', { ascending: false }).limit(5),
    supabase.from('book_listings').select('*, category:categories(name_en, name_ar, icon)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
  ]);

  const stats = [
    { icon: BookOpen, label: locale === 'ar' ? 'الكتب المعروضة' : 'Active Listings', value: listingsCount ?? 0, href: '/dashboard/listings', color: 'text-primary bg-primary/10' },
    { icon: ArrowLeftRight, label: locale === 'ar' ? 'الطلبات المعلقة' : 'Pending Requests', value: requestsCount ?? 0, href: '/dashboard/requests', color: 'text-teal-400 bg-teal-400/10' },
    { icon: Heart, label: locale === 'ar' ? 'قائمة الرغبات' : 'Wishlist', value: wishlistCount ?? 0, href: '/dashboard/wishlist', color: 'text-rose-400 bg-rose-400/10' },
    { icon: TrendingUp, label: locale === 'ar' ? 'الصفقات المكتملة' : 'Completed Deals', value: txCount ?? 0, href: '/dashboard/history', color: 'text-amber-400 bg-amber-400/10' },
  ];

  const navItems = [
    { href: '/dashboard/listings', icon: BookOpen, label: locale === 'ar' ? 'كتبي' : 'My Books' },
    { href: '/dashboard/requests', icon: ArrowLeftRight, label: locale === 'ar' ? 'الطلبات' : 'Requests' },
    { href: '/dashboard/wishlist', icon: Heart, label: locale === 'ar' ? 'المفضلة' : 'Wishlist' },
    { href: '/dashboard/history', icon: Clock, label: locale === 'ar' ? 'السجل' : 'History' },
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
              {locale === 'ar' ? 'هنا لوحة تحكم حسابك' : "Here's your account overview"}
            </p>
          </div>
          <Link href="/list-book"
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> {locale === 'ar' ? 'أضف كتاباً' : 'List Book'}
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(stat => (
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent listings */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{locale === 'ar' ? 'آخر الإعلانات' : 'Recent Listings'}</h2>
              <Link href="/dashboard/listings" className="text-xs text-primary hover:underline">{locale === 'ar' ? 'عرض الكل' : 'View all'}</Link>
            </div>
            {recentListings && recentListings.length > 0 ? (
              <div className="space-y-2">
                {recentListings.map((listing: any) => (
                  <Link key={listing.id} href={`/books/${listing.id}`}
                    className="glass-card p-3 flex items-center gap-3 hover:border-primary/40 transition-all"
                  >
                    <div className="w-10 h-12 rounded-lg bg-muted/40 flex-shrink-0 flex items-center justify-center text-lg">
                      {listing.category?.icon ?? '📚'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{listing.title}</p>
                      <p className="text-xs text-muted-foreground">{listing.author}</p>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${listing.status === 'available' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                        {listing.status}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(listing.created_at, locale)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="glass-card p-8 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">{locale === 'ar' ? 'لا توجد إعلانات بعد' : 'No listings yet'}</p>
                <Link href="/list-book" className="text-primary text-sm hover:underline font-medium">{locale === 'ar' ? 'أضف كتابك الأول' : 'List your first book'}</Link>
              </div>
            )}
          </div>

          {/* Notifications + Nav */}
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

            {/* Notifications */}
            {notifications && notifications.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" /> {locale === 'ar' ? 'الإشعارات الجديدة' : 'New Notifications'}
                </h3>
                <div className="space-y-2">
                  {notifications.map((n: any) => (
                    <div key={n.id} className="p-2.5 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-xs font-semibold">{n.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{n.body}</p>
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
