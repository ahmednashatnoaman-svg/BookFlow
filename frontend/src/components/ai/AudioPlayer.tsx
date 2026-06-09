'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Loader2, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import { aiApi } from '@/lib/api';
import type { BookListing } from '@/types';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AudioPlayerProps {
  book: BookListing;
}

export default function AudioPlayer({ book }: AudioPlayerProps) {
  const locale = useLocale() as 'en' | 'ar';
  const [audioUrl, setAudioUrl] = useState<string | null>(book.audio_url);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const labels = {
    en: { generate: 'Generate Audio Preview', listen: 'Listen to Preview', loading: 'Generating audio...' },
    ar: { generate: 'توليد معاينة صوتية', listen: 'استمع للمعاينة', loading: 'جارٍ توليد الصوت...' },
  }[locale];

  useEffect(() => {
    if (audioUrl && !audioRef.current) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.addEventListener('ended', () => setPlaying(false));
      audio.addEventListener('timeupdate', () => setProgress((audio.currentTime / audio.duration) * 100 || 0));
      audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    }
    return () => { audioRef.current?.pause(); };
  }, [audioUrl]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const text = `${book.title} by ${book.author}. ${book.description ?? ''}`;
      const { audio_url } = await aiApi.tts(book.id);
      setAudioUrl(audio_url);
      const audio = new Audio(audio_url);
      audioRef.current = audio;
      audio.addEventListener('ended', () => setPlaying(false));
      audio.addEventListener('timeupdate', () => setProgress((audio.currentTime / audio.duration) * 100 || 0));
      audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    } catch {
      toast.error(locale === 'ar' ? 'فشل توليد الصوت' : 'Failed to generate audio');
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500/20 to-primary/20 flex items-center justify-center border border-teal-500/20">
          <Headphones className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <p className="font-semibold text-sm">{locale === 'ar' ? 'معاينة صوتية' : 'Audio Preview'}</p>
          <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'مولّدة بالذكاء الاصطناعي' : 'AI-generated narration'}</p>
        </div>
      </div>

      {!audioUrl && !loading && (
        <button onClick={handleGenerate}
          className="w-full py-2.5 text-sm bg-teal-500/15 text-teal-400 border border-teal-500/30 rounded-lg hover:bg-teal-500/25 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Headphones className="w-4 h-4" /> {labels.generate}
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center py-4 gap-2 text-teal-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> {labels.loading}
        </div>
      )}

      {audioUrl && !loading && (
        <div className="space-y-3">
          {/* Waveform visualizer (static decorative) */}
          <div className="flex items-center gap-0.5 h-8 justify-center">
            {Array.from({ length: 32 }).map((_, i) => (
              <motion.div key={i}
                className={cn('w-1 rounded-full', playing ? 'bg-teal-400' : 'bg-teal-400/40')}
                style={{ height: `${Math.sin(i * 0.7) * 50 + 60}%` }}
                animate={playing ? { scaleY: [1, 0.4 + Math.random(), 1] } : { scaleY: 1 }}
                transition={{ duration: 0.5 + i * 0.03, repeat: playing ? Infinity : 0, repeatType: 'reverse' }}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-muted/40 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-teal-400 to-primary rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-teal-500 text-white flex items-center justify-center hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/30"
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ms-0.5" />}
            </button>
            <span className="text-xs text-muted-foreground flex-1">
              {audioRef.current ? formatTime(audioRef.current.currentTime) : '0:00'}
              {duration > 0 && ` / ${formatTime(duration)}`}
            </span>
            <Volume2 className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      )}
    </div>
  );
}
