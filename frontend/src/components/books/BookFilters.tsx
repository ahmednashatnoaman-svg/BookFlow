'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import type { SearchFilters, Category, BookCondition, ListingType } from '@/types';
import { conditionLabels, listingTypeLabels, cn } from '@/lib/utils';

interface BookFiltersProps {
  categories: Category[];
  filters: SearchFilters;
  onChange: (filters: Partial<SearchFilters>) => void;
  onReset: () => void;
}

export default function BookFilters({ categories, filters, onChange, onReset }: BookFiltersProps) {
  const t = useTranslations('filters');
  const locale = useLocale() as 'en' | 'ar';
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const conditions: BookCondition[] = ['new', 'good', 'acceptable', 'poor'];
  const types: ListingType[] = ['sale', 'exchange'];
  const sortOptions = [
    { value: 'newest', label: t('newest') },
    { value: 'price_asc', label: t('priceLow') },
    { value: 'price_desc', label: t('priceHigh') },
    { value: 'most_relevant', label: t('relevant') },
  ];

  const hasActiveFilters = filters.category_id || filters.condition?.length || filters.listing_type || filters.min_price || filters.max_price;

  const renderFilters = () => (
    <div className="space-y-5">
      {/* Sort */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">{t('sortBy')}</label>
        <div className="grid grid-cols-2 gap-1.5">
          {sortOptions.map(opt => (
            <button key={opt.value}
              onClick={() => onChange({ sort: opt.value as SearchFilters['sort'] })}
              className={cn(
                'px-2.5 py-1.5 text-xs rounded-lg border transition-all',
                filters.sort === opt.value
                  ? 'border-primary bg-primary/15 text-primary font-medium'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >{opt.label}</button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">{t('category')}</label>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onChange({ category_id: undefined })}
            className={cn(
              'px-2.5 py-1 text-xs rounded-full border transition-all',
              !filters.category_id ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
            )}
          >{t('all')}</button>
          {categories.map(cat => (
            <button key={cat.id}
              onClick={() => onChange({ category_id: cat.id })}
              className={cn(
                'px-2.5 py-1 text-xs rounded-full border transition-all',
                filters.category_id === cat.id ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
              )}
            >
              {cat.icon} {cat[`name_${locale}`]}
            </button>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">{t('condition')}</label>
        <div className="flex flex-wrap gap-1.5">
          {conditions.map(cond => {
            const info = conditionLabels[cond];
            const active = filters.condition?.includes(cond);
            return (
              <button key={cond}
                onClick={() => {
                  const current = filters.condition ?? [];
                  onChange({ condition: active ? current.filter(c => c !== cond) : [...current, cond] });
                }}
                className={cn('px-2.5 py-1 text-xs rounded-full border transition-all', active ? info.color + ' border-transparent' : 'border-border text-muted-foreground hover:border-primary/40')}
              >{info[locale]}</button>
            );
          })}
        </div>
      </div>

      {/* Listing type */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">{t('type')}</label>
        <div className="flex gap-1.5">
          {types.map(type => {
            const info = listingTypeLabels[type];
            return (
              <button key={type}
                onClick={() => onChange({ listing_type: filters.listing_type === type ? undefined : type })}
                className={cn(
                  'flex-1 py-1.5 text-xs rounded-lg border transition-all',
                  filters.listing_type === type ? info.color + ' border-transparent' : 'border-border text-muted-foreground hover:border-primary/40'
                )}
              >{info[locale]}</button>
            );
          })}
        </div>
      </div>

      {/* Price range */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">{t('price')}</label>
        <div className="flex items-center gap-2">
          <input type="number" placeholder={t('min')} value={filters.min_price ?? ''}
            onChange={e => onChange({ min_price: e.target.value ? Number(e.target.value) : undefined })}
            className="flex-1 px-2.5 py-1.5 text-xs bg-muted/40 border border-border rounded-lg focus:outline-none focus:border-primary/60"
          />
          <span className="text-muted-foreground text-xs">—</span>
          <input type="number" placeholder={t('max')} value={filters.max_price ?? ''}
            onChange={e => onChange({ max_price: e.target.value ? Number(e.target.value) : undefined })}
            className="flex-1 px-2.5 py-1.5 text-xs bg-muted/40 border border-border rounded-lg focus:outline-none focus:border-primary/60"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <button onClick={onReset}
          className="w-full py-2 text-xs text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors flex items-center justify-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" /> {t('reset')}
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-56 flex-shrink-0">
        <div className="glass-card p-4 sticky top-20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" /> {t('title')}
            </h3>
            {hasActiveFilters && (
              <button onClick={onReset} className="text-[10px] text-destructive hover:underline">{t('reset')}</button>
            )}
          </div>
          {renderFilters()}
        </div>
      </div>

      {/* Mobile filters button */}
      <div className="lg:hidden flex items-center gap-2 mb-3">
        <button onClick={() => setShowMobileFilters(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted/60 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" /> {t('title')}
          {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
        </button>
      </div>

      {/* Mobile filter sheet */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-card rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{t('title')}</h3>
              <button onClick={() => setShowMobileFilters(false)}><X className="w-5 h-5" /></button>
            </div>
            {renderFilters()}
            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full mt-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm"
            >{t('apply')}</button>
          </div>
        </div>
      )}
    </>
  );
}
