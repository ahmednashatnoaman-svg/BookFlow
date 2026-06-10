'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { Users, ChevronLeft, RefreshCw, UserX, UserCheck, Shield, AlertCircle } from 'lucide-react';

interface AdminUser {
  id: string;
  full_name: string | null;
  email: string;
  city: string | null;
  role: 'user' | 'admin' | 'suspended';
  created_at: string;
}

const ROLE_STYLES: Record<string, string> = {
  admin:     'bg-amber-500/10 text-amber-400',
  user:      'bg-muted text-muted-foreground',
  suspended: 'bg-destructive/10 text-destructive',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState<{ user: AdminUser; type: 'suspend' | 'unsuspend' } | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAction = async () => {
    if (!actionModal) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionModal.type === 'suspend' ? 'suspend_user' : 'unsuspend_user',
          target_id: actionModal.user.id,
          reason: reason.trim() || undefined,
        }),
      });
      if (!res.ok) {
        setError('Action failed. Please try again.');
        return;
      }
      setActionModal(null);
      setReason('');
      await fetchUsers();
    } finally {
      setSubmitting(false);
    }
  };

  const userCount = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const suspendedCount = users.filter(u => u.role === 'suspended').length;

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
            <p className="text-muted-foreground text-sm">
              {userCount} users · {adminCount} admins · {suspendedCount} suspended
            </p>
          </div>
          <button type="button" onClick={fetchUsers} className="ml-auto p-2 glass-card hover:border-primary/40 transition-all rounded-lg">
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">User</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">City</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">Role</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Joined</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {users.map(u => (
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
                      <td className="px-4 py-3 text-muted-foreground text-sm">{u.city ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_STYLES[u.role] ?? ROLE_STYLES.user}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-end">
                        {u.role !== 'admin' && (
                          u.role === 'suspended' ? (
                            <button
                              type="button"
                              aria-label={`Unsuspend ${u.full_name ?? u.email}`}
                              onClick={() => setActionModal({ user: u, type: 'unsuspend' })}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              aria-label={`Suspend ${u.full_name ?? u.email}`}
                              onClick={() => setActionModal({ user: u, type: 'suspend' })}
                              className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                        {u.role === 'admin' && (
                          <Shield className="w-3.5 h-3.5 text-amber-400 inline" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              {actionModal.type === 'suspend'
                ? <UserX className="w-5 h-5 text-destructive" />
                : <UserCheck className="w-5 h-5 text-emerald-400" />
              }
              <h3 className="font-bold">
                {actionModal.type === 'suspend' ? 'Suspend User' : 'Unsuspend User'}
              </h3>
            </div>

            <p className="text-sm text-muted-foreground mb-1">
              <span className="font-semibold text-foreground">{actionModal.user.full_name ?? actionModal.user.email}</span>
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {actionModal.type === 'suspend'
                ? 'This user will lose access to creating listings and sending requests.'
                : 'This user will regain normal access to BookFlow.'}
            </p>

            {actionModal.type === 'suspend' && (
              <>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Reason <span className="text-muted-foreground font-normal">(shown to user)</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
                  placeholder="Violation of community guidelines"
                />
              </>
            )}

            {error && (
              <div className="flex items-center gap-2 text-destructive text-xs mb-3">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setActionModal(null); setReason(''); setError(''); }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAction}
                disabled={submitting}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 ${
                  actionModal.type === 'suspend'
                    ? 'bg-destructive text-white hover:bg-destructive/90'
                    : 'bg-emerald-500 text-white hover:bg-emerald-500/90'
                }`}
              >
                {submitting ? 'Saving…' : actionModal.type === 'suspend' ? 'Suspend' : 'Unsuspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
