import Link from 'next/link';
import {
  ArrowRight, Sparkles, BookOpen, ArrowLeftRight, Users,
  Brain, Headphones, Search, Star, Tag, MessageSquare,
  CheckCircle, ChevronRight,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/layout/Header';
import BookCard from '@/components/books/BookCard';
import { createClient } from '@/lib/supabase/server';
import type { BookListing, Category } from '@/types';
import { HeroContent, StaggerSection, FadeItem, FadeSection } from '@/components/layout/LandingAnimations';

async function getHomepageData() {
  try {
    const supabase = await createClient();
    const [{ data: books }, { data: categories }, { count: listingsCount }, { count: usersCount }] = await Promise.all([
      supabase.from('book_listings')
        .select('*, owner:user_profiles(id, full_name, avatar_url), category:categories(id, name_en, name_ar, icon, slug)')
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(8),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('book_listings').select('*', { count: 'exact', head: true }).eq('status', 'available'),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
    ]);
    return { books: books ?? [], categories: categories ?? [], listingsCount: listingsCount ?? 0, usersCount: usersCount ?? 0 };
  } catch {
    return { books: [], categories: [], listingsCount: 0, usersCount: 0 };
  }
}

export default async function HomePage() {
  const t = await getTranslations('home');
  const { books, categories, listingsCount, usersCount } = await getHomepageData();

  const stats = [
    { value: `${listingsCount}+`, label: t('stat1') },
    { value: `${usersCount}+`, label: t('stat2') },
    { value: '12', label: t('stat3') },
    { value: '2', label: t('stat4') },
  ];

  const aiFeatures = [
    {
      icon: Sparkles,
      title: 'AI Book Search',
      titleAr: 'البحث الذكي بالذكاء الاصطناعي',
      desc: 'Ask in plain language — "find me a thriller under 50 SAR in Riyadh" — and get real results instantly.',
      color: 'from-violet-500/20 to-violet-500/5',
      border: 'hover:border-violet-500/40',
      iconBg: 'bg-violet-500/15',
      iconColor: 'text-violet-400',
      href: '/chat',
      cta: 'Try AI Search',
    },
    {
      icon: Brain,
      title: 'Smart Summaries',
      titleAr: 'ملخصات ذكية',
      desc: 'Get instant AI-powered book analysis: key themes, mood, target audience, and reading time estimate.',
      color: 'from-primary/20 to-primary/5',
      border: 'hover:border-primary/40',
      iconBg: 'bg-primary/15',
      iconColor: 'text-primary',
      href: '/books',
      cta: 'Browse Books',
    },
    {
      icon: Headphones,
      title: 'Audio Previews',
      titleAr: 'معاينة صوتية',
      desc: 'Listen to AI-narrated descriptions of books before making a request. Powered by OpenAI TTS.',
      color: 'from-teal-500/20 to-teal-500/5',
      border: 'hover:border-teal-500/40',
      iconBg: 'bg-teal-500/15',
      iconColor: 'text-teal-400',
      href: '/books',
      cta: 'Explore',
    },
  ];

  const howItWorks = [
    { step: '01', icon: Users, title: 'Create Account', desc: 'Sign up free in 30 seconds. No credit card required.' },
    { step: '02', icon: BookOpen, title: 'List Your Books', desc: 'Add your books with photos, condition, and price. AI autofills details from ISBN.' },
    { step: '03', icon: Search, title: 'Discover & Request', desc: 'Browse, use AI search, or filter by price, city, and condition. Send a request.' },
    { step: '04', icon: ArrowLeftRight, title: 'Exchange or Buy', desc: 'Coordinate the exchange directly. Rate your experience and build your reading community.' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-32">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px] animate-pulse orb-slow" />
          <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-teal-500/6 rounded-full blur-[100px] animate-pulse orb-slower" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[300px] bg-violet-500/5 rounded-full blur-[80px]" />
        </div>

        <HeroContent>
        <div className="page-container relative text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Book Marketplace · Saudi Arabia & MENA
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
            Discover Books,<br />
            <span className="gradient-text">Exchange Stories</span>
          </h1>

          {/* Subheading */}
          <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            The smartest way to buy, sell, and exchange books in Saudi Arabia.
            Powered by AI that understands what you&apos;re looking for.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <Link href="/books"
              className="flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5"
            >
              <BookOpen className="w-4 h-4" /> Browse Books
            </Link>
            <Link href="/chat"
              className="flex items-center gap-2 px-7 py-3.5 bg-violet-500/15 text-violet-300 border border-violet-500/30 rounded-xl font-semibold hover:bg-violet-500/25 hover:border-violet-500/50 transition-all hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4" /> Try AI Search
            </Link>
            <Link href="/list-book"
              className="flex items-center gap-2 px-7 py-3.5 border border-border bg-muted/20 rounded-xl font-semibold hover:bg-muted/40 transition-all text-muted-foreground hover:text-foreground"
            >
              List Your Books <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-extrabold gradient-text">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        </HeroContent>
      </section>

      {/* ── CATEGORY PILLS ───────────────────────────────────────────────── */}
      <section className="py-10 border-y border-border/40 bg-card/30">
        <div className="page-container">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
            <Link href="/books"
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/20"
            >
              <BookOpen className="w-3.5 h-3.5" /> All Books
            </Link>
            {(categories as Category[]).map(cat => (
              <Link key={cat.id} href={`/books?category=${cat.slug}`}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-border/60 text-muted-foreground rounded-full hover:border-primary/40 hover:text-foreground hover:bg-primary/5 transition-all whitespace-nowrap"
              >
                <span className="text-base leading-none">{cat.icon}</span> {cat.name_en}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRENDING BOOKS ───────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="page-container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Fresh Listings</p>
              <h2 className="text-3xl font-bold">Recently Added</h2>
            </div>
            <Link href="/books" className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group">
              View all <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {books.length > 0 ? (
            <StaggerSection className="book-grid">
              {(books as BookListing[]).map(book => (
                <FadeItem key={book.id}>
                  <BookCard book={book} />
                </FadeItem>
              ))}
            </StaggerSection>
          ) : (
            <div className="text-center py-20 glass-card">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No listings yet — be the first to list a book!</p>
              <Link href="/list-book" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
                <BookOpen className="w-4 h-4" /> List a Book
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── AI FEATURES ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-card/20 border-y border-border/40">
        <div className="page-container">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-3">Powered by Claude AI</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Your AI-Powered Reading Companion</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Three intelligent features that transform how you discover, understand, and exchange books.
            </p>
          </div>

          <StaggerSection className="grid md:grid-cols-3 gap-6">
            {aiFeatures.map((feat, i) => (
              <FadeItem key={i} className={`glass-card p-6 bg-gradient-to-br ${feat.color} ${feat.border} transition-all group cursor-pointer`}>
                <div className={`w-12 h-12 rounded-2xl ${feat.iconBg} flex items-center justify-center mb-5`}>
                  <feat.icon className={`w-6 h-6 ${feat.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold mb-3">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{feat.desc}</p>
                <Link href={feat.href}
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold ${feat.iconColor} hover:gap-2.5 transition-all`}
                >
                  {feat.cta} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </FadeItem>
            ))}
          </StaggerSection>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="page-container">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-bold">How BookFlow Works</h2>
          </div>

          <StaggerSection className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connector line (desktop) */}
            <div className="hidden lg:block absolute top-10 left-[calc(12.5%+2rem)] right-[calc(12.5%+2rem)] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {howItWorks.map((step, i) => (
              <FadeItem key={i} className="glass-card p-6 text-center relative group hover:border-primary/40 transition-all">
                {/* Step number */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-background border-2 border-border group-hover:border-primary transition-colors flex items-center justify-center">
                  <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors">{step.step}</span>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 mt-2 group-hover:bg-primary/20 transition-colors">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </FadeItem>
            ))}
          </StaggerSection>
        </div>
      </section>

      {/* ── CATEGORIES GRID ──────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="py-20 bg-card/20 border-y border-border/40">
          <div className="page-container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Explore</p>
                <h2 className="text-3xl font-bold">Browse by Category</h2>
              </div>
            </div>
            <StaggerSection className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {(categories as Category[]).map(cat => (
                <FadeItem key={cat.id}>
                <Link href={`/books?category=${cat.slug}`}
                  className="glass-card p-4 flex flex-col items-center text-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-200">{cat.icon}</span>
                  <p className="text-xs font-semibold leading-tight">{cat.name_en}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{cat.name_ar}</p>
                </Link>
                </FadeItem>
              ))}
            </StaggerSection>
          </div>
        </section>
      )}

      {/* ── TRUST BADGES ─────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="page-container">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: CheckCircle, color: 'text-green-400 bg-green-400/10', title: 'Verified Listings', desc: 'All books reviewed for quality and accurate condition grading.' },
              { icon: MessageSquare, color: 'text-primary bg-primary/10', title: 'Direct Contact', desc: 'Coordinate exchanges directly. No middlemen, no fees.' },
              { icon: Star, color: 'text-amber-400 bg-amber-400/10', title: 'Rated Community', desc: 'Build your reputation with each completed exchange.' },
            ].map((item, i) => (
              <div key={i} className="glass-card p-6">
                <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-primary/5 to-teal-500/10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/8 rounded-full blur-3xl" />
        <div className="page-container relative text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Clear Your Shelf?</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
            Join thousands of readers exchanging books across Saudi Arabia.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 transition-all shadow-2xl shadow-primary/30 hover:-translate-y-0.5"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/books"
              className="inline-flex items-center gap-2 px-8 py-4 border border-border rounded-xl font-semibold text-lg hover:bg-muted/40 transition-all"
            >
              Browse Books
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/60 py-12 bg-card/20">
        <div className="page-container">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <span className="gradient-text">BookFlow</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Saudi Arabia&apos;s AI-powered peer-to-peer book exchange marketplace.
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Marketplace</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[['Browse Books', '/books'], ['For Exchange', '/books?type=exchange'], ['For Sale', '/books?type=sale'], ['AI Search', '/chat']].map(([l, h]) => (
                    <li key={l}><Link href={h} className="hover:text-foreground transition-colors">{l}</Link></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Account</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[['Login', '/auth/login'], ['Register', '/auth/register'], ['Dashboard', '/dashboard'], ['List a Book', '/list-book']].map(([l, h]) => (
                    <li key={l}><Link href={h} className="hover:text-foreground transition-colors">{l}</Link></li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Language + tagline */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Language / اللغة</p>
              <div className="flex gap-2">
                <button type="button" className="px-4 py-2 text-sm font-semibold bg-primary/15 text-primary border border-primary/30 rounded-lg">EN</button>
                <button type="button" className="px-4 py-2 text-sm font-semibold border border-border text-muted-foreground rounded-lg hover:bg-muted/40 transition-colors">عربي</button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                كتبك، مجتمعك<br />Your books, your community
              </p>
            </div>
          </div>

          <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} BookFlow. All rights reserved.</p>
            <p>Built for GenAI Hackathon 🚀 · Powered by Claude AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
