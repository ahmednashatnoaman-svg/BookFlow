'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ArrowLeftRight, X, Loader2, Send, LogIn, BookOpen } from 'lucide-react';
import { requestsApi, booksApi } from '@/lib/api';
import type { BookListing } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RequestModalProps {
  book: BookListing;
  userId: string | null;
  locale: 'en' | 'ar';
}

const labels = {
  en: {
    contact: 'Contact Seller',
    propose: 'Propose Exchange',
    selectOffer: 'Select a book to offer',
    noBooks: 'You have no listed books to offer. List a book first.',
    messagePlaceholder: 'Add a message to the seller (optional)',
    send: 'Send Request',
    sending: 'Sending…',
    success: 'Request sent successfully!',
    loginTitle: 'Sign in to continue',
    loginSub: 'You need an account to contact sellers and propose exchanges.',
    loginBtn: 'Sign In',
    registerBtn: 'Create Free Account',
  },
  ar: {
    contact: 'تواصل مع البائع',
    propose: 'اقتراح تبادل',
    selectOffer: 'اختر كتاباً للعرض',
    noBooks: 'ليس لديك كتب معروضة. أضف كتاباً أولاً.',
    messagePlaceholder: 'أضف رسالة للبائع (اختياري)',
    send: 'إرسال الطلب',
    sending: 'جارٍ الإرسال…',
    success: 'تم إرسال الطلب بنجاح!',
    loginTitle: 'سجّل الدخول للمتابعة',
    loginSub: 'تحتاج إلى حساب للتواصل مع البائعين واقتراح التبادلات.',
    loginBtn: 'تسجيل الدخول',
    registerBtn: 'إنشاء حساب مجاني',
  },
};

export default function RequestModal({ book, userId, locale }: RequestModalProps) {
  const router = useRouter();
  const t = labels[locale];

  const [open, setOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [myBooks, setMyBooks] = useState<BookListing[]>([]);
  const [selectedOfferBook, setSelectedOfferBook] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    if (!userId) {
      setShowLoginPrompt(true);
      return;
    }
    if (book.listing_type === 'exchange') {
      try {
        const books = await booksApi.myListings();
        setMyBooks(books.filter(b => b.status === 'available' && b.id !== book.id));
      } catch { setMyBooks([]); }
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await requestsApi.create({
        listing_id: book.id,
        offer_listing_id: selectedOfferBook ?? undefined,
        message: message.trim() || undefined,
      });
      toast.success(t.success);
      setOpen(false);
      setMessage('');
      setSelectedOfferBook(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send request';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isExchange = book.listing_type === 'exchange';

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 active:scale-[.98] transition-all shadow-lg shadow-primary/25"
      >
        {isExchange ? <ArrowLeftRight className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
        {isExchange ? t.propose : t.contact}
      </button>

      <AnimatePresence>
        {/* Guest login prompt */}
        {showLoginPrompt && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowLoginPrompt(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-sm bg-card border border-border rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl text-center"
            >
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowLoginPrompt(false)}
                className="absolute top-4 end-4 p-1.5 hover:bg-muted/60 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t.loginTitle}</h3>
              <p className="text-sm text-muted-foreground mb-6">{t.loginSub}</p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => router.push(`/auth/register?redirect=/books/${book.id}`)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all"
                >
                  {t.registerBtn}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/auth/login?redirect=/books/${book.id}`)}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-border rounded-xl text-sm font-medium hover:bg-muted/40 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  {t.loginBtn}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Request modal */}
        {open && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-card border border-border rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg">
                  {isExchange ? t.propose : t.contact}
                </h3>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="p-1.5 hover:bg-muted/60 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Target book preview */}
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
                  {book.cover_image ? (
                    <img src={book.cover_image} alt={book.title} className="w-10 h-12 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-12 rounded bg-muted/60 flex-shrink-0 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold line-clamp-1">{book.title}</p>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                  </div>
                </div>

                {/* Exchange offer selector */}
                {isExchange && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                      {t.selectOffer}
                    </label>
                    {myBooks.length === 0 ? (
                      <p className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-3">{t.noBooks}</p>
                    ) : (
                      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                        {myBooks.map(b => (
                          <button
                            type="button"
                            key={b.id}
                            onClick={() => setSelectedOfferBook(b.id === selectedOfferBook ? null : b.id)}
                            className={cn(
                              'w-full flex items-center gap-3 p-2.5 rounded-xl border text-start transition-all',
                              selectedOfferBook === b.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/40 hover:bg-muted/20'
                            )}
                          >
                            {b.cover_image ? (
                              <img src={b.cover_image} alt={b.title} className="w-8 h-10 rounded object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-10 rounded bg-muted/60 flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate">{b.title}</p>
                              <p className="text-[10px] text-muted-foreground">{b.author}</p>
                            </div>
                            {selectedOfferBook === b.id && (
                              <div className="ms-auto w-4 h-4 rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Message */}
                <div>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={t.messagePlaceholder}
                    maxLength={500}
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none focus:border-primary/60 resize-none transition-colors"
                  />
                  <p className="text-[10px] text-muted-foreground text-end mt-1">{message.length}/500</p>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || (isExchange && !selectedOfferBook && myBooks.length > 0)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />{t.sending}</>
                    : <><Send className="w-4 h-4" />{t.send}</>
                  }
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
