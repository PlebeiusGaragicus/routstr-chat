'use client';

import { ReactNode, useEffect } from 'react';
import { useEffect as useReactEffect } from 'react';
import { useNostrLogin } from '@nostrify/react/login';
import { useLoginActions } from '@/hooks/useLoginActions';
import { generateSecretKey, nip19 } from 'nostr-tools';
import NostrProvider from '@/components/NostrProvider'
import dynamic from 'next/dynamic';
import { migrateStorageItems } from '@/utils/storageUtils';
import { InvoiceRecoveryProvider } from '@/components/InvoiceRecoveryProvider';

const DynamicNostrLoginProvider = dynamic(
  () => import('@nostrify/react/login').then((mod) => mod.NostrLoginProvider),
  { ssr: false }
);

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AppProvider } from './AppProvider';
import { AppConfig } from '@/context/AppContext';

const presetRelays = [
  { url: 'wss://relay.routstr.com', name: 'Routstr Relay' },
  { url: 'wss://relay.damus.io', name: 'Damus' },
  { url: 'wss://nos.lol', name: 'nos.lol' },
  { url: 'wss://relay.nostr.band', name: 'Nostr.Band' },
  { url: 'wss://relay.primal.net', name: 'Primal' },
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
      gcTime: Infinity,
    },
  },
});

const defaultConfig: AppConfig = {
  relayUrls: [
...presetRelays.slice(0, 3).map(relay => relay.url),
  ]
};

export default function ClientProviders({ children }: { children: ReactNode }) {
  function AutoLogin() {
    const { logins } = useNostrLogin();
    const loginActions = useLoginActions();

    useReactEffect(() => {
      if (logins.length === 0) {
        try {
          const sk = generateSecretKey();
          const nsec = nip19.nsecEncode(sk);
          loginActions.nsec(nsec);
        } catch (err) {
          // no-op
        }
      }
    }, [logins.length]);

    return null;
  }
  // Run storage migration on app startup
  useEffect(() => {
    migrateStorageItems();
  }, []); 

  // Start MSW in development only
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // dynamic import to avoid including in prod bundles
      import('@/mocks/browser').then(({ worker }) => {
        worker.start({
          onUnhandledRequest: 'bypass',
          serviceWorker: {
            url: '/mockServiceWorker.js',
          },
        });
      }).catch(() => {
        // no-op if MSW is not available
      });
    }
  }, []);

  return (
    <AppProvider storageKey="nostr:app-config" defaultConfig={defaultConfig} presetRelays={presetRelays}>
      <DynamicNostrLoginProvider storageKey='nostr:login'>
        <NostrProvider>
          <AutoLogin />
          <QueryClientProvider client={queryClient}>
            <InvoiceRecoveryProvider>
            {children}
            </InvoiceRecoveryProvider>
        </QueryClientProvider>
        </NostrProvider>
      </DynamicNostrLoginProvider>
    </AppProvider>
  );
}