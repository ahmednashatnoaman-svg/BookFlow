'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Mail, Lock, Loader2, Eye, EyeOff, Phone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';

const inputClass = 'w-full ps-9 pe-3 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary/60';

function LoginForm() {
  const locale = useLocale() as 'en' | 'ar';
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/dashboard';
  const supabase = createClient();

  const [tab, setTab] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  const L = {
    en: {
      title: 'Welcome back',
      sub: 'Sign in to your BookFlow account',
      emailTab: 'Email',
      phoneTab: 'Phone',
      email: 'Email',
      password: 'Password',
      phone: 'Phone Number',
      phonePlaceholder: '+20 1X XXXX XXXX',
      phoneHint: "We'll send a one-time code to your phone",
      btn: 'Sign In',
      sendCode: 'Send Code',
      noAccount: "Don't have an account?",
      register: 'Register',
    },
    ar: {
      title: 'مرحباً بعودتك',
      sub: 'سجل دخولك إلى حساب BookFlow',
      emailTab: 'بريد إلكتروني',
      phoneTab: 'هاتف',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      phone: 'رقم الهاتف',
      phonePlaceholder: '+20 1X XXXX XXXX',
      phoneHint: 'سنرسل رمزاً لمرة واحدة إلى هاتفك',
      btn: 'تسجيل الدخول',
      sendCode: 'إرسال الرمز',
      noAccount: 'ليس لديك حساب؟',
      register: 'إنشاء حساب',
    },
  }[locale];

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(locale === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Signed in successfully');
    router.push(redirectTo);
    router.refresh();
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.trim();
    if (!cleaned.startsWith('+')) {
      toast.error(locale === 'ar' ? 'أدخل رمز الدولة مثل +20' : 'Include country code, e.g. +201012345678');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: cleaned });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    const otpUrl = `/auth/verify-otp?phone=${encodeURIComponent(cleaned)}&mode=login&redirect=${encodeURIComponent(redirectTo)}`;
    router.push(otpUrl);
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
            <div>
              <label htmlFor="login-email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{L.email}</label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input id="login-email" type="email" autoComplete="email" value={email}
                  onChange={e => setEmail(e.target.value)} required
                  className={inputClass} />
              </div>
            </div>
            <div>
              <label htmlFor="login-password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{L.password}</label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input id="login-password" type={showPass ? 'text' : 'password'} autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                  className="w-full ps-9 pe-9 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary/60" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <SubmitButton loading={loading} label={L.btn} />
          </form>
        ) : (
          <form onSubmit={handlePhoneSubmit} className="glass-card p-6 space-y-4">
            <div>
              <label htmlFor="login-phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{L.phone}</label>
              <div className="relative">
                <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input id="login-phone" type="tel" autoComplete="tel" placeholder={L.phonePlaceholder}
                  value={phone} onChange={e => setPhone(e.target.value)} required
                  className={inputClass} dir="ltr" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 ps-1">{L.phoneHint}</p>
            </div>
            <SubmitButton loading={loading} label={L.sendCode} />
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-5">
          {L.noAccount}{' '}
          <Link href="/auth/register" className="text-primary hover:underline font-medium">{L.register}</Link>
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
