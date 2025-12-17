"use client";

import React from "react";
import { X } from "lucide-react";
import QRCode from "react-qr-code";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: string;
  amount: string;
  unit: string;
}

/**
 * Centered QR code modal that displays above all other components
 */
const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  invoice,
  amount,
  unit,
}) => {
  if (!isOpen || !invoice) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 z-[99999] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-black rounded-lg max-w-lg w-full m-4 border border-white/20 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">Scan QR Code</h3>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-lg p-6 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4">
            <QRCode
              value={invoice}
              size={280}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
        </div>

        <div className="mt-4 text-center">
          <div className="text-white/60 text-sm mb-2">
            {amount} {unit}s
          </div>
          <button
            onClick={() => {
              try {
                void navigator.clipboard.writeText(invoice);
              } catch {}
            }}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-lg text-sm transition-colors cursor-pointer"
          >
            Copy Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
