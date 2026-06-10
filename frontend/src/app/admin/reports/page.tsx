'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Flag, CheckCircle, XCircle, Eye, RefreshCw,
  User, BookOpen, Filter, AlertTriangle,
} from 'lucide-react';

type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';

interface Report {
  id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  resolved_at: string | null;
  admin_note: string | null;
  reporter: { id: string; full_name: string; email: string } | null;
  listing: { id: string; title: string; author: string; cover_image: string | null; status: string } | null;
  reported_user: { id: string; full_name: string; email: string } | null;
  admin: { id: string; full_name: string } | null;
}

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: 'badge-pending',
  reviewing: 'badge-new',
  resolved: 'badge-available',
  dismissed: 'badge-sold',
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [page, setPage] = useState(1);
  const [actionModal, setActionModal] = useState<{ report: Report; action: string } | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/reports?status=${statusFilter}&page=${page}&limit=20`);
    const data = await res.json();
    setReports(data.data ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [statusFilter, page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleAction = async () => {
    if (!actionModal) return;
    setSubmitting(true);
    await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_id: actionModal.report.id, action: actionModal.action, note }),
    });
    setActionModal(null);
    setNote('');
    setSubmitting(false);
    fetchReports();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold text-destructive uppercase tracking-widest mb-1">Admin Panel</p>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Flag className="w-7 h-7 text-destructive" /> Reports Management
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Admin
            </Link>
            <button onClick={fetchReports} className="p-2 glass-card hover:border-primary/40 transition-all rounded-lg">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {['pending', 'reviewing', 'resolved', 'dismissed', 'all'].map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <span className="ml-auto text-sm text-muted-foreground">{total} total</span>
        </div>

        {/* Reports Table */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-muted-foreground">No {statusFilter} reports</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-left">
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Reporter</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Target</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Reason</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {reports.map(report => (
                    <tr key={report.id} className="hover:bg-card/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="font-medium text-xs">{report.reporter?.full_name ?? 'Unknown'}</p>
                            <p className="text-[10px] text-muted-foreground">{report.reporter?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {report.listing ? (
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                            <div>
                              <p className="font-medium text-xs line-clamp-1">{report.listing.title}</p>
                              <p className="text-[10px] text-muted-foreground">{report.listing.author}</p>
                            </div>
                          </div>
                        ) : report.reported_user ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-destructive flex-shrink-0" />
                            <p className="text-xs font-medium">{report.reported_user.full_name}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium">{report.reason}</p>
                        {report.details && (
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{report.details}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[report.status]}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {report.status === 'pending' || report.status === 'reviewing' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setActionModal({ report, action: 'resolve' })}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                              title="Resolve"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setActionModal({ report, action: 'dismiss' })}
                              className="p-1.5 rounded-lg bg-muted/40 text-muted-foreground hover:bg-muted/60 transition-all"
                              title="Dismiss"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Eye className="w-3.5 h-3.5" />
                            <span className="text-xs">{report.admin?.full_name ?? '—'}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 glass-card text-sm hover:border-primary/40 transition-all disabled:opacity-40 rounded-lg"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / 20)}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 20 >= total}
              className="px-4 py-2 glass-card text-sm hover:border-primary/40 transition-all disabled:opacity-40 rounded-lg"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold">
                {actionModal.action === 'resolve' ? 'Resolve Report' : 'Dismiss Report'}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {actionModal.action === 'resolve'
                ? 'Mark this report as resolved. The reported content will be reviewed.'
                : 'Dismiss this report as invalid or already handled.'}
            </p>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Admin Note (optional)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
              placeholder="Add a note about your decision..."
            />
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => { setActionModal(null); setNote(''); }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={submitting}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  actionModal.action === 'resolve'
                    ? 'bg-emerald-500 text-white hover:bg-emerald-500/90'
                    : 'bg-muted/60 text-foreground hover:bg-muted'
                }`}
              >
                {submitting ? 'Saving...' : actionModal.action === 'resolve' ? 'Resolve' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
