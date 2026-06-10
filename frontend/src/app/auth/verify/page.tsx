'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { MailCheck, AlertCircle, RefreshCw } from 'lucide-react';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_link: 'This verification link is invalid or has expired.',
  access_denied: 'Email verification was cancelled or denied.',
};

function VerifyContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const email = searchParams.get('email');

  if (error) {
    const msg = ERROR_MESSAGES[error] ?? decodeURIComponent(error).replace(/\+/g, ' ');
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-bold mb-2">Verification Failed</h1>
            <p className="text-sm text-muted-foreground">{msg}</p>
          </div>
          <div className="space-y-2">
            <Link href="/auth/register"
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Link>
            <Link href="/auth/login"
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <MailCheck className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold mb-2">Check Your Email</h1>
          <p className="text-sm text-muted-foreground">
            {email
              ? <>We sent a verification link to <strong>{email}</strong>. Click the link to activate your account.</>
              : 'We sent a verification link to your email. Click it to activate your account.'
            }
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Didn&apos;t receive it? Check your spam folder or{' '}
          <Link href="/auth/register" className="text-primary hover:underline">try again</Link>.
        </p>
        <Link href="/auth/login"
          className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Already verified? Sign in
        </Link>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
