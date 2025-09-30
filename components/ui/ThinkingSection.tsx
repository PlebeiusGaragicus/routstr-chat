'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Brain, Lightbulb } from 'lucide-react';
import MarkdownRenderer from '@/components/MarkdownRenderer';

// Ephemeral in-memory cache for thought durations keyed by content fingerprint
const thoughtDurationCache = new Map<string, number>();
const fingerprintText = (text: string): string => {
  // Simple, fast fingerprint to survive remounts without localStorage
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  const head = text.slice(0, 64);
  const tail = text.slice(-32);
  return `${text.length}:${hash}:${head}:${tail}`;
};

interface ThinkingSectionProps {
  thinking?: string;
  thinkingContent?: string;
  isStreaming?: boolean;
}

export default function ThinkingSection({ thinking, thinkingContent, isStreaming = false }: ThinkingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine content source
  const content = useMemo(() => {
    if (isStreaming && thinkingContent) return thinkingContent;
    if (!isStreaming && thinking) return thinking;
    return thinkingContent || thinking || '';
  }, [thinking, thinkingContent, isStreaming]);

  // Collapsed streaming preview: line-by-line reveal and auto-scroll
  const [visibleLineCount, setVisibleLineCount] = useState(0);
  const contentRef = useRef<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewMaxPx = 96; // ~ a few lines
  const lines = useMemo(() => content.split('\n'), [content]);

  useEffect(() => {
    if (!isStreaming) {
      // Stop animation when not streaming
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setVisibleLineCount(0);
      return;
    }

    const prev = contentRef.current;
    const isAppend = prev && content.startsWith(prev);
    if (!isAppend) setVisibleLineCount(0);
    contentRef.current = content;

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setVisibleLineCount((n) => (n < lines.length ? n + 1 : n));
    }, 120);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [content, lines.length, isStreaming]);

  const visibleText = useMemo(() => lines.slice(0, visibleLineCount).join('\n'), [lines, visibleLineCount]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!isStreaming) return;
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      try {
        el.scrollTop = el.scrollHeight;
      } catch {}
    });
  }, [visibleText, isStreaming]);

  // Track streaming duration
  const [startTime, setStartTime] = useState<number | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  useEffect(() => {
    if (isStreaming) {
      if (startTime === null) {
        setStartTime(Date.now());
        setDurationMs(null);
      }
    } else {
      if (startTime !== null && durationMs === null) {
        const finalMs = Date.now() - startTime;
        setDurationMs(finalMs);
        // Persist in ephemeral cache using a fingerprint of the content
        const key = fingerprintText(thinking || thinkingContent || '');
        if (key) {
          thoughtDurationCache.set(key, finalMs);
        }
      } else if (durationMs == null) {
        // Attempt to recover from cache if we remounted and lost state
        const key = fingerprintText(thinking || thinkingContent || '');
        if (key && thoughtDurationCache.has(key)) {
          setDurationMs(thoughtDurationCache.get(key)!);
        }
      }
    }
  }, [isStreaming, startTime, durationMs, thinking, thinkingContent]);

  const durationLabel = useMemo(() => {
    if (durationMs == null) return null;
    const seconds = durationMs / 1000;
    const value = seconds >= 10 ? Math.round(seconds).toString() : seconds.toFixed(1).replace(/\.0$/, '');
    return `Thought for ${value}s`;
  }, [durationMs]);

  if (!thinking && !isStreaming && !thinkingContent) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
      >
        {isStreaming ? (
          <Brain className="w-3 h-3" />
        ) : (
          <Lightbulb className="w-3 h-3" />
        )}
        <span>
          {isStreaming ? 'Thinking...' : (durationLabel || 'Thought')}
        </span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>
      
      {/* Streaming collapsed preview */}
      {isStreaming && !isExpanded && (
        <motion.div
          className="mt-2 border border-white/10 rounded-lg bg-white/5 relative"
          animate={{ maxHeight: previewMaxPx }}
          initial={false}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          <div
            ref={scrollRef}
            className="p-3 overflow-y-auto"
            style={{ maxHeight: previewMaxPx }}
          >
            <div className="text-xs text-gray-300 leading-relaxed">
              {visibleText ? (
                <MarkdownRenderer content={visibleText} className="text-xs" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" />
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-3 bg-white/5 border border-white/10 rounded-lg">
              <div className="text-xs text-gray-300 leading-relaxed">
                {content ? (
                  <MarkdownRenderer content={content} className="text-xs" />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" />
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
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