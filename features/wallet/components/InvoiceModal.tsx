"use client";
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import QRCode from 'react-qr-code';
import dynamic from 'next/dynamic';

interface InvoiceModalProps {
  showInvoiceModal: boolean;
  mintInvoice: string;
  mintAmount: string;
  mintUnit: string;
  isAutoChecking: boolean;
  countdown: number;
  setShowInvoiceModal: (show: boolean) => void;
  setMintInvoice: (invoice: string) => void;
  setMintQuote: (quote: any) => void; // Use a more specific type if available
  checkIntervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  countdownIntervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  setIsAutoChecking: (checking: boolean) => void;
  checkMintQuote: () => Promise<void>;
  onPayWithWallet?: (invoice: string) => Promise<void>;
  isPayingWithWallet?: boolean;
  showWalletConnect?: boolean;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  showInvoiceModal,
  mintInvoice,
  mintAmount,
  mintUnit,
  isAutoChecking,
  countdown,
  setShowInvoiceModal,
  setMintInvoice,
  setMintQuote,
  checkIntervalRef,
  countdownIntervalRef,
  setIsAutoChecking,
  checkMintQuote,
  onPayWithWallet,
  isPayingWithWallet,
  showWalletConnect,
}) => {
  if (!showInvoiceModal || !mintInvoice) return null;

  const [bcStatus, setBcStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [bcBalance, setBcBalance] = useState<number | null>(null);

  useEffect(() => {
    let unsubConnect: undefined | (() => void);
    let unsubDisconnect: undefined | (() => void);
    let unsubConnecting: undefined | (() => void);

    (async () => {
      try {
        const mod = await import('@getalby/bitcoin-connect-react');
        const fetchBalance = async (provider: any): Promise<number | null> => {
          try {
            if (provider && typeof provider.getBalance === 'function') {
              const res = await provider.getBalance();
              if (typeof res === 'number') return res;
              if (res && typeof res === 'object') {
                // Common shapes
                if ('balance' in res && typeof (res as any).balance === 'number') {
                  const unit = ((res as any).unit || '').toString().toLowerCase();
                  const n = (res as any).balance as number;
                  return unit.includes('msat') ? Math.floor(n / 1000) : n;
                }
                if ('balanceMsats' in res && typeof (res as any).balanceMsats === 'number') {
                  return Math.floor((res as any).balanceMsats / 1000);
                }
              }
            }
          } catch {}
          return null;
        };

        unsubConnecting = mod.onConnecting?.(() => setBcStatus('connecting'));
        unsubConnect = mod.onConnected?.(async (provider: any) => {
          setBcStatus('connected');
          const sats = await fetchBalance(provider);
          if (sats !== null) setBcBalance(sats);
        });
        unsubDisconnect = mod.onDisconnected?.(() => {
          setBcStatus('disconnected');
          setBcBalance(null);
        });

        // Initial snapshot
        try {
          const cfg = mod.getConnectorConfig?.();
          if (cfg) {
            setBcStatus('connected');
            try {
              const provider = await mod.requestProvider();
              const sats = await fetchBalance(provider);
              if (sats !== null) setBcBalance(sats);
            } catch {}
          }
        } catch {}
      } catch {}
    })();

    return () => {
      try { unsubConnect && unsubConnect(); } catch {}
      try { unsubDisconnect && unsubDisconnect(); } catch {}
      try { unsubConnecting && unsubConnecting(); } catch {}
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setShowInvoiceModal(false)}>
      <div className="bg-black rounded-lg max-w-md w-full m-4 border border-white/10 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-white/10 flex-shrink-0">
          <h3 className="text-lg font-semibold text-white">Lightning Invoice</h3>
          <button onClick={() => setShowInvoiceModal(false)} className="text-white/70 hover:text-white cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {showWalletConnect && (
            <div className="bg-white/5 border border-white/20 rounded-md p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-white/70">Wallet (NWC)</span>
                {bcStatus === 'connected' ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-400">Connected</span>
                    {bcBalance !== null && <span className="text-white/70">• {bcBalance.toLocaleString()} sats</span>}
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      try {
                        const mod = await import('@getalby/bitcoin-connect-react');
                        mod.launchModal();
                      } catch {}
                    }}
                    className="px-3 py-1.5 text-xs bg-white/10 border border-white/20 rounded-md text-white hover:bg-white/15"
                    type="button"
                  >
                    {bcStatus === 'connecting' ? 'Connecting…' : 'Connect wallet'}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="bg-white/10 border border-white/20 p-4 rounded-md flex items-center justify-center">
            <div className="w-56 h-56 flex items-center justify-center p-2 rounded-md">
              <QRCode 
                value={mintInvoice} 
                size={220}
                bgColor="transparent"
                fgColor="#ffffff"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/70">Amount</span>
              <span className="text-sm font-medium text-white">{mintAmount} {mintUnit}s</span>
            </div>

            {isAutoChecking && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3 flex items-center justify-between">
                <span className="text-xs text-yellow-200/80">After payment, tokens will be automatically minted</span>
                <span className="text-xs text-yellow-200/80 flex items-center">
                  {countdown}s
                  <svg className="ml-2 w-3 h-3 animate-spin" viewBox="0 0 24 24">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </svg>
                </span>
              </div>
            )}

            <div className="mt-2">
              <div className="text-xs text-white/50 mb-1">Lightning Invoice</div>
              <div className="font-mono text-xs text-white/70 bg-white/5 border border-white/10 rounded-md p-3 break-all">
                {mintInvoice}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  try {
                    void navigator.clipboard.writeText(mintInvoice);
                  } catch {
                    // Swallow copy errors
                  }
                }}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-md text-sm transition-colors cursor-pointer"
              >
                Copy Invoice
              </button>
              {onPayWithWallet && (
                <button
                  onClick={() => { void onPayWithWallet(mintInvoice); }}
                  disabled={!!isPayingWithWallet}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-md text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPayingWithWallet ? (
                    <>
                      <svg className="inline mr-2 h-3 w-3 animate-spin" viewBox="0 0 24 24">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                      </svg>
                      Paying...
                    </>
                  ) : (
                    'Pay with wallet'
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setMintInvoice('');
                  setMintQuote(null);
                  if (checkIntervalRef.current) {
                    clearInterval(checkIntervalRef.current);
                    checkIntervalRef.current = null;
                  }
                  if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                  }
                  setIsAutoChecking(false);
                }}
                className="flex-1 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;