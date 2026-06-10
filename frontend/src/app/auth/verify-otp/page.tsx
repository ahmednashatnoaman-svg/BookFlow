'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Phone, Loader2, RefreshCw, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';

const RESEND_COOLDOWN = 60;

function VerifyOtpForm() {
  const locale = useLocale() as 'en' | 'ar';
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const phone = searchParams.get('phone') ?? '';
  const mode = (searchParams.get('mode') ?? 'login') as 'login' | 'signup';
  const redirectTo = searchParams.get('redirect') ?? '/dashboard';

  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const L = {
    en: {
      title: 'Verify your phone',
      sub: (p: string) => `We sent a 6-digit code to ${p}`,
      label: 'Enter the code',
      verify: 'Verify',
      resend: 'Resend code',
      resendIn: (s: number) => `Resend in ${s}s`,
      back: 'Back',
      wrongPhone: 'Wrong number?',
    },
    ar: {
      title: 'تحقق من هاتفك',
      sub: (p: string) => `أرسلنا رمزاً مكوناً من 6 أرقام إلى ${p}`,
      label: 'أدخل الرمز',
      verify: 'تحقق',
      resend: 'إعادة إرسال الرمز',
      resendIn: (s: number) => `إعادة الإرسال بعد ${s}ث`,
      back: 'رجوع',
      wrongPhone: 'رقم خاطئ؟',
    },
  }[locale];

  // Countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const id = setInterval(() => setResendCountdown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [resendCountdown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (idx: number, val: string) => {
    const d = val.replace(/\D/g, '');
    if (!d && val !== '') return;

    if (d.length > 1) {
      // Paste handling — fill all 6 from the pasted string
      const pasted = d.slice(0, 6).split('');
      const next = [...digits];
      pasted.forEach((c, i) => { if (idx + i < 6) next[idx + i] = c; });
      setDigits(next);
      const focusIdx = Math.min(idx + pasted.length, 5);
      inputRefs.current[focusIdx]?.focus();
      return;
    }

    const next = [...digits];
    next[idx] = d;
    setDigits(next);
    if (d && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const code = digits.join('');

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.length < 6) {
      toast.error(locale === 'ar' ? 'أدخل الرمز المكون من 6 أرقام' : 'Enter all 6 digits');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: mode === 'signup' ? 'sms' : 'sms',
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      setDigits(Array(6).fill(''));
      inputRefs.current[0]?.focus();
      return;
    }

    toast.success(
      mode === 'signup'
        ? (locale === 'ar' ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!')
        : (locale === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Signed in successfully')
    );
    router.push(redirectTo);
    router.refresh();
  };

  // Auto-submit when all 6 digits are filled
  useEffect(() => {
    if (code.length === 6) handleVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleResend = async () => {
    if (resendCountdown > 0 || !phone) return;
    setResending(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setResending(false);

    if (error) { toast.error(error.message); return; }
    toast.success(locale === 'ar' ? 'تم إرسال رمز جديد' : 'New code sent');
    setResendCountdown(RESEND_COOLDOWN);
    setDigits(Array(6).fill(''));
    inputRefs.current[0]?.focus();
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

          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Phone className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{L.title}</h1>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
            {L.sub(phone || '…')}
          </p>
        </div>

        <form onSubmit={handleVerify} className="glass-card p-6">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3 text-center">
            {L.label}
          </label>

          {/* 6-digit inputs */}
          <div className="flex justify-center gap-2 mb-6" dir="ltr">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={d}
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onFocus={e => e.target.select()}
                aria-label={`Digit ${i + 1} of 6`}
                className={`
                  w-11 h-14 text-center text-xl font-bold rounded-xl border transition-all
                  bg-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                  ${d ? 'border-primary/60 bg-primary/5' : 'border-border'}
                `}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? '…' : L.verify}
          </button>

          {/* Resend */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCountdown > 0 || resending}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-default transition-colors"
            >
              {resending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <RefreshCw className="w-3.5 h-3.5" />}
              {resendCountdown > 0 ? L.resendIn(resendCountdown) : L.resend}
            </button>
          </div>
        </form>

        {/* Back / wrong number */}
        <div className="flex items-center justify-between mt-5">
          <Link
            href={mode === 'signup' ? '/auth/register' : '/auth/login'}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {L.back}
          </Link>
          <span className="text-sm text-muted-foreground">
            {L.wrongPhone}{' '}
            <Link
              href={mode === 'signup' ? '/auth/register' : '/auth/login'}
              className="text-primary hover:underline"
            >
              {locale === 'ar' ? 'غيّره' : 'Change it'}
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  );
}
