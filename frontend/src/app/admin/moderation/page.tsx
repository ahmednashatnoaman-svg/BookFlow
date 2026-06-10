'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Shield, RefreshCw, User, BookOpen, Filter } from 'lucide-react';

interface ModerationLog {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  admin: { id: string; full_name: string; avatar_url: string | null } | null;
}

const ACTION_STYLES: Record<string, string> = {
  listing_removed:     'badge-error',
  listing_restored:    'badge-available',
  user_suspended:      'badge-error',
  user_unsuspended:    'badge-available',
  report_resolved:     'badge-available',
  report_dismissed:    'badge-sold',
  listing_featured:    'badge-new',
  listing_unfeatured:  'badge-sold',
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  listing_removed: BookOpen,
  listing_restored: BookOpen,
  user_suspended: User,
  user_unsuspended: User,
  report_resolved: Shield,
  report_dismissed: Shield,
};

export default function AdminModerationPage() {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/moderation?page=${page}&limit=25`);
    const data = await res.json();
    setLogs(data.data ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Admin Panel</p>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="w-7 h-7 text-primary" /> Moderation Log
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Full audit trail of all admin actions</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Admin
            </Link>
            <button onClick={fetchLogs} className="p-2 glass-card hover:border-primary/40 transition-all rounded-lg">
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Actions', value: total },
            { label: 'Removals', value: logs.filter(l => l.action === 'listing_removed').length },
            { label: 'Suspensions', value: logs.filter(l => l.action === 'user_suspended').length },
            { label: 'Resolved Reports', value: logs.filter(l => l.action === 'report_resolved').length },
          ].map(stat => (
            <div key={stat.label} className="glass-card p-4 text-center">
              <p className="text-2xl font-bold gradient-text">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Log Table */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16">
              <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No moderation actions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-left">
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Admin</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Action</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Target</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Reason</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {logs.map(log => {
                    const Icon = ACTION_ICONS[log.action] ?? Filter;
                    return (
                      <tr key={log.id} className="hover:bg-card/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                              {log.admin?.full_name?.[0] ?? 'A'}
                            </div>
                            <span className="text-xs font-medium">{log.admin?.full_name ?? 'Admin'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${ACTION_STYLES[log.action] ?? 'badge-sold'}`}>
                              {log.action.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                            {log.target_type}: {log.target_id.slice(0, 8)}…
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-muted-foreground line-clamp-1">{log.reason ?? '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > 25 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 glass-card text-sm hover:border-primary/40 transition-all disabled:opacity-40 rounded-lg"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / 25)}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 25 >= total}
              className="px-4 py-2 glass-card text-sm hover:border-primary/40 transition-all disabled:opacity-40 rounded-lg"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
