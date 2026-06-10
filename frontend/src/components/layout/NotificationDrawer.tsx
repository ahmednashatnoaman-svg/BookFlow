'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell, X, CheckCheck, BookOpen, ArrowLeftRight,
  Heart, AlertCircle, Sparkles, RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, string>;
  read: boolean;
  created_at: string;
}

const ICON_MAP: Record<string, { Icon: React.ElementType; color: string }> = {
  request_received:   { Icon: BookOpen,       color: 'text-primary bg-primary/15' },
  request_accepted:   { Icon: ArrowLeftRight, color: 'text-emerald-400 bg-emerald-400/15' },
  request_rejected:   { Icon: X,              color: 'text-destructive bg-destructive/15' },
  wishlist_available: { Icon: Heart,          color: 'text-rose-400 bg-rose-400/15' },
  exchange_completed: { Icon: ArrowLeftRight, color: 'text-teal-400 bg-teal-400/15' },
  listing_removed:    { Icon: AlertCircle,    color: 'text-destructive bg-destructive/15' },
  account_suspended:  { Icon: AlertCircle,    color: 'text-destructive bg-destructive/15' },
  system:             { Icon: Sparkles,       color: 'text-primary bg-primary/15' },
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationDrawer() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=20');
      if (!res.ok) return;
      const data = await res.json();
      const list: Notification[] = data.data ?? [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling fallback
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Supabase Realtime subscription for live notifications
  useEffect(() => {
    let userId: string | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      userId = user.id;

      const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newNotif = payload.new as Notification;
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const updated = payload.new as Notification;
            setNotifications(prev =>
              prev.map(n => n.id === updated.id ? { ...n, read: updated.read } : n)
            );
            setUnreadCount(prev => updated.read ? Math.max(0, prev - 1) : prev);
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_id: id }),
    });
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_all: true }),
    });
  };

  return (
    <div className="relative" ref={drawerRef}>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
        className="relative p-2 rounded-lg hover:bg-muted/40 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Drawer panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-card border border-border/60 shadow-2xl shadow-black/30 z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-primary/15 text-primary text-[10px] font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
              <button type="button" onClick={fetchNotifications} aria-label="Refresh" className="p-1 hover:bg-muted/40 rounded transition-colors">
                <RefreshCw className={`w-3 h-3 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="p-1 hover:bg-muted/40 rounded transition-colors">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => {
                const { Icon, color } = ICON_MAP[notif.type] ?? { Icon: Bell, color: 'text-primary bg-primary/15' };
                return (
                  <div
                    key={notif.id}
                    role="button"
                    tabIndex={0}
                    aria-label={notif.title}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-border/20 cursor-pointer transition-colors ${
                      notif.read ? 'opacity-70 hover:opacity-100 hover:bg-card/40' : 'bg-primary/5 hover:bg-primary/8'
                    }`}
                    onClick={() => markRead(notif.id)}
                    onKeyDown={e => e.key === 'Enter' && markRead(notif.id)}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold leading-tight ${notif.read ? 'text-foreground/80' : 'text-foreground'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{notif.body}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(notif.created_at)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border/40 text-center">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                View all activity →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
