import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/server';
import { Users, ChevronLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/');

  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, city, role, created_at, listing_count, exchange_count')
    .order('created_at', { ascending: false })
    .limit(100);

  const userCount = users?.length ?? 0;
  const adminCount = users?.filter(u => u.role === 'admin').length ?? 0;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="page-container py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">User Management</h1>
            <p className="text-muted-foreground text-sm">{userCount} users · {adminCount} admins</p>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">User</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">City</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">Role</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {(users ?? []).map((u: any) => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {u.full_name?.[0]?.toUpperCase() ?? 'U'}
                        </div>
                        <div>
                          <p className="font-medium">{u.full_name ?? 'No name'}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.city ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-amber-500/10 text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                      {formatDate(u.created_at, 'en')}
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
