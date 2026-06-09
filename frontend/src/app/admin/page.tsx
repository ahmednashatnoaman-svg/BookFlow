import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, BookOpen, ArrowLeftRight, TrendingUp, AlertTriangle, Settings, Shield } from 'lucide-react';
import Header from '@/components/layout/Header';
import AdminCharts from '@/components/admin/AdminCharts';
import { createClient } from '@/lib/supabase/server';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/');

  const [
    { data: statsRow },
    { data: categoryStats },
    { data: topBooks },
    { data: reports },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from('admin_stats').select('*').single(),
    supabase.from('categories').select('name_en, icon, listing_count:book_listings(count)').limit(12),
    supabase.from('book_listings').select('title, author').eq('status', 'available').order('view_count', { ascending: false }).limit(10),
    supabase.from('reports').select('*').eq('resolved', false).order('created_at', { ascending: false }).limit(5),
    supabase.from('user_profiles').select('id, full_name, email, created_at, role').order('created_at', { ascending: false }).limit(8),
  ]);

  const stats = statsRow ?? {};

  const statCards = [
    { label: 'Total Listings', value: stats.total_listings ?? 0, sub: `${stats.active_listings ?? 0} active`, icon: BookOpen, color: 'text-primary bg-primary/10' },
    { label: 'Total Users', value: stats.total_users ?? 0, sub: `${stats.active_users_30d ?? 0} active (30d)`, icon: Users, color: 'text-teal-400 bg-teal-400/10' },
    { label: 'Exchanges', value: stats.total_exchanges ?? 0, sub: 'completed', icon: ArrowLeftRight, color: 'text-amber-400 bg-amber-400/10' },
    { label: 'Sales', value: stats.total_sales ?? 0, sub: 'completed', icon: TrendingUp, color: 'text-green-400 bg-green-400/10' },
  ];

  const navLinks = [
    { href: '/admin/listings', icon: BookOpen, label: 'Manage Listings' },
    { href: '/admin/users', icon: Users, label: 'Manage Users' },
    { href: '/admin/categories', icon: Settings, label: 'Categories' },
    { href: '/admin/reports', icon: AlertTriangle, label: `Reports ${reports?.length ? `(${reports.length})` : ''}` },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <div className="page-container py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">Platform overview & management</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(card => (
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

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar nav */}
          <div className="lg:col-span-1">
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
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Charts */}
            <AdminCharts categoryStats={categoryStats ?? []} topBooks={topBooks ?? []} />

            {/* Recent reports */}
            {reports && reports.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Unresolved Reports
                </h3>
                <div className="space-y-2">
                  {reports.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                      <div>
                        <p className="text-xs font-semibold">{r.reason}</p>
                        <p className="text-[10px] text-muted-foreground">{r.details?.slice(0, 80) ?? ''}</p>
                      </div>
                      <Link href={`/admin/reports/${r.id}`} className="text-xs text-primary hover:underline">Review</Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent users */}
            <div className="glass-card p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-400" /> Recent Users
              </h3>
              <div className="space-y-2">
                {(recentUsers ?? []).map((u: any) => (
                  <div key={u.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {u.full_name?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-amber-500/10 text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
