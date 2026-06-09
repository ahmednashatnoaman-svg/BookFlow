'use client';

import { useState, useRef } from 'react';
import { Scan, Loader2, CheckCircle } from 'lucide-react';
import { aiApi } from '@/lib/api';
import { toast } from 'sonner';
import type { BookListing } from '@/types';
import { useLocale } from 'next-intl';

interface ISBNScannerProps {
  onData: (data: Partial<BookListing>) => void;
}

export default function ISBNScanner({ onData }: ISBNScannerProps) {
  const locale = useLocale() as 'en' | 'ar';
  const [isbn, setIsbn] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const labels = {
    en: { placeholder: 'Enter ISBN-10 or ISBN-13', lookup: 'Lookup', scanning: 'Looking up...', or: 'or scan barcode' },
    ar: { placeholder: 'أدخل ISBN-10 أو ISBN-13', lookup: 'بحث', scanning: 'جارٍ البحث...', or: 'أو امسح الباركود' },
  }[locale];

  const handleLookup = async (isbnValue = isbn) => {
    if (!isbnValue.trim()) return;
    setLoading(true);
    setSuccess(false);
    try {
      const data = await aiApi.lookupISBN(isbnValue.trim());
      onData(data);
      setSuccess(true);
      toast.success(locale === 'ar' ? 'تم العثور على بيانات الكتاب' : 'Book data found!');
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      toast.error(locale === 'ar' ? 'لم يتم العثور على الكتاب' : 'Book not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          value={isbn}
          onChange={e => setIsbn(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLookup()}
          placeholder={labels.placeholder}
          className="w-full px-3 py-2 text-sm bg-muted/40 border border-border rounded-lg focus:outline-none focus:border-primary/60 pe-8"
        />
        {success && (
          <CheckCircle className="absolute end-2 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
        )}
      </div>
      <button
        onClick={() => handleLookup()}
        disabled={loading || !isbn.trim()}
        className="flex items-center gap-1.5 px-3 py-2 bg-primary/15 text-primary border border-primary/30 rounded-lg text-sm font-medium hover:bg-primary/25 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
        {loading ? labels.scanning : labels.lookup}
      </button>
    </div>
  );
}
