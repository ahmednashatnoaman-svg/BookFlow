'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Menu, X, Plus, LogOut, LayoutDashboard, Shield, ChevronDown, Sparkles, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/types';
import { cn } from '@/lib/utils';
import NotificationDrawer from '@/components/layout/NotificationDrawer';

export default function Header() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isArabic, setIsArabic] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    setIsArabic(document.documentElement.lang === 'ar');
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data } = await supabase.from('user_profiles').select('*').eq('id', authUser.id).single();
        setUser(data);
        // unread count is managed by NotificationDrawer
      }
    };
    getUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => getUser());
    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMobileOpen(false);
    router.push('/');
    router.refresh();
  };

  const toggleLocale = () => {
    const newLocale = document.documentElement.lang === 'ar' ? 'en' : 'ar';
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    window.location.reload();
  };

  const navLinks = [
    { href: '/books', label: t('browse') },
    { href: '/books?type=exchange', label: t('exchange') },
    { href: '/books?type=sale', label: t('sale') },
    { href: '/chat', label: isArabic ? 'AI مساعد' : 'AI Search', isAI: true },
  ];

  return (
    <header className={cn(
      'sticky top-0 z-50 transition-all duration-300',
      scrolled
        ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-lg shadow-black/20'
        : 'bg-background/70 backdrop-blur-sm border-b border-transparent'
    )}>
      <div className="page-container">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="gradient-text">BookFlow</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
                  pathname === link.href
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  (link as any).isAI && 'relative',
                )}
              >
                {(link as any).isAI && <Sparkles className="w-3.5 h-3.5 text-violet-400" />}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">

            {/* Locale toggle */}
            <button type="button" onClick={toggleLocale}
              className="px-2.5 py-1.5 text-xs font-semibold border border-border rounded-lg hover:bg-muted/50 transition-colors text-foreground"
            >
              {isArabic ? 'EN' : 'عربي'}
            </button>

            {user ? (
              <>
                {/* List a book */}
                <Link href="/list-book"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('list')}
                </Link>

                {/* Notifications */}
                <NotificationDrawer />

                {/* Profile dropdown */}
                <div className="relative">
                  <button type="button" onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-1.5 p-1.5 hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-xs font-bold text-white">
                      {user.full_name?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        onMouseLeave={() => setProfileOpen(false)}
                        className="absolute end-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
                      >
                        <div className="px-3 py-2.5 border-b border-border">
                          <p className="text-sm font-semibold truncate text-foreground">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        {[
                          { href: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
                          { href: '/dashboard/listings', icon: BookOpen, label: t('myListings') },
                          { href: '/dashboard/profile', icon: User, label: 'Profile' },
                          { href: '/chat', icon: Sparkles, label: 'AI Search' },
                          ...(user.role === 'admin' ? [{ href: '/admin', icon: Shield, label: 'Admin' }] : []),
                        ].map(item => (
                          <Link key={item.href} href={item.href}
                            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
                            onClick={() => setProfileOpen(false)}
                          >
                            <item.icon className="w-4 h-4 text-muted-foreground" />
                            {item.label}
                          </Link>
                        ))}
                        <button type="button" onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors border-t border-border"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('signOut')}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login"
                  className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('login')}
                </Link>
                <Link href="/auth/register"
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  {t('register')}
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button type="button" onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 md:hidden hover:bg-muted/50 rounded-lg transition-colors text-foreground"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border bg-card overflow-hidden"
          >
            <nav className="page-container py-3 flex flex-col gap-1">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <Link href="/list-book"
                  className="flex items-center gap-2 px-3 py-2.5 mt-1 bg-primary/15 text-primary rounded-lg text-sm font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  <Plus className="w-4 h-4" /> {t('list')}
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
