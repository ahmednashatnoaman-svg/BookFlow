'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, X, Loader2, BookOpen, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';
import Header from '@/components/layout/Header';
import { booksApi, categoriesApi, uploadApi } from '@/lib/api';
import type { Category, BookListing, BookCondition, ListingType } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const CURRENCIES = [
  { code: 'EGP', label: 'جنيه مصري (EGP)', labelEn: 'Egyptian Pound (EGP)' },
  { code: 'USD', label: 'دولار أمريكي (USD)', labelEn: 'US Dollar (USD)' },
  { code: 'EUR', label: 'يورو (EUR)', labelEn: 'Euro (EUR)' },
  { code: 'SAR', label: 'ريال سعودي (SAR)', labelEn: 'Saudi Riyal (SAR)' },
  { code: 'AED', label: 'درهم إماراتي (AED)', labelEn: 'UAE Dirham (AED)' },
  { code: 'GBP', label: 'جنيه إسترليني (GBP)', labelEn: 'British Pound (GBP)' },
];

const EGYPT_CITIES = [
  'القاهرة', 'الإسكندرية', 'الجيزة', 'الإسماعيلية', 'بورسعيد',
  'السويس', 'المنصورة', 'طنطا', 'أسيوط', 'أسوان',
  'Cairo', 'Alexandria', 'Giza', 'Ismailia', 'Port Said',
  'Suez', 'Mansoura', 'Tanta', 'Assiut', 'Aswan',
];

export default function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const locale = useLocale() as 'en' | 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<{ preview: string; url?: string; file?: File }[]>([]);
  const [form, setForm] = useState({
    title: '', author: '', isbn: '', category_id: '',
    condition: 'good' as BookCondition, listing_type: 'sale' as ListingType,
    price: '', currency: 'EGP', description: '', publisher: '',
    published_year: '', language: 'ar', city: '', status: 'available',
  });

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => {});
    booksApi.get(id).then((book: BookListing) => {
      setForm({
        title: book.title ?? '',
        author: book.author ?? '',
        isbn: book.isbn ?? '',
        category_id: book.category_id ?? '',
        condition: book.condition,
        listing_type: book.listing_type,
        price: book.price?.toString() ?? '',
        currency: book.currency ?? 'EGP',
        description: book.description ?? '',
        publisher: book.publisher ?? '',
        published_year: book.published_year?.toString() ?? '',
        language: book.language ?? 'ar',
        city: book.city ?? '',
        status: book.status,
      });
      const imgs = (book.images?.length ? book.images : book.cover_image ? [book.cover_image] : [])
        .map((url: string) => ({ preview: url, url }));
      setImages(imgs);
      setLoading(false);
    }).catch(() => {
      toast.error(locale === 'ar' ? 'لم يتم العثور على الإعلان' : 'Listing not found');
      router.push('/dashboard/listings');
    });
  }, [id, router, locale]);

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
    if (!form.title || !form.author) {
      toast.error(locale === 'ar' ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields');
      return;
    }
    setSaving(true);
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

      await booksApi.update(id, {
        ...form,
        price: form.price ? Number(form.price) : null,
        published_year: form.published_year ? Number(form.published_year) : null,
        images: uploadedImages,
        cover_image: uploadedImages[0] ?? null,
        status: form.status as import('@/types').ListingStatus,
      });

      toast.success(locale === 'ar' ? 'تم تحديث الكتاب بنجاح!' : 'Listing updated successfully!');
      router.push('/dashboard/listings');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (locale === 'ar' ? 'فشل تحديث الكتاب' : 'Failed to update listing');
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary/60 transition-colors";
  const labelClass = "text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5";

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="page-container py-8 max-w-2xl">
        <div className="mb-8">
          <Link href="/dashboard/listings"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl-flip" />
            {locale === 'ar' ? 'العودة إلى كتبي' : 'Back to My Listings'}
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            {locale === 'ar' ? 'تعديل الكتاب' : 'Edit Listing'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {locale === 'ar' ? 'قم بتحديث معلومات كتابك' : 'Update your book information'}
          </p>
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
                    aria-label={locale === 'ar' ? 'حذف الصورة' : 'Remove image'}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
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
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                aria-label={locale === 'ar' ? 'رفع صور' : 'Upload images'}
                onChange={handleImageAdd} />
            </div>
          </div>

          {/* Title & Author */}
          <div className="glass-card p-4 space-y-4">
            <div>
              <label className={labelClass}>{locale === 'ar' ? 'عنوان الكتاب *' : 'Book Title *'}</label>
              <input aria-label="Book title" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{locale === 'ar' ? 'المؤلف *' : 'Author *'}</label>
              <input aria-label="Author" value={form.author}
                onChange={e => setForm(p => ({ ...p, author: e.target.value }))} required className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{locale === 'ar' ? 'الناشر' : 'Publisher'}</label>
                <input aria-label="Publisher" value={form.publisher}
                  onChange={e => setForm(p => ({ ...p, publisher: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{locale === 'ar' ? 'سنة النشر' : 'Year'}</label>
                <input aria-label="Published year" type="number" value={form.published_year}
                  onChange={e => setForm(p => ({ ...p, published_year: e.target.value }))}
                  className={inputClass} min="1800" max={new Date().getFullYear()} />
              </div>
            </div>
          </div>

          {/* Category, Condition, Type */}
          <div className="glass-card p-4 space-y-4">
            <div>
              <label className={labelClass}>{locale === 'ar' ? 'الفئة *' : 'Category *'}</label>
              <select aria-label="Category" value={form.category_id}
                onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} required className={inputClass}>
                <option value="">{locale === 'ar' ? 'اختر فئة' : 'Select category'}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {locale === 'ar' ? cat.name_ar : cat.name_en}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{locale === 'ar' ? 'الحالة *' : 'Condition *'}</label>
                <select aria-label="Condition" value={form.condition}
                  onChange={e => setForm(p => ({ ...p, condition: e.target.value as BookCondition }))} className={inputClass}>
                  <option value="new">{locale === 'ar' ? 'جديد' : 'New'}</option>
                  <option value="good">{locale === 'ar' ? 'جيد' : 'Good'}</option>
                  <option value="acceptable">{locale === 'ar' ? 'مقبول' : 'Acceptable'}</option>
                  <option value="poor">{locale === 'ar' ? 'سيء' : 'Poor'}</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>{locale === 'ar' ? 'نوع الإعلان *' : 'Listing Type *'}</label>
                <select aria-label="Listing type" value={form.listing_type}
                  onChange={e => setForm(p => ({ ...p, listing_type: e.target.value as ListingType }))} className={inputClass}>
                  <option value="sale">{locale === 'ar' ? 'للبيع' : 'For Sale'}</option>
                  <option value="exchange">{locale === 'ar' ? 'للتبادل' : 'For Exchange'}</option>
                </select>
              </div>
            </div>

            {form.listing_type === 'sale' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{locale === 'ar' ? 'السعر' : 'Price'}</label>
                  <input aria-label="Price" type="number" value={form.price}
                    onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    className={inputClass} min="0" step="0.5" />
                </div>
                <div>
                  <label className={labelClass}>{locale === 'ar' ? 'العملة' : 'Currency'}</label>
                  <select aria-label="Currency" value={form.currency}
                    onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} className={inputClass}>
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {locale === 'ar' ? c.label : c.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Description & Location */}
          <div className="glass-card p-4 space-y-4">
            <div>
              <label className={labelClass}>{locale === 'ar' ? 'الوصف' : 'Description'}</label>
              <textarea aria-label="Description" value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={4} className={cn(inputClass, 'resize-none')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{locale === 'ar' ? 'المدينة' : 'City'}</label>
                <input aria-label="City" value={form.city}
                  onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  list="edit-city-suggestions"
                  className={inputClass}
                  placeholder={locale === 'ar' ? 'مثال: القاهرة' : 'e.g. Cairo'} />
                <datalist id="edit-city-suggestions">
                  {EGYPT_CITIES.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div>
                <label className={labelClass}>{locale === 'ar' ? 'لغة الكتاب' : 'Book Language'}</label>
                <select aria-label="Language" value={form.language}
                  onChange={e => setForm(p => ({ ...p, language: e.target.value }))} className={inputClass}>
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="other">{locale === 'ar' ? 'أخرى' : 'Other'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="glass-card p-4">
            <label className={labelClass}>{locale === 'ar' ? 'حالة الإعلان' : 'Listing Status'}</label>
            <select aria-label="Listing status" value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={inputClass}>
              <option value="available">{locale === 'ar' ? 'متاح' : 'Available'}</option>
              <option value="unavailable">{locale === 'ar' ? 'غير متاح' : 'Unavailable'}</option>
              <option value="sold">{locale === 'ar' ? 'مُباع' : 'Sold'}</option>
              <option value="exchanged">{locale === 'ar' ? 'تم التبادل' : 'Exchanged'}</option>
            </select>
          </div>

          <div className="flex gap-3">
            <Link href="/dashboard/listings"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 border border-border rounded-xl font-semibold text-muted-foreground hover:bg-muted/30 transition-all"
            >
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </Link>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-60"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" />{locale === 'ar' ? 'جارٍ الحفظ...' : 'Saving...'}</>
                : <><Save className="w-4 h-4" />{locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
