'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { User, Mail, Phone, MapPin, Edit3, Save, Loader2, CheckCircle, Globe, DollarSign } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/types';

const SAUDI_CITIES = [
  'Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam',
  'Khobar', 'Taif', 'Tabuk', 'Buraidah', 'Khamis Mushait',
];

const COUNTRIES = [
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR' },
  { code: 'AE', name: 'UAE', currency: 'AED' },
  { code: 'EG', name: 'Egypt', currency: 'EGP' },
  { code: 'KW', name: 'Kuwait', currency: 'KWD' },
  { code: 'QA', name: 'Qatar', currency: 'QAR' },
  { code: 'BH', name: 'Bahrain', currency: 'BHD' },
  { code: 'OM', name: 'Oman', currency: 'OMR' },
  { code: 'JO', name: 'Jordan', currency: 'JOD' },
  { code: 'LB', name: 'Lebanon', currency: 'USD' },
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
];

const CURRENCIES = [
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar' },
];

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    city: '',
    bio: '',
    country: '',
    currency: 'SAR',
  });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setForm({
          full_name: data.full_name ?? '',
          phone: data.phone ?? '',
          city: data.city ?? '',
          bio: data.bio ?? '',
          country: (data as Record<string, unknown>).country as string ?? '',
          currency: (data as Record<string, unknown>).currency as string ?? 'SAR',
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: form.full_name.trim() || null,
          phone: form.phone.trim() || null,
          city: form.city || null,
          bio: form.bio.trim() || null,
          country: form.country || null,
          currency: form.currency || 'SAR',
        })
        .eq('id', profile.id);

      if (!error) {
        setProfile(prev => prev ? { ...prev, ...form } : prev);
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="page-container py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Profile & Settings</h1>
              <p className="text-muted-foreground text-sm">Manage your account information</p>
            </div>
          </div>
          {saved && (
            <div className="flex items-center gap-1.5 text-sm text-green-400">
              <CheckCircle className="w-4 h-4" /> Saved!
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="glass-card p-6 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">
              {(form.full_name || profile?.full_name || 'U')[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{profile?.full_name ?? 'No name set'}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <span className={cn(
                'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1',
                profile?.role === 'admin' ? 'bg-amber-500/10 text-amber-400' : 'bg-muted text-muted-foreground',
              )}>
                {profile?.role ?? 'user'}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Personal Information</h3>
            {!editing ? (
              <button type="button" onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditing(false)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button type="button" onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save
                </button>
              </div>
            )}
          </div>

          {/* Full name */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Full Name
            </label>
            {editing ? (
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                className="w-full px-3 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60"
                placeholder="Your full name"
              />
            ) : (
              <p className="text-sm py-2.5">{profile?.full_name ?? <span className="text-muted-foreground">Not set</span>}</p>
            )}
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Email
            </label>
            <p className="text-sm py-2.5 text-muted-foreground">{profile?.email}</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Phone Number
            </label>
            {editing ? (
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full px-3 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60"
                placeholder="+966 5x xxx xxxx"
              />
            ) : (
              <p className="text-sm py-2.5">{profile?.phone ?? <span className="text-muted-foreground">Not set</span>}</p>
            )}
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> City
            </label>
            {editing ? (
              <select
                aria-label="City"
                value={form.city}
                onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                className="w-full px-3 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60"
              >
                <option value="">Select a city</option>
                {SAUDI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <p className="text-sm py-2.5">{profile?.city ?? <span className="text-muted-foreground">Not set</span>}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Bio</label>
            {editing ? (
              <textarea
                value={form.bio}
                onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 resize-none"
                placeholder="Tell other users about yourself..."
              />
            ) : (
              <p className="text-sm py-2.5 text-muted-foreground leading-relaxed">
                {profile?.bio ?? 'No bio yet'}
              </p>
            )}
          </div>

          {/* Country & Currency */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Country
              </label>
              {editing ? (
                <select
                  aria-label="Country"
                  value={form.country}
                  onChange={e => {
                    const country = COUNTRIES.find(c => c.code === e.target.value);
                    setForm(p => ({ ...p, country: e.target.value, currency: country?.currency ?? p.currency }));
                  }}
                  className="w-full px-3 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60"
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              ) : (
                <p className="text-sm py-2.5">
                  {COUNTRIES.find(c => c.code === (profile as unknown as Record<string, string>)?.country)?.name ?? <span className="text-muted-foreground">Not set</span>}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" /> Currency
              </label>
              {editing ? (
                <select
                  aria-label="Currency"
                  value={form.currency}
                  onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60"
                >
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>)}
                </select>
              ) : (
                <p className="text-sm py-2.5">
                  {CURRENCIES.find(c => c.code === ((profile as unknown as Record<string, string>)?.currency ?? 'SAR'))?.name ?? 'Saudi Riyal'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Member since */}
        {profile?.created_at && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Member since {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          </p>
        )}
      </div>
    </div>
  );
}
