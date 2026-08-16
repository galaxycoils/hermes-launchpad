import { FocusTrap } from "focus-trap-react";
import type { WalletChoice } from "@/lib/wallet";

interface WalletSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (choice: WalletChoice) => void;
}

export default function WalletSelectorModal({ open, onClose, onSelect }: WalletSelectorModalProps) {
  if (!open) return null;

  return (
    <FocusTrap focusTrapOptions={{ initialFocus: false, allowOutsideClick: true }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface p-6" onClick={(e) => e.stopPropagation()}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black">Connect Wallet</h2>
            <button onClick={onClose} className="text-white/50 hover:text-white text-xl" aria-label="Close">×</button>
          </div>
          <p className="text-xs text-white/50 mb-4">Select your wallet to connect. If you don't have one, install Phantom or Solflare.</p>

          <div className="space-y-3">
            <button
              onClick={() => onSelect("phantom")}
              className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:bg-white/10 hover:border-white/20 active:scale-[0.98]"
            >
              <div className="text-3xl">🟣</div>
              <div className="flex-1">
                <div className="font-bold text-sm">Phantom</div>
                <div className="text-xs text-white/40">Popular Solana wallet</div>
              </div>
              <span className="text-xs font-mono text-white/50">→</span>
            </button>

            <button
              onClick={() => onSelect("solflare")}
              className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:bg-white/10 hover:border-white/20 active:scale-[0.98]"
            >
              <div className="text-3xl">🔥</div>
              <div className="flex-1">
                <div className="font-bold text-sm">Solflare</div>
                <div className="text-xs text-white/40">Secure &amp; full-featured</div>
              </div>
              <span className="text-xs font-mono text-white/50">→</span>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-center">
            <a
              href="https://phantom.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              I don't have a wallet →
            </a>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
}
