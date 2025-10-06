import React, { useState, useEffect } from 'react';
import { LogOut, XCircle, Copy } from 'lucide-react';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import NostrRelayManager from './NostrRelayManager'; // Import the new component
import { useLoggedInAccounts } from '@/hooks/useLoggedInAccounts';
import { useLoginActions } from '@/hooks/useLoginActions';
import { useNostrLogin } from '@nostrify/react/login';

interface GeneralTabProps {
  publicKey: string | undefined;
  nsecData?: { nsec: `nsec1${string}`; } | { bunkerPubkey: string; clientNsec: `nsec1${string}`; relays: string[]; } | { [key: string]: unknown; } | null;
  loginType: 'nsec' | "bunker" | "extension" | `x-${string}` | undefined;
  logout?: () => void;
  router?: AppRouterInstance;
  onClose: () => void;
  mintUrl: string;
  setMintUrl: (url: string) => void;
  // Model configuration moved to Models tab
}

const GeneralTab: React.FC<GeneralTabProps> = ({
  publicKey,
  nsecData,
  loginType,
  logout,
  router,
  onClose,
  mintUrl,
  setMintUrl,
  // Model configuration moved to Models tab
}) => {
  // Model configuration moved to Models tab
  const [showNsec, setShowNsec] = useState<boolean>(false);
  const [nsecValue, setNsecValue] = useState<string>('');
  const [showNsecWarning, setShowNsecWarning] = useState<boolean>(false);
  const [newNsec, setNewNsec] = useState<string>('');

  const toast = (message: string) => {
    alert(message); // Placeholder for a proper toast notification
  };

  const { currentUser, otherUsers, setLogin, removeLogin } = useLoggedInAccounts();
  const { logins } = useNostrLogin();
  const loginActions = useLoginActions();

  useEffect(() => {
    if (localStorage.getItem('nsec_storing_skipped') === 'true') {
      setShowNsecWarning(true);
    }
  }, []);

  const handleCloseNsecWarning = () => {
    if (window.confirm('Are you sure you want to dismiss this warning? You will not be reminded again unless you clear your browser local storage.')) {
      localStorage.setItem('nsec_storing_skipped', 'false');
      setShowNsecWarning(false);
    }
  };

  const isValidRelay = (url: string) => {
    try {
      const u = new URL(url.trim());
      return u.protocol === 'wss:';
    } catch { return false; }
  };

  // Model configuration moved to Models tab

  return (
    <>
      {showNsecWarning && (
        <div className="relative bg-red-500/5 border border-red-500/20 text-red-400 px-4 py-3 rounded-md mb-6">
          <p className="text-sm pr-12">
            <span className="font-bold">Warning:</span> Your nsec is currently stored only in your browser's local storage. It will be lost if you clear your browser data. Please consider exporting and securely storing your nsec.
          </p>
          <button
            onClick={handleCloseNsecWarning}
            className="absolute top-3 right-4 p-1.5 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
            type="button"
            title="Dismiss warning"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-white/80 mb-2">Cashu Mint URL</h3>
        <input
          type="text"
          className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
          placeholder="https://mint.minibits.cash/Bitcoin"
          value={mintUrl}
          onChange={(e) => setMintUrl(e.target.value)}
        />
        <p className="text-xs text-white/50 mt-1">The Cashu mint used for token generation</p>
      </div>

      {/* Nostr Relays */}
      <NostrRelayManager />

      {/* Model configuration moved to Models tab */}

      {/* Account Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-white/80 mb-2">Account</h3>
        <div className="mb-3 bg-white/5 border border-white/10 rounded-md p-3">
          <div className="text-xs text-white/50 mb-1">Current Account</div>
          <div className="font-mono text-xs text-white/70 break-all">
            {currentUser?.pubkey || publicKey || 'Not available'}
          </div>
        </div>
        {otherUsers && otherUsers.length > 0 && (
          <div className="mb-3 bg-white/5 border border-white/10 rounded-md p-3">
            <div className="text-xs text-white/50 mb-2">Switch Account</div>
            <div className="flex flex-col gap-2">
              {otherUsers.map((acct) => (
                <div key={acct.id} className="flex items-center gap-2">
                  <div className="flex-1 font-mono text-xs text-white/60 break-all">{acct.pubkey}</div>
                  <button
                    className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs cursor-pointer"
                    onClick={() => setLogin(acct.id)}
                    type="button"
                  >
                    Use
                  </button>
                  <button
                    className="px-2 py-1 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs cursor-pointer"
                    onClick={() => removeLogin(acct.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mb-3 bg-white/5 border border-white/10 rounded-md p-3">
          <div className="text-xs text-white/50 mb-2">Add Account by nsec</div>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 bg-transparent border border-white/10 rounded-md px-3 py-2 text-xs text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
              placeholder="nsec1..."
              value={newNsec}
              onChange={(e) => setNewNsec(e.target.value)}
            />
            <button
              className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm cursor-pointer"
              onClick={() => {
                const trimmed = newNsec.trim();
                if (!trimmed.startsWith('nsec1')) return;
                try {
                  loginActions.nsec(trimmed);
                  setNewNsec('');
                } catch {}
              }}
              type="button"
            >
              Add
            </button>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          {loginType === 'nsec' && nsecData && (
            <button
              className="flex-grow flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer"
              onClick={() => {
                const nsec = nsecData && 'nsec' in nsecData && typeof nsecData.nsec === 'string' && nsecData.nsec.startsWith('nsec1') ? nsecData.nsec : '';
                setNsecValue(nsec);
                setShowNsec(!showNsec);
              }}
              type="button"
            >
              <span>{showNsec ? 'Hide nsec' : 'Export nsec'}</span>
            </button>
          )}
          {logout && router && (
            <button
              className="flex-grow flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer"
              onClick={() => {
                if (window.confirm('Are you sure you want to sign out?')) {
                  logout();
                  router.push('/');
                  onClose();
                }
              }}
              type="button"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
        {showNsec && (
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-md text-sm text-white break-all mt-2">
            <span className="flex-grow">{nsecValue}</span>
            <button
              className="p-1 rounded-md hover:bg-white/10"
              onClick={() => {
                navigator.clipboard.writeText(nsecValue);
                toast('nsec copied to clipboard!');
              }}
              type="button"
              title="Copy nsec"
            >
              <Copy className="h-4 w-4 text-white/70" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default GeneralTab;