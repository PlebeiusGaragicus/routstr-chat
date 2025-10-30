'use client';

import { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { downloadImageFromSrc } from '../utils/download';
import { FileText } from 'lucide-react';
import type { MessageContent as ChatMessageContent } from '@/types/chat';

interface MessageContentProps {
  content: string | ChatMessageContent[];
}

export default function MessageContentRenderer({ content }: MessageContentProps) {
  type ImageStatus = 'loading' | 'loaded' | 'error';
  const [imageStatusMap, setImageStatusMap] = useState<Record<string, ImageStatus>>({});

  const setImageStatus = (key: string, status: ImageStatus) => {
    setImageStatusMap(prev => {
      if (prev[key] === status) return prev;
      return { ...prev, [key]: status };
    });
  };

  const isImageLoaded = (key: string) => imageStatusMap[key] === 'loaded';
  const isImageError = (key: string) => imageStatusMap[key] === 'error';

  if (typeof content === 'string') {
    return <MarkdownRenderer content={content} />;
  }

  const getAttachmentLabel = (mimeType?: string): string | null => {
    if (!mimeType) return null;
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.startsWith('image/')) {
      return mimeType.replace('image/', '').toUpperCase();
    }
    return mimeType.toUpperCase();
  };

  const imageContent = content.filter(item => item.type === 'image_url');

  // Separate text, image, and file content
  const textContent = content.filter(item => item.type === 'text' && !item.hidden);
  const fileContent = content.filter(item => item.type === 'file');

  return (
    <div className="space-y-2">
      {/* Render text content first */}
      {textContent.map((item, index) => (
        <MarkdownRenderer key={`text-${index}`} content={item.text || ''} />
      ))}

      {/* Render file attachments */}
      {fileContent.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {fileContent.map((item, index) => {
            const label = getAttachmentLabel(item.file?.mimeType);
            return (
              <div
                key={`file-${index}`}
                className="flex w-[220px] max-w-full h-16 items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2"
              >
                <FileText className="h-5 w-5 text-white/80 flex-shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white" title={item.file?.name || 'Attachment'}>
                    {item.file?.name || 'Attachment'}
                  </p>
                  {label && (
                    <p className="text-xs uppercase text-white/60">{label}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Render images in a flex container */}
      {imageContent.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {imageContent.map((item, index) => {
            const imageUrl = item.image_url?.url;
            const statusKey = `${index}-${imageUrl ?? 'no-url'}`;
            const loaded = isImageLoaded(statusKey);
            const errored = isImageError(statusKey);

            return (
              <div
                key={`image-${index}`}
                className={`relative group flex-shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/5`}
                style={{
                  width: 'min(320px, 100%)',
                  aspectRatio: loaded ? undefined : '1 / 1'
                }}
              >
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${loaded || errored ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                >
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
                  <div className="relative h-10 w-10 rounded-full border-2 border-white/40 border-t-transparent animate-spin" />
                </div>
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Image"
                    onLoad={() => setImageStatus(statusKey, 'loaded')}
                    onError={() => setImageStatus(statusKey, 'error')}
                    className={`block max-w-[320px] w-full h-full max-h-[360px] object-contain bg-black/40 transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                  />
                )}
                {errored && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-xs p-4 text-center">
                    Image failed to load
                  </div>
                )}
                <button
                  type="button"
                  disabled={!loaded || !imageUrl}
                  onClick={() => imageUrl && downloadImageFromSrc(imageUrl)}
                  className={`absolute top-3 right-3 transition-opacity bg-black/60 hover:bg-black/80 text-white text-xs rounded-md px-2 py-1 border border-white/20 ${loaded ? 'opacity-100 md:opacity-0 md:group-hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
                  aria-label="Download image"
                >
                  Download
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 
