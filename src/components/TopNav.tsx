import { useState, useEffect, useCallback } from "react";
import { toast, Toaster } from "sonner";
import Avatar from "@/components/Avatar";
import { connectWallet } from "@/lib/wallet";
import { useInterval } from "@/hooks/useInterval";
import { shareLink } from "@/lib/identity";

interface TopNavProps {
  wallet: string | null;
  onWalletChange: (wallet: string | null) => void;
  live: boolean;
  refCode?: string;
  streak?: number;
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function formatSol(lamports: number): string {
  const sol = lamports / 1_000_000_000;
  return sol.toFixed(2);
}

async function fetchBalance(wallet: string): Promise<number | null> {
  try {
    const res = await fetch(`/api/balance?wallet=${encodeURIComponent(wallet)}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.balance === "number" ? data.balance : null;
  } catch {
    return null;
  }
}

function isDevnet(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host.includes("workers") || host.includes("dev") || host.includes("localhost");
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
  const [balance, setBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const devnet = isDevnet();

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

  const handleCopyAddress = useCallback(async () => {
    if (!wallet) return;
    try {
      await navigator.clipboard.writeText(wallet);
      setCopied(true);
      toast.success("Address copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy address");
    }
  }, [wallet]);

  // Fetch balance when wallet changes
  useEffect(() => {
    if (!wallet) return;
    let cancelled = false;
    fetchBalance(wallet).then((b) => {
      if (!cancelled) setBalance(b);
    });
    return () => {
      cancelled = true;
    };
  }, [wallet]);

  // Clear balance when wallet disconnects (derived state - no effect needed)
  // balance naturally resets when wallet becomes null via the effect above

  // Refresh balance while wallet menu is open
  useInterval(() => {
    if (wallet && showWalletMenu) {
      fetchBalance(wallet).then((b) => {
        if (b !== null) setBalance(b);
      });
    }
  }, 10000);

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
            <div className={`hidden sm:block font-mono text-xs ${live ? "text-pump" : "text-white/40"}`}>
              {live ? "● INDEX LIVE" : "○ INDEX OFFLINE"}
            </div>

            {/* Network badge */}
            {devnet && (
              <div className="hidden sm:flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400 tracking-wider uppercase">
                Devnet
              </div>
            )}

            {/* Streak badge */}
            {Boolean(streak && streak > 0) && (
              <div className="hidden sm:flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-400">
                <span>🔥</span>
                <span className="font-mono">{streak}d</span>
              </div>
            )}

            {/* Balance display */}
            {wallet && (
              <div className="hidden md:flex items-center gap-1 rounded-full border border-hermes/30 bg-hermes/10 px-2.5 py-1 text-xs font-mono text-hermes font-semibold">
                {balance !== null ? (
                  <>{formatSol(balance)} SOL</>
                ) : (
                  <span className="text-white/30">…</span>
                )}
              </div>
            )}

            {/* Wallet button */}
            <button
              onClick={async (e) => {
                if (wallet) {
                  handleWalletClick(e);
                } else {
                  e.stopPropagation();
                  await connectWallet(onWalletChange);
                  setShowWalletMenu(true);
                }
              }}
              className="relative rounded-md bg-hermes px-3 py-1.5 text-sm font-black text-white hover:bg-hermes/90 transition-all active:scale-[0.97]"
            >
              {wallet ? (
                <span className="flex items-center gap-1.5 font-mono text-xs">
                  <span>{truncateAddress(wallet)}</span>
                  <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <rect x="9" y="9" width="11" height="11" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </span>
              ) : (
                <>
                  <span className="sm:hidden">Connect</span>
                  <span className="hidden sm:inline">Connect Wallet</span>
                </>
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
          <div
            className="absolute right-4 top-full z-50 w-72 rounded-xl bg-elevated border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden animate-fly-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu header with avatar + address */}
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Avatar value={wallet} size="lg" connected />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white font-mono truncate">
                      {truncateAddress(wallet)}
                    </span>
                    <button
                      onClick={handleCopyAddress}
                      className="shrink-0 text-white/40 hover:text-white transition-colors p-0.5"
                      title="Copy address"
                      aria-label="Copy address"
                    >
                      {copied ? (
                        <svg className="w-3.5 h-3.5 text-pump" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <rect x="9" y="9" width="11" height="11" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="text-xs text-white/40 font-mono">Connected via Phantom</div>
                </div>
              </div>

              {/* SOL balance in header */}
              <div className="mt-3 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <span className="text-xs text-white/40 font-medium">Balance</span>
                <span className="text-sm font-mono font-bold text-white">
                  {balance !== null ? `${formatSol(balance)} SOL` : "…"}
                </span>
              </div>
            </div>

            {/* Menu actions */}
            <div className="py-1">
              {/* View on Solscan */}
              <a
                href={`https://solscan.io/account/${wallet}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                <span>View on Solscan</span>
                <svg className="w-3 h-3 ml-auto text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>

              {/* Divider */}
              <div className="my-1 border-t border-white/5" />

              {/* Disconnect */}
              <button
                onClick={() => {
                  onWalletChange(null);
                  setShowWalletMenu(false);
                  setBalance(null);
                }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400/70 hover:text-red-400 hover:bg-white/5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Disconnect
              </button>
            </div>
          </div>
        )}

        {/* Click-away handler */}
        {showWalletMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowWalletMenu(false)}
          />
        )}
      </nav>

      <Toaster richColors position="top-center" />
    </>
  );
}