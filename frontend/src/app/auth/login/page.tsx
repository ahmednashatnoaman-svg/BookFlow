'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';

export default function LoginPage() {
  const locale = useLocale() as 'en' | 'ar';
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const t = {
    en: { title: 'Welcome back', sub: 'Sign in to your BookFlow account', email: 'Email', password: 'Password', btn: 'Sign In', noAccount: "Don't have an account?", register: 'Register', forgot: 'Forgot password?' },
    ar: { title: 'مرحباً بعودتك', sub: 'سجل دخولك إلى حساب BookFlow', email: 'البريد الإلكتروني', password: 'كلمة المرور', btn: 'تسجيل الدخول', noAccount: 'ليس لديك حساب؟', register: 'إنشاء حساب', forgot: 'نسيت كلمة المرور؟' },
  }[locale];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(locale === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Signed in successfully');
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-teal-500/5 pointer-events-none" />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="gradient-text">BookFlow</span>
          </Link>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.sub}</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{t.email}</label>
            <div className="relative">
              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} required
                className="w-full ps-9 pe-3 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary/60"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{t.password}</label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} required minLength={8}
                className="w-full ps-9 pe-9 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary/60"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-60 mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? '...' : t.btn}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          {t.noAccount}{' '}
          <Link href="/auth/register" className="text-primary hover:underline font-medium">{t.register}</Link>
        </p>
      </div>
    </div>
  );
}
