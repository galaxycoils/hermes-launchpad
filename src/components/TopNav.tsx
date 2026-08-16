import { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "sonner";
import Avatar from "@/components/Avatar";
import { useInterval } from "@/hooks/useInterval";
import { shareLink } from "@/lib/identity";

interface TopNavProps {
  wallet: string | null;
  onWalletChange: (wallet: string | null) => void;
  live: boolean;
  refCode?: string;
  streak?: number;
}

export default function TopNav({ wallet, onWalletChange, live, refCode, streak }: TopNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try {
      return Boolean(localStorage.getItem("referral_banner_dismissed"));
    } catch {
      return false;
    }
  });

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    try {
      localStorage.setItem("referral_banner_dismissed", "1");
    } catch {
      // ignore
    }
  };

  const handleCopyRef = async () => {
    const link = shareLink(refCode ?? "");
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Referral link copied!");
    } catch {
      toast.error("Could not copy link");
    }
  };

  useInterval(() => setScrolled(window.scrollY > 10), 100);

  const handleWalletClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowWalletMenu(!showWalletMenu);
  };

  return (
    <>
      {!bannerDismissed && (
        <div className="relative z-50 flex items-center justify-between border-b border-hermes/30 bg-gradient-to-r from-hermes/20 via-pump/10 to-hermes/20 px-3 py-1.5 text-xs text-white">
          <div className="mx-auto flex items-center gap-2">
            <span>🎁 <strong>Invite friends</strong> → earn XP on every trade</span>
            <button
              onClick={handleCopyRef}
              className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] font-bold text-pump hover:bg-white/20 transition-colors"
            >
              Copy Link
            </button>
          </div>
          <button
            onClick={handleDismissBanner}
            aria-label="Dismiss banner"
            className="text-white/40 hover:text-white text-sm px-1.5"
          >
            ×
          </button>
        </div>
      )}
      <nav
        className={`sticky top-0 z-40 border-b transition-all duration-300 ${
          scrolled
            ? "bg-black/80 backdrop-blur-xl border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
            : "bg-transparent border-transparent"
        }`}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3 sm:px-4">
          {/* Logo */}
          <div className="flex items-center gap-2" translate="no">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full bg-hermes/20 blur-[12px] animate-float"
                style={{ animationDelay: "0ms" }}
              />
              <span className="relative z-10 text-2xl">🛸</span>
            </div>
            <span className="font-black tracking-tight text-lg sm:text-xl">
              <span className="text-white">HERMES</span>
              <span className="text-pump">.</span>
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live status */}
            <div className={`hidden font-mono text-xs ${live ? "text-pump" : "text-white/40"}`}>
              {live ? "● INDEX LIVE" : "○ INDEX OFFLINE"}
            </div>

            {/* Streak badge */}
            {Boolean(streak && streak > 0) && (
              <div className="flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-400">
                <span>🔥</span>
                <span className="font-mono">{streak}d</span>
              </div>
            )}

            {/* Wallet button */}
            <button
              onClick={handleWalletClick}
              className="relative rounded-md bg-hermes px-3 py-1.5 text-sm font-black text-white hover:bg-hermes/90 transition-all active:scale-[0.97]"
            >
              {wallet ? (
                <span className="flex items-center gap-1.5 font-mono text-xs">
                  {wallet.slice(0, 4)}…{wallet.slice(-4)} ×
                </span>
              ) : (
                "Connect Wallet"
              )}
            </button>

            {/* Mobile wallet indicator */}
            <button className="flex sm:hidden items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10">
              <Avatar value={wallet} size="md" connected={!!wallet} />
            </button>
          </div>
        </div>

        {/* Wallet dropdown */}
        {showWalletMenu && wallet && (
          <div className="absolute right-4 top-full z-50 w-64 rounded-xl bg-elevated border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden animate-fly-in">
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Avatar value={wallet} size="lg" connected />
                <div>
                  <div className="text-sm font-semibold text-white">{wallet.slice(0, 4)}…{wallet.slice(-4)}</div>
                  <div className="text-xs text-white/40 font-mono">Connected via Phantom</div>
                </div>
              </div>
            </div>
            <div className="py-1">
              <button
                onClick={() => { onWalletChange(null); setShowWalletMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </nav>

      <Toaster richColors position="top-center" />
    </>
  );
}
