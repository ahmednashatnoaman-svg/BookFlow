'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import {
  Send, Loader2, Sparkles, Bot, User, BookOpen,
  ArrowLeftRight, Tag, MapPin, RefreshCw, ChevronRight,
} from 'lucide-react';
import { formatPrice, getImageUrl, cn } from '@/lib/utils';
import type { BookListing } from '@/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  books?: BookListing[];
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

const SUGGESTIONS = [
  'Find me novels under 30 SAR',
  'Show me exchange-only books',
  'Any science books in Riyadh?',
  'Best books in good condition',
  'Arabic literature available',
  'Computer science textbooks',
];

const SUGGESTIONS_AR = [
  'أبحث عن روايات أقل من 30 ريال',
  'كتب متاحة للتبادل فقط',
  'كتب في الرياض',
  'كتب بحالة جيدة',
  'أدب عربي متاح',
  'كتب علوم الحاسب',
];

function BookResultCard({ book }: { book: BookListing }) {
  const img = getImageUrl((book.images?.[0] ?? book.cover_image) ?? null, SUPABASE_URL);
  return (
    <Link href={`/books/${book.id}`}
      className="flex items-center gap-3 p-3 glass-card hover:border-primary/40 transition-all group"
    >
      <div className="relative w-10 h-14 flex-shrink-0 rounded-md overflow-hidden bg-muted/40">
        <Image src={img} alt={book.title} fill className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{book.title}</p>
        <p className="text-xs text-muted-foreground truncate">{book.author}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={cn(
            'text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5',
            book.listing_type === 'exchange'
              ? 'bg-teal-500/10 text-teal-400'
              : 'bg-primary/10 text-primary',
          )}>
            {book.listing_type === 'exchange'
              ? <><ArrowLeftRight className="w-2.5 h-2.5" /> Exchange</>
              : <><Tag className="w-2.5 h-2.5" /> {formatPrice(book.price, 'en')}</>
            }
          </span>
          {book.city && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" />{book.city}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
        isUser ? 'bg-primary' : 'bg-gradient-to-br from-violet-500 to-teal-400',
      )}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
      </div>

      <div className={cn('flex-1 min-w-0 max-w-[80%]', isUser ? 'items-end' : 'items-start')}>
        <div className={cn(
          'px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm ms-auto'
            : 'bg-card border border-border rounded-tl-sm',
        )}>
          {message.content}
        </div>

        {/* Book results grid */}
        {message.books && message.books.length > 0 && (
          <div className="mt-3 space-y-2 w-full">
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {message.books.length} book{message.books.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid gap-2">
              {message.books.slice(0, 6).map(book => (
                <BookResultCard key={book.id} book={book} />
              ))}
            </div>
            {message.books.length > 6 && (
              <p className="text-xs text-muted-foreground text-center py-1">
                +{message.books.length - 6} more results
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [locale] = useState<'en' | 'ar'>('en');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          locale,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response ?? 'Sorry, I encountered an issue. Please try again.',
        books: data.books ?? [],
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please check your connection and try again.',
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, locale]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const suggestions = locale === 'ar' ? SUGGESTIONS_AR : SUGGESTIONS;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col page-container py-4 max-w-3xl">
        {/* Welcome / empty state */}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-teal-400/20 border border-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">BookFlow AI Assistant</h1>
              <p className="text-muted-foreground text-sm max-w-md">
                Ask me anything about books. I can search by price, genre, condition, location, or any combination of filters.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-lg">
              {suggestions.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  className="px-3 py-2.5 text-xs text-left glass-card hover:border-primary/40 hover:text-primary transition-all rounded-xl leading-tight"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="flex-1 space-y-6 py-4 overflow-y-auto">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="px-4 py-3 glass-card rounded-2xl rounded-tl-sm">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}

        {/* Input */}
        <div className="sticky bottom-0 pt-4 pb-2 bg-background/90 backdrop-blur-sm">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              className="mb-2 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> New conversation
            </button>
          )}

          <div className="glass-card flex items-end gap-2 p-2 focus-within:border-primary/50 transition-colors">
            <Bot className="w-5 h-5 text-muted-foreground/60 mb-2 flex-shrink-0" />
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about books… e.g. 'novels under 40 SAR in Riyadh'"
              rows={1}
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/50 resize-none focus:outline-none py-2 max-h-32"
              style={{ lineHeight: '1.5' }}
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-9 h-9 flex-shrink-0 bg-primary text-primary-foreground rounded-lg flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/40 text-center mt-1.5">
            AI responses are based on real listings in BookFlow marketplace
          </p>
        </div>
      </div>
    </div>
  );
}
