'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import BookCard from '@/components/books/BookCard';
import BookFilters from '@/components/books/BookFilters';
import { Search, Loader2, PackageOpen } from 'lucide-react';
import { booksApi, categoriesApi } from '@/lib/api';
import type { BookListing, Category, SearchFilters } from '@/types';
import { useLocale } from 'next-intl';

const DEFAULT_FILTERS: SearchFilters = { query: '', sort: 'newest' };

export default function BrowsePage() {
  const locale = useLocale() as 'en' | 'ar';
  const searchParams = useSearchParams();

  const [books, setBooks] = useState<BookListing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    ...DEFAULT_FILTERS,
    query: searchParams.get('q') ?? '',
    listing_type: (searchParams.get('type') as SearchFilters['listing_type']) ?? undefined,
  });

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => {});
  }, []);

  const loadBooks = useCallback(async (newFilters: SearchFilters, newPage = 1) => {
    const isFirst = newPage === 1;
    isFirst ? setLoading(true) : setLoadingMore(true);
    try {
      const result = await booksApi.list({ ...newFilters, page: newPage, per_page: 24 });
      setBooks(prev => isFirst ? result.data : [...prev, ...result.data]);
      setTotal(result.total);
    } catch {
      /* ignore */
    } finally {
      isFirst ? setLoading(false) : setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    loadBooks(filters, 1);
  }, [filters, loadBooks]);

  const handleFilterChange = (partial: Partial<SearchFilters>) =>
    setFilters(prev => ({ ...prev, ...partial }));

  const handleReset = () => setFilters(DEFAULT_FILTERS);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    loadBooks(filters, next);
  };

  const hasMore = books.length < total;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="page-container py-8">
        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder={locale === 'ar' ? 'ابحث عن عنوان، مؤلف، أو فئة...' : 'Search by title, author, or category...'}
            value={filters.query}
            onChange={e => handleFilterChange({ query: e.target.value })}
            className="w-full ps-10 pe-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-colors"
          />
        </div>

        {/* Sidebar + Content grid */}
        <div className="flex gap-6 items-start">

          {/* Filters — renders sidebar on lg+, mobile sheet on smaller */}
          <BookFilters
            categories={categories}
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleReset}
          />

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {loading
                  ? <span className="inline-flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> {locale === 'ar' ? 'جارٍ البحث...' : 'Searching...'}</span>
                  : `${total.toLocaleString()} ${locale === 'ar' ? 'نتيجة' : 'results'}`
                }
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="glass-card overflow-hidden animate-pulse">
                    <div className="aspect-[3/4] bg-muted/40" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-muted/40 rounded w-3/4" />
                      <div className="h-2.5 bg-muted/30 rounded w-1/2" />
                      <div className="h-3 bg-muted/20 rounded w-1/3 mt-3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : books.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center">
                  <PackageOpen className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">
                    {locale === 'ar' ? 'لا توجد نتائج' : 'No books found'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'ar' ? 'جرب تعديل البحث أو الفلاتر' : 'Try adjusting your search or filters'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-sm bg-primary/15 text-primary rounded-lg hover:bg-primary/25 transition-colors"
                >
                  {locale === 'ar' ? 'مسح الفلاتر' : 'Clear filters'}
                </button>
              </div>
            ) : (
              <>
                <div className="book-grid">
                  {books.map(book => <BookCard key={book.id} book={book} />)}
                </div>
                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-6 py-2.5 border border-border rounded-xl text-sm text-foreground hover:bg-muted/40 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                      {locale === 'ar' ? 'تحميل المزيد' : 'Load more'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
