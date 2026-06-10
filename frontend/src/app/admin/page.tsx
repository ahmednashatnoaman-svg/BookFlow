import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Users, BookOpen, ArrowLeftRight, TrendingUp, AlertTriangle,
  Settings, Shield, Eye, Star, Activity, Clock,
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
    { label: 'Total Listings', value: s.total_listings ?? 0, sub: `${s.active_listings ?? 0} active`, icon: BookOpen, accent: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total Users', value: s.total_users ?? 0, sub: `${s.active_users_7d ?? 0} active (7d)`, icon: Users, accent: 'text-[hsl(168_76%_42%)]', bg: 'bg-[hsl(168_76%_42%)]/10' },
    { label: 'Exchanges', value: s.total_exchanges ?? 0, sub: 'completed', icon: ArrowLeftRight, accent: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Sales', value: s.total_sales ?? 0, sub: 'completed', icon: TrendingUp, accent: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  const secondaryStats = [
    { label: "Today's Listings", value: s.new_listings_today ?? 0, icon: PlusCircle, color: 'text-primary' },
    { label: "Today's Signups", value: s.new_users_today ?? 0, icon: Users, color: 'text-[hsl(168_76%_42%)]' },
    { label: 'Total Views', value: (s.total_views ?? 0).toLocaleString(), icon: Eye, color: 'text-primary/70' },
    { label: 'Accept Rate', value: `${Math.round((s.acceptance_rate ?? 0) * 100)}%`, icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'Open Reports', value: reports?.length ?? 0, icon: AlertTriangle, color: 'text-amber-400' },
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

        {/* Page header — editorial admin */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="eyebrow text-primary mb-0.5">Control Center</p>
              <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground glass-card px-3 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5" />
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* Primary KPI stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {primaryStats.map(card => (
            <div key={card.label} className="stat-card p-5">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-4`}>
                <card.icon className={`w-5 h-5 ${card.accent}`} />
              </div>
              <p className={`kpi-value text-3xl ${card.accent}`}>{card.value.toLocaleString()}</p>
              <p className="text-xs font-semibold mt-1">{card.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Secondary stats chips */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
          {secondaryStats.map(item => (
            <div key={item.label} className="glass-card p-3.5 text-center">
              <item.icon className={`w-4 h-4 ${item.color} mx-auto mb-1.5`} />
              <p className={`font-display text-xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-card p-3">
              <p className="eyebrow text-muted-foreground px-3 py-1 mb-1">Admin Tools</p>
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} className="admin-nav-item">
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Top sellers */}
            {(topSellers as unknown as { data: { user_id: string; full_name: string; listing_count: number }[] | null })?.data?.length ? (
              <div className="glass-card p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" /> Top Sellers
                </h3>
                <div className="space-y-2.5">
                  {((topSellers as unknown as { data: { user_id: string; full_name: string; listing_count: number }[] }).data ?? []).map((s: { user_id: string; full_name: string; listing_count: number }, i: number) => (
                    <div key={s.user_id} className="flex items-center gap-2">
                      <span className="font-display text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                      <p className="text-xs font-medium truncate flex-1">{s.full_name}</p>
                      <span className="text-[10px] text-primary font-semibold">{s.listing_count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            <AdminCharts categoryStats={categoryStats ?? []} topBooks={topBooks ?? []} />

            {/* Most viewed */}
            {topBooks && topBooks.length > 0 && (
              <div className="glass-card p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" /> Most Viewed Listings
                </h3>
                <div className="space-y-0">
                  {topBooks.map((b: { id: string; title: string; author: string; view_count: number; status: string }, i: number) => (
                    <div key={b.id} className="flex items-center gap-3 py-3 border-b border-border/25 last:border-0">
                      <span className="font-display text-lg font-bold text-muted-foreground/40 w-6 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{b.title}</p>
                        <p className="text-[10px] text-muted-foreground">{b.author}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold text-primary">{b.view_count.toLocaleString()} views</p>
                        <span className={`text-[10px] ${b.status === 'available' ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                          {b.status}
                        </span>
                      </div>
                      <Link href={`/books/${b.id}`} className="text-[10px] text-primary hover:text-primary/70 transition-colors shrink-0 font-medium">
                        View →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unresolved reports */}
            {reports && reports.length > 0 && (
              <div className="glass-card p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Unresolved Reports
                  <span className="ms-auto badge-pending text-[10px] px-2 py-0.5 rounded-full font-bold">{reports.length}</span>
                </h3>
                <div className="space-y-2">
                  {reports.map((r: Record<string, unknown>) => (
                    <div key={r.id as string}
                      className="flex items-start justify-between gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">{r.reason as string}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                          {(r.details as string)?.slice(0, 80) ?? ''}
                        </p>
                      </div>
                      <Link href="/admin/reports"
                        className="text-xs text-primary hover:text-primary/70 font-medium transition-colors shrink-0"
                      >
                        Review →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent signups */}
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-[hsl(168_76%_42%)]" /> Recent Signups
              </h3>
              <div className="space-y-0">
                {(recentUsers ?? []).map((u: Record<string, unknown>) => (
                  <div key={u.id as string}
                    className="flex items-center gap-3 py-3 border-b border-border/25 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-teal-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {(u.full_name as string)?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{u.full_name as string}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email as string}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.role === 'admin' ? 'badge-new' : 'badge-sold'
                      }`}>
                        {u.role as string}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(u.created_at as string).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/admin/users"
                className="block text-center text-xs text-primary hover:text-primary/70 font-medium mt-3 transition-colors"
              >
                Manage all users →
              </Link>
            </div>

            {/* Recent listings */}
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> Recent Listings
              </h3>
              <div className="space-y-0">
                {(recentListings ?? []).map((l: Record<string, unknown>) => (
                  <div key={l.id as string}
                    className="flex items-center gap-3 py-3 border-b border-border/25 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <Link href={`/books/${l.id}`}
                        className="text-xs font-semibold hover:text-primary transition-colors truncate block"
                      >
                        {l.title as string}
                      </Link>
                      <p className="text-[10px] text-muted-foreground">{l.author as string}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {l.status === 'available'
                        ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        : <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                      }
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(l.created_at as string).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/admin/listings"
                className="block text-center text-xs text-primary hover:text-primary/70 font-medium mt-3 transition-colors"
              >
                Manage all listings →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
