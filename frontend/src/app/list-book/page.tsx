'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, X, Scan, Plus, Loader2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';
import Header from '@/components/layout/Header';
import ISBNScanner from '@/components/ai/ISBNScanner';
import { booksApi, categoriesApi, uploadApi } from '@/lib/api';
import type { Category, BookListing, BookCondition, ListingType } from '@/types';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export default function ListBookPage() {
  const router = useRouter();
  const locale = useLocale() as 'en' | 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<{ file?: File; preview: string; url?: string }[]>([]);
  const [form, setForm] = useState({
    title: '', author: '', isbn: '', category_id: '',
    condition: 'good' as BookCondition, listing_type: 'sale' as ListingType,
    price: '', description: '', publisher: '',
    published_year: '', language: 'en', city: '',
  });

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => { });
  }, []);

  const handleISBNData = (data: Partial<BookListing>) => {
    setForm(prev => ({
      ...prev,
      title: data.title ?? prev.title,
      author: data.author ?? prev.author,
      publisher: data.publisher ?? prev.publisher,
      published_year: data.published_year?.toString() ?? prev.published_year,
      language: data.language ?? prev.language,
      category_id: data.category_id ?? prev.category_id,
    }));
    if (data.cover_image) {
      setImages([{ preview: data.cover_image, url: data.cover_image }]);
    }
  };

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (images.length + files.length > 5) {
      toast.error(locale === 'ar' ? 'الحد الأقصى 5 صور' : 'Maximum 5 images allowed');
      return;
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        setImages(prev => [...prev, { file, preview: ev.target?.result as string }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.author || !form.category_id || !form.condition) {
      toast.error(locale === 'ar' ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields');
      return;
    }
    setLoading(true);
    try {
      const uploadedImages: string[] = [];
      for (const img of images) {
        if (img.file) {
          const url = await uploadApi.bookImage(img.file);
          uploadedImages.push(url);
        } else if (img.url) {
          uploadedImages.push(img.url);
        }
      }

      const listing = await booksApi.create({
        ...form,
        price: form.price ? Number(form.price) : null,
        published_year: form.published_year ? Number(form.published_year) : null,
        images: uploadedImages,
        cover_image: uploadedImages[0] ?? null,
      });

      toast.success(locale === 'ar' ? 'تم نشر الكتاب بنجاح!' : 'Book listed successfully!');
      router.push(`/books/${listing.id}`);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary/60 transition-colors";
  const labelClass = "text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5";

  return (
    <div className="min-h-screen">
      <Header />
      <div className="page-container py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            {locale === 'ar' ? 'إضافة كتاب جديد' : 'List a Book'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {locale === 'ar' ? 'استخدم الماسح الضوئي لـ ISBN لملء البيانات تلقائياً' : 'Use the ISBN scanner to auto-fill book data'}
          </p>
        </div>

        {/* ISBN Scanner */}
        <div className="glass-card p-4 mb-6">
          <p className={labelClass}><Scan className="w-3 h-3 inline me-1" />ISBN {locale === 'ar' ? 'بحث تلقائي' : 'Auto-fill'}</p>
          <ISBNScanner onData={handleISBNData} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Images */}
          <div className="glass-card p-4">
            <p className={labelClass}>{locale === 'ar' ? 'الصور (حتى 5)' : 'Photos (up to 5)'}</p>
            <div className="flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative w-20 h-24">
                  <Image src={img.preview} alt="" fill className="object-cover rounded-lg" />
                  <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center"
                  ><X className="w-3 h-3" /></button>
                </div>
              ))}
              {images.length < 5 && (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors text-xs"
                >
                  <Upload className="w-4 h-4" />
                  {locale === 'ar' ? 'رفع' : 'Upload'}
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />
            </div>
          </div>

          {/* Title & Author */}
          <div className="glass-card p-4 space-y-4">
            <div>
              <label className={labelClass}>{locale === 'ar' ? 'عنوان الكتاب *' : 'Book Title *'}</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{locale === 'ar' ? 'المؤلف *' : 'Author *'}</label>
              <input value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} required className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{locale === 'ar' ? 'الناشر' : 'Publisher'}</label>
                <input value={form.publisher} onChange={e => setForm(p => ({ ...p, publisher: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{locale === 'ar' ? 'سنة النشر' : 'Year'}</label>
                <input type="number" value={form.published_year} onChange={e => setForm(p => ({ ...p, published_year: e.target.value }))} className={inputClass} min="1800" max={new Date().getFullYear()} />
              </div>
            </div>
          </div>

          {/* Category, Condition, Type */}
          <div className="glass-card p-4 space-y-4">
            <div>
              <label className={labelClass}>{locale === 'ar' ? 'الفئة *' : 'Category *'}</label>
              <select value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} required className={inputClass}>
                <option value="">{locale === 'ar' ? 'اختر فئة' : 'Select category'}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat[`name_${locale}`]}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{locale === 'ar' ? 'الحالة *' : 'Condition *'}</label>
                <select value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value as BookCondition }))} className={inputClass}>
                  {(['new', 'good', 'acceptable', 'poor'] as BookCondition[]).map(c => (
                    <option key={c} value={c}>{c === 'new' ? (locale === 'ar' ? 'جديد' : 'New') : c === 'good' ? (locale === 'ar' ? 'جيد' : 'Good') : c === 'acceptable' ? (locale === 'ar' ? 'مقبول' : 'Acceptable') : (locale === 'ar' ? 'سيء' : 'Poor')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{locale === 'ar' ? 'نوع الإعلان *' : 'Listing Type *'}</label>
                <select value={form.listing_type} onChange={e => setForm(p => ({ ...p, listing_type: e.target.value as ListingType }))} className={inputClass}>
                  <option value="sale">{locale === 'ar' ? 'للبيع' : 'For Sale'}</option>
                  <option value="exchange">{locale === 'ar' ? 'للتبادل' : 'For Exchange'}</option>
                </select>
              </div>
            </div>
            {form.listing_type === 'sale' && (
              <div>
                <label className={labelClass}>{locale === 'ar' ? 'السعر (ريال)' : 'Price (SAR)'}</label>
                <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className={inputClass} min="0" step="0.5" />
              </div>
            )}
          </div>

          {/* Description & Location */}
          <div className="glass-card p-4 space-y-4">
            <div>
              <label className={labelClass}>{locale === 'ar' ? 'الوصف' : 'Description'}</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} className={cn(inputClass, 'resize-none')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{locale === 'ar' ? 'المدينة' : 'City'}</label>
                <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{locale === 'ar' ? 'اللغة' : 'Language'}</label>
                <select value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))} className={inputClass}>
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-60"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{locale === 'ar' ? 'جارٍ النشر...' : 'Publishing...'}</> : <><Plus className="w-4 h-4" />{locale === 'ar' ? 'نشر الكتاب' : 'Publish Listing'}</>}
          </button>
        </form>
      </div>
    </div>
  );
}
