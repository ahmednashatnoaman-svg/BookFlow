'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Mail, Lock, User, Loader2, Phone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';

const inputClass = 'w-full ps-9 pe-3 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary/60';

function RegisterForm() {
  const locale = useLocale() as 'en' | 'ar';
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '';
  const supabase = createClient();

  const [tab, setTab] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);

  const [emailForm, setEmailForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [phoneForm, setPhoneForm] = useState({ fullName: '', phone: '', password: '', confirmPassword: '' });

  const L = {
    en: {
      title: 'Create your account',
      sub: 'Join BookFlow and start exchanging books',
      emailTab: 'Email',
      phoneTab: 'Phone',
      name: 'Full Name',
      email: 'Email',
      phone: 'Phone Number',
      phonePlaceholder: '+966 5X XXX XXXX',
      password: 'Password',
      confirm: 'Confirm Password',
      btn: 'Create Account',
      hasAccount: 'Already have an account?',
      login: 'Sign In',
    },
    ar: {
      title: 'أنشئ حسابك',
      sub: 'انضم إلى BookFlow وابدأ في تبادل الكتب',
      emailTab: 'بريد إلكتروني',
      phoneTab: 'هاتف',
      name: 'الاسم الكامل',
      email: 'البريد الإلكتروني',
      phone: 'رقم الهاتف',
      phonePlaceholder: '+966 5X XXX XXXX',
      password: 'كلمة المرور',
      confirm: 'تأكيد كلمة المرور',
      btn: 'إنشاء الحساب',
      hasAccount: 'لديك حساب بالفعل؟',
      login: 'تسجيل الدخول',
    },
  }[locale];

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailForm.password !== emailForm.confirmPassword) {
      toast.error(locale === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: emailForm.email,
      password: emailForm.password,
      options: { data: { full_name: emailForm.fullName } },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    const verifyUrl = `/auth/verify?email=${encodeURIComponent(emailForm.email)}${redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : ''}`;
    router.push(verifyUrl);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneForm.password !== phoneForm.confirmPassword) {
      toast.error(locale === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    const phone = phoneForm.phone.trim();
    if (!phone.startsWith('+')) {
      toast.error(locale === 'ar' ? 'أدخل رقم الهاتف مع رمز الدولة مثل +966' : 'Include country code, e.g. +966501234567');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      phone,
      password: phoneForm.password,
      options: { data: { full_name: phoneForm.fullName } },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    const otpUrl = `/auth/verify-otp?phone=${encodeURIComponent(phone)}&mode=signup${redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : ''}`;
    router.push(otpUrl);
  };

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
          <h1 className="text-2xl font-bold">{L.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{L.sub}</p>
        </div>

        {/* Email / Phone tabs */}
        <div className="flex rounded-xl bg-muted/40 border border-border p-1 mb-4 gap-1">
          {(['email', 'phone'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === t
                  ? 'bg-card shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'email' ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              {t === 'email' ? L.emailTab : L.phoneTab}
            </button>
          ))}
        </div>

        {tab === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="glass-card p-6 space-y-4">
            {[
              { key: 'fullName', label: L.name, type: 'text', icon: User, ac: 'name' },
              { key: 'email', label: L.email, type: 'email', icon: Mail, ac: 'email' },
              { key: 'password', label: L.password, type: 'password', icon: Lock, ac: 'new-password' },
              { key: 'confirmPassword', label: L.confirm, type: 'password', icon: Lock, ac: 'new-password' },
            ].map(f => (
              <div key={f.key}>
                <label htmlFor={`reg-e-${f.key}`} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{f.label}</label>
                <div className="relative">
                  <f.icon className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id={`reg-e-${f.key}`}
                    type={f.type}
                    autoComplete={f.ac}
                    value={emailForm[f.key as keyof typeof emailForm]}
                    onChange={ev => setEmailForm(p => ({ ...p, [f.key]: ev.target.value }))}
                    required minLength={f.key.includes('password') ? 8 : 2}
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
            <SubmitButton loading={loading} label={L.btn} />
          </form>
        ) : (
          <form onSubmit={handlePhoneSubmit} className="glass-card p-6 space-y-4">
            <div>
              <label htmlFor="reg-p-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{L.name}</label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input id="reg-p-name" type="text" autoComplete="name" value={phoneForm.fullName}
                  onChange={e => setPhoneForm(p => ({ ...p, fullName: e.target.value }))} required minLength={2} className={inputClass} />
              </div>
            </div>
            <div>
              <label htmlFor="reg-p-phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{L.phone}</label>
              <div className="relative">
                <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input id="reg-p-phone" type="tel" autoComplete="tel" placeholder={L.phonePlaceholder}
                  value={phoneForm.phone} onChange={e => setPhoneForm(p => ({ ...p, phone: e.target.value }))}
                  required className={inputClass} dir="ltr" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 ps-1">
                {locale === 'ar' ? 'أدخل رقمك مع رمز الدولة، مثال: +966501234567' : 'Include country code, e.g. +966501234567'}
              </p>
            </div>
            {[
              { key: 'password', label: L.password, ac: 'new-password' },
              { key: 'confirmPassword', label: L.confirm, ac: 'new-password' },
            ].map(f => (
              <div key={f.key}>
                <label htmlFor={`reg-p-${f.key}`} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{f.label}</label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input id={`reg-p-${f.key}`} type="password" autoComplete={f.ac}
                    value={phoneForm[f.key as 'password' | 'confirmPassword']}
                    onChange={ev => setPhoneForm(p => ({ ...p, [f.key]: ev.target.value }))}
                    required minLength={8} className={inputClass} />
                </div>
              </div>
            ))}
            <SubmitButton loading={loading} label={L.btn} />
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-5">
          {L.hasAccount}{' '}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">{L.login}</Link>
        </p>
      </div>
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-60 mt-2"
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {loading ? '…' : label}
    </button>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
