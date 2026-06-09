import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'BookFlow — Peer-to-Peer Book Exchange', template: '%s | BookFlow' },
  description: 'Discover, exchange, and sell used books in your community. AI-powered recommendations, audio summaries, and smart search.',
  keywords: ['books', 'exchange', 'used books', 'book swap', 'كتب', 'تبادل الكتب'],
  openGraph: {
    type: 'website',
    siteName: 'BookFlow',
    title: 'BookFlow — Peer-to-Peer Book Exchange',
    description: 'Discover, exchange, and sell used books in your community.',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const isRTL = locale === 'ar';

  return (
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={isRTL ? 'font-arabic' : ''}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <NextIntlClientProvider messages={messages} locale={locale}>
            {children}
            <Toaster position="top-right" richColors theme="dark" />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
