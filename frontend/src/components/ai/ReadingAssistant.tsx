'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, Send, Loader2, Sparkles, Users, Clock, BookMarked } from 'lucide-react';
import { useLocale } from 'next-intl';
import { aiApi } from '@/lib/api';
import type { BookListing, AIBookSummary } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ReadingAssistantProps {
  book: BookListing;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ReadingAssistant({ book }: ReadingAssistantProps) {
  const locale = useLocale() as 'en' | 'ar';
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<AIBookSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'chat'>('summary');

  const labels = {
    en: {
      title: 'AI Reading Assistant',
      subtitle: 'Get AI-powered insights about this book',
      analyze: 'Analyze This Book',
      summary: 'Summary',
      chat: 'Ask Questions',
      keyThemes: 'Key Themes',
      audience: 'Target Audience',
      mood: 'Mood & Tone',
      readTime: 'Reading Time',
      similar: 'Similar Books',
      placeholder: 'Ask anything about this book...',
      powered: 'Powered by Claude AI',
    },
    ar: {
      title: 'مساعد القراءة الذكي',
      subtitle: 'احصل على رؤى مدعومة بالذكاء الاصطناعي حول هذا الكتاب',
      analyze: 'تحليل هذا الكتاب',
      summary: 'ملخص',
      chat: 'اسأل أسئلة',
      keyThemes: 'المواضيع الرئيسية',
      audience: 'الجمهور المستهدف',
      mood: 'المزاج والأسلوب',
      readTime: 'وقت القراءة',
      similar: 'كتب مشابهة',
      placeholder: 'اسأل أي شيء عن هذا الكتاب...',
      powered: 'مدعوم من Claude AI',
    },
  }[locale];

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await aiApi.summarize(book.id);
      setSummary(result);
    } catch {
      toast.error(locale === 'ar' ? 'فشل تحليل الكتاب' : 'Failed to analyze book');
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);
    try {
      const { response } = await aiApi.chat(book.id, userMsg);
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch {
      toast.error('Failed to get response');
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-teal-500/20 flex items-center justify-center border border-primary/20">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div className="text-start">
            <p className="font-semibold text-sm">{labels.title}</p>
            <p className="text-xs text-muted-foreground">{labels.subtitle}</p>
          </div>
        </div>
        <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            transition={{ duration: 0.25 }} className="overflow-hidden"
          >
            <div className="border-t border-border">
              {/* Tabs */}
              <div className="flex border-b border-border">
                {(['summary', 'chat'] as const).map(tab => (
                  <button key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'flex-1 py-2.5 text-xs font-medium transition-colors',
                      activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {tab === 'summary' ? labels.summary : labels.chat}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {activeTab === 'summary' && (
                  <div>
                    {!summary && !loading && (
                      <div className="text-center py-6">
                        <Sparkles className="w-10 h-10 text-primary/40 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground mb-4">{labels.subtitle}</p>
                        <button onClick={handleAnalyze}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto"
                        >
                          <Brain className="w-4 h-4" /> {labels.analyze}
                        </button>
                      </div>
                    )}
                    {loading && (
                      <div className="flex flex-col items-center py-8 gap-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'جاري تحليل الكتاب...' : 'Analyzing the book...'}</p>
                      </div>
                    )}
                    {summary && (
                      <div className="space-y-4 animate-fade-in">
                        {/* Summary */}
                        <p className="text-sm text-foreground/90 leading-relaxed">{summary.summary}</p>

                        {/* Key themes */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{labels.keyThemes}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {summary.key_themes.map(theme => (
                              <span key={theme} className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full border border-primary/20">{theme}</span>
                            ))}
                          </div>
                        </div>

                        {/* Meta info */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-muted/30 rounded-lg p-2.5">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Users className="w-3 h-3 text-teal-400" />
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{labels.audience}</p>
                            </div>
                            <p className="text-xs text-foreground">{summary.target_audience}</p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-2.5">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{labels.readTime}</p>
                            </div>
                            <p className="text-xs text-foreground">{summary.reading_time_estimate}</p>
                          </div>
                        </div>

                        {/* Mood */}
                        <div className="bg-muted/30 rounded-lg p-2.5">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{labels.mood}</p>
                          <p className="text-xs text-foreground">{summary.mood}</p>
                        </div>

                        {/* Similar books */}
                        {summary.similar_books.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <BookMarked className="w-3.5 h-3.5" /> {labels.similar}
                            </p>
                            <ul className="space-y-1">
                              {summary.similar_books.map(b => (
                                <li key={b} className="text-xs text-foreground/80 flex items-start gap-1.5">
                                  <span className="text-primary mt-0.5">•</span> {b}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground/60 text-end">{labels.powered}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div>
                    <div className="space-y-3 max-h-56 overflow-y-auto mb-3 pe-1">
                      {chatMessages.length === 0 && (
                        <p className="text-center text-xs text-muted-foreground py-4">
                          {locale === 'ar' ? 'اسأل أي سؤال عن هذا الكتاب' : 'Ask any question about this book'}
                        </p>
                      )}
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                          <div className={cn(
                            'max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed',
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted/60 text-foreground rounded-bl-sm'
                          )}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-muted/60 px-3 py-2 rounded-xl rounded-bl-sm">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                    <form onSubmit={handleChat} className="flex gap-2">
                      <input
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        placeholder={labels.placeholder}
                        className="flex-1 px-3 py-2 text-xs bg-muted/40 border border-border rounded-lg focus:outline-none focus:border-primary/60"
                      />
                      <button type="submit" disabled={!chatInput.trim() || chatLoading}
                        className="p-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
