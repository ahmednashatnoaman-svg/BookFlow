import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'BookFlow — Egypt AI-Powered Book Marketplace', template: '%s | BookFlow' },
  description: "Egypt's AI-powered book marketplace. Buy, sell, and exchange used books with AI summaries, smart search, and audio previews.",
  keywords: ['books', 'egypt', 'book exchange', 'used books', 'book marketplace', 'كتب', 'تبادل الكتب', 'مصر', 'سوق الكتب'],
  openGraph: {
    type: 'website',
    siteName: 'BookFlow',
    title: 'BookFlow — Egypt AI-Powered Book Marketplace',
    description: "Egypt's AI-powered book marketplace. Buy, sell, and exchange used books.",
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
