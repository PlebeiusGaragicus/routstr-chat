import React from "react";
import NostrRelayManager from "./settings/NostrRelayManager";

interface QueryTimeoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueryTimeoutModal: React.FC<QueryTimeoutModalProps> = ({
  isOpen,
  onClose,
}) => {
  const handleRefresh = () => {
    try {
      localStorage.setItem("cashu_relays_timeout", "false");
    } catch {}
    window.location.reload();
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem("cashu_relays_timeout", "false");
    } catch {}
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/10 rounded-xl max-w-sm w-full p-5 relative">
        <h2 className="text-xl font-semibold text-center text-white mb-4">
          Connection Timeout
        </h2>
        <p className="text-sm text-gray-400 mb-4 text-center">
          It looks like there was a problem connecting to the relays. Please
          add/remove relays and refresh the page to try again.
        </p>
        <NostrRelayManager />
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-lg text-sm font-medium transition-all cursor-pointer"
          >
            Dismiss
          </button>
          <button
            onClick={handleRefresh}
            className="flex-1 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
};
