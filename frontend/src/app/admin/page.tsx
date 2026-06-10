import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Users, BookOpen, ArrowLeftRight, TrendingUp, AlertTriangle,
  Settings, Shield, Eye, Star, Activity, BarChart3, Clock,
  CheckCircle, XCircle, PlusCircle,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import AdminCharts from '@/components/admin/AdminCharts';
import { createClient } from '@/lib/supabase/server';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/');

  const [
    { data: statsRow },
    { data: categoryStats },
    { data: topBooks },
    { data: reports },
    { data: recentUsers },
    { data: topSellers },
    { data: recentListings },
  ] = await Promise.all([
    supabase.from('admin_stats').select('*').single(),
    supabase.from('categories').select('name_en, icon, listing_count:book_listings(count)').limit(12),
    supabase.from('book_listings').select('id, title, author, view_count, status').eq('status', 'available').order('view_count', { ascending: false }).limit(5),
    supabase.from('reports').select('*').eq('resolved', false).order('created_at', { ascending: false }).limit(5),
    supabase.from('user_profiles').select('id, full_name, email, created_at, role').order('created_at', { ascending: false }).limit(8),
    Promise.resolve(supabase.rpc('get_top_sellers', { p_limit: 5 })).catch(() => ({ data: null })),
    supabase.from('book_listings').select('id, title, author, status, created_at, user_id').order('created_at', { ascending: false }).limit(6),
  ]);

  const s = (statsRow ?? {}) as Record<string, number>;

  const primaryStats = [
    { label: 'Total Listings', value: s.total_listings ?? 0, sub: `${s.active_listings ?? 0} active`, icon: BookOpen, color: 'text-primary bg-primary/10' },
    { label: 'Total Users', value: s.total_users ?? 0, sub: `${s.active_users_7d ?? 0} active (7d)`, icon: Users, color: 'text-teal-400 bg-teal-400/10' },
    { label: 'Exchanges', value: s.total_exchanges ?? 0, sub: 'completed', icon: ArrowLeftRight, color: 'text-amber-400 bg-amber-400/10' },
    { label: 'Sales', value: s.total_sales ?? 0, sub: 'completed', icon: TrendingUp, color: 'text-green-400 bg-green-400/10' },
  ];

  const secondaryStats = [
    { label: "Today's Listings", value: s.new_listings_today ?? 0, icon: PlusCircle, color: 'text-primary' },
    { label: "Today's Signups", value: s.new_users_today ?? 0, icon: Users, color: 'text-teal-400' },
    { label: 'Total Views', value: (s.total_views ?? 0).toLocaleString(), icon: Eye, color: 'text-blue-400' },
    { label: 'Acceptance Rate', value: `${Math.round((s.acceptance_rate ?? 0) * 100)}%`, icon: CheckCircle, color: 'text-green-400' },
    { label: 'Pending Reports', value: reports?.length ?? 0, icon: AlertTriangle, color: 'text-amber-400' },
    { label: 'Admins', value: s.total_admins ?? 0, icon: Shield, color: 'text-rose-400' },
  ];

  const navLinks = [
    { href: '/admin/listings', icon: BookOpen, label: 'Manage Listings' },
    { href: '/admin/users', icon: Users, label: 'Manage Users' },
    { href: '/admin/moderation', icon: Activity, label: 'Moderation' },
    { href: '/admin/categories', icon: Settings, label: 'Categories' },
    { href: '/admin/reports', icon: AlertTriangle, label: `Reports${reports?.length ? ` (${reports.length})` : ''}` },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <div className="page-container py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm">Platform overview & management</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 inline me-1" />
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* Primary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {primaryStats.map(card => (
            <div key={card.label} className="glass-card p-4">
              <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
                <card.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
              <p className="text-xs font-semibold">{card.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Secondary stats — smaller chips */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
          {secondaryStats.map(item => (
            <div key={item.label} className="glass-card p-3 text-center">
              <item.icon className={`w-4 h-4 ${item.color} mx-auto mb-1.5`} />
              <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar nav */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-card p-3 space-y-1">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors text-sm"
                >
                  <link.icon className="w-4 h-4 text-muted-foreground" />
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Top sellers */}
            {(topSellers as unknown as { data: { user_id: string; full_name: string; listing_count: number }[] | null })?.data?.length ? (
              <div className="glass-card p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" /> Top Sellers
                </h3>
                <div className="space-y-2">
                  {((topSellers as unknown as { data: { user_id: string; full_name: string; listing_count: number }[] }).data ?? []).map((s: { user_id: string; full_name: string; listing_count: number }, i: number) => (
                    <div key={s.user_id} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}.</span>
                      <p className="text-xs font-medium truncate flex-1">{s.full_name}</p>
                      <span className="text-[10px] text-muted-foreground">{s.listing_count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Charts */}
            <AdminCharts categoryStats={categoryStats ?? []} topBooks={topBooks ?? []} />

            {/* Most viewed books */}
            {topBooks && topBooks.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-400" /> Most Viewed Listings
                </h3>
                <div className="space-y-2">
                  {topBooks.map((b: { id: string; title: string; author: string; view_count: number; status: string }, i: number) => (
                    <div key={b.id} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                      <span className="text-xs font-bold text-muted-foreground w-5 flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{b.title}</p>
                        <p className="text-[10px] text-muted-foreground">{b.author}</p>
                      </div>
                      <div className="text-end flex-shrink-0">
                        <p className="text-xs font-semibold text-blue-400">{b.view_count} views</p>
                        <span className={`text-[10px] ${b.status === 'available' ? 'text-green-400' : 'text-muted-foreground'}`}>
                          {b.status}
                        </span>
                      </div>
                      <Link href={`/books/${b.id}`} className="text-[10px] text-primary hover:underline flex-shrink-0">
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent reports */}
            {reports && reports.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Unresolved Reports
                </h3>
                <div className="space-y-2">
                  {reports.map((r: Record<string, unknown>) => (
                    <div key={r.id as string} className="flex items-center justify-between p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                      <div>
                        <p className="text-xs font-semibold">{r.reason as string}</p>
                        <p className="text-[10px] text-muted-foreground">{(r.details as string)?.slice(0, 80) ?? ''}</p>
                      </div>
                      <Link href={`/admin/reports`} className="text-xs text-primary hover:underline">Review</Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent users */}
            <div className="glass-card p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-400" /> Recent Signups
              </h3>
              <div className="space-y-2">
                {(recentUsers ?? []).map((u: Record<string, unknown>) => (
                  <div key={u.id as string} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {(u.full_name as string)?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{u.full_name as string}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email as string}</p>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-amber-500/10 text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                        {u.role as string}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(u.created_at as string).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/admin/users" className="block text-center text-xs text-primary hover:underline mt-3">
                Manage all users →
              </Link>
            </div>

            {/* Recent listings */}
            <div className="glass-card p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> Recent Listings
              </h3>
              <div className="space-y-2">
                {(recentListings ?? []).map((l: Record<string, unknown>) => (
                  <div key={l.id as string} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                    <div className="flex-1 min-w-0">
                      <Link href={`/books/${l.id}`} className="text-xs font-semibold hover:text-primary transition-colors truncate block">{l.title as string}</Link>
                      <p className="text-[10px] text-muted-foreground">{l.author as string}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {l.status === 'available'
                        ? <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                        : <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                      }
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(l.created_at as string).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/admin/listings" className="block text-center text-xs text-primary hover:underline mt-3">
                Manage all listings →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
