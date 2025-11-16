'use client';

import { useEffect } from 'react';
import { Workbox } from 'workbox-window';

export default function SWUpdater() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    
    // Don't register service worker in development to avoid HMR conflicts
    if (process.env.NODE_ENV === 'development') return;

    const wb = new Workbox('/sw.js');
    let prompted = false;

    wb.addEventListener('waiting', () => {
      // TODO: Replace with your own toast/dialog UX. For now, auto-activate.
      if (!prompted) {
        prompted = true;
        wb.messageSkipWaiting();
      }
    });

    wb.addEventListener('controlling', () => {
      window.location.reload();
    });

    wb.register().catch(() => {
      // no-op: ignore registration failure in dev or unsupported contexts
    });
  }, []);

  return null;
}