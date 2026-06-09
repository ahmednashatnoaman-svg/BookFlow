'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Mail, Lock, User, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';

export default function RegisterPage() {
  const locale = useLocale() as 'en' | 'ar';
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const t = {
    en: { title: 'Create your account', sub: 'Join BookFlow and start exchanging books', name: 'Full Name', email: 'Email', password: 'Password', confirm: 'Confirm Password', btn: 'Create Account', hasAccount: 'Already have an account?', login: 'Sign In' },
    ar: { title: 'أنشئ حسابك', sub: 'انضم إلى BookFlow وابدأ في تبادل الكتب', name: 'الاسم الكامل', email: 'البريد الإلكتروني', password: 'كلمة المرور', confirm: 'تأكيد كلمة المرور', btn: 'إنشاء الحساب', hasAccount: 'لديك حساب بالفعل؟', login: 'تسجيل الدخول' },
  }[locale];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error(locale === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName } },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(locale === 'ar' ? 'تم إنشاء الحساب! تحقق من بريدك الإلكتروني' : 'Account created! Check your email to verify');
    router.push('/auth/login');
  };

  const inputClass = "w-full ps-9 pe-3 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary/60";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
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
          {[
            { key: 'fullName', label: t.name, type: 'text', icon: User, autocomplete: 'name' },
            { key: 'email', label: t.email, type: 'email', icon: Mail, autocomplete: 'email' },
            { key: 'password', label: t.password, type: 'password', icon: Lock, autocomplete: 'new-password' },
            { key: 'confirmPassword', label: t.confirm, type: 'password', icon: Lock, autocomplete: 'new-password' },
          ].map(field => (
            <div key={field.key}>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{field.label}</label>
              <div className="relative">
                <field.icon className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={field.type}
                  autoComplete={field.autocomplete}
                  value={form[field.key as keyof typeof form]}
                  onChange={e => setForm(p => ({...p, [field.key]: e.target.value}))}
                  required minLength={field.key.includes('password') ? 8 : 2}
                  className={inputClass}
                />
              </div>
            </div>
          ))}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-60 mt-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? '...' : t.btn}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          {t.hasAccount}{' '}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">{t.login}</Link>
        </p>
      </div>
    </div>
  );
}
