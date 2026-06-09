'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ArrowLeftRight, X, Loader2, Send } from 'lucide-react';
import { requestsApi, booksApi } from '@/lib/api';
import type { BookListing } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RequestModalProps {
  book: BookListing;
  userId: string | null;
  locale: 'en' | 'ar';
}

export default function RequestModal({ book, userId, locale }: RequestModalProps) {
  const [open, setOpen] = useState(false);
  const [myBooks, setMyBooks] = useState<BookListing[]>([]);
  const [selectedOfferBook, setSelectedOfferBook] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const labels = {
    en: {
      contact: 'Contact Seller', propose: 'Propose Exchange',
      selectOffer: 'Select a book to offer',
      noBooks: 'You have no listed books to offer',
      messagePlaceholder: 'Add a message (optional)',
      send: 'Send Request', sending: 'Sending...',
      loginRequired: 'Please sign in to send a request',
      success: 'Request sent!',
    },
    ar: {
      contact: 'تواصل مع البائع', propose: 'اقتراح تبادل',
      selectOffer: 'اختر كتاباً للعرض',
      noBooks: 'ليس لديك كتب معروضة للتبادل',
      messagePlaceholder: 'أضف رسالة (اختياري)',
      send: 'إرسال الطلب', sending: 'جارٍ الإرسال...',
      loginRequired: 'يجب تسجيل الدخول لإرسال طلب',
      success: 'تم إرسال الطلب!',
    },
  }[locale];

  const handleOpen = async () => {
    if (!userId) {
      toast.error(labels.loginRequired);
      return;
    }
    if (book.listing_type === 'exchange') {
      const books = await booksApi.myListings();
      setMyBooks(books.filter(b => b.status === 'available' && b.id !== book.id));
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
      toast.success(labels.success);
      setOpen(false);
      setMessage('');
      setSelectedOfferBook(null);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={handleOpen}
        className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
      >
        {book.listing_type === 'exchange' ? <ArrowLeftRight className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
        {book.listing_type === 'exchange' ? labels.propose : labels.contact}
      </button>

      <AnimatePresence>
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
                  {book.listing_type === 'exchange' ? labels.propose : labels.contact}
                </h3>
                <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-muted/60 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Target book preview */}
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                  <div className="w-10 h-12 rounded bg-muted/60 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold line-clamp-1">{book.title}</p>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                  </div>
                </div>

                {/* Exchange offer selector */}
                {book.listing_type === 'exchange' && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">{labels.selectOffer}</label>
                    {myBooks.length === 0 ? (
                      <p className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-3">{labels.noBooks}</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {myBooks.map(b => (
                          <button key={b.id}
                            onClick={() => setSelectedOfferBook(b.id === selectedOfferBook ? null : b.id)}
                            className={cn(
                              'w-full flex items-center gap-3 p-2.5 rounded-xl border text-start transition-all',
                              selectedOfferBook === b.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                            )}
                          >
                            <div className="w-8 h-10 rounded bg-muted/60 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate">{b.title}</p>
                              <p className="text-[10px] text-muted-foreground">{b.author}</p>
                            </div>
                            {selectedOfferBook === b.id && <div className="ms-auto w-3 h-3 rounded-full bg-primary flex-shrink-0" />}
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
                    placeholder={labels.messagePlaceholder}
                    maxLength={500}
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none focus:border-primary/60 resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground text-end mt-1">{message.length}/500</p>
                </div>

                <button onClick={handleSubmit} disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-60"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{labels.sending}</> : <><Send className="w-4 h-4" />{labels.send}</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
