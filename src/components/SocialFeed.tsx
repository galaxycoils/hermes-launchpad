import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import Skeleton from "@/components/Skeleton";

// ---- types ----

interface FeedItem {
  id: string;
  trader_wallet: string;
  trader_name?: string;
  side: "buy" | "sell";
  token_ticker: string;
  token_name?: string;
  token_id?: string;
  sol_amount: number;
  ts: number;
}

interface FeedResponse {
  items: FeedItem[];
  total?: number;
}

// ---- helpers ----

const formatAgo = (ts: number): string => {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const shortName = (wallet: string, name?: string): string => {
  if (name) return name.length > 14 ? name.slice(0, 13) + "..." : name;
  return wallet.length > 10 ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : wallet;
};

// ---- component ----

export default function SocialFeed({ wallet }: { wallet: string | null }) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch feed
  const fetchFeed = useCallback(async () => {
    if (!wallet) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/feed/${encodeURIComponent(wallet)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: FeedResponse = await res.json();
      setItems(data.items ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  // Initial fetch + polling
  useEffect(() => {
    fetchFeed();
    refreshRef.current = setInterval(fetchFeed, 15_000);
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [fetchFeed]);

  // Copy-trade handler
  const handleCopyTrade = useCallback((item: FeedItem) => {
    setCopiedId(item.id);
    // Emit a custom event that TradePanel or parent can listen for
    window.dispatchEvent(
      new CustomEvent("hermes:copy-trade", {
        detail: {
          side: item.side,
          token_id: item.token_id,
          token_ticker: item.token_ticker,
          sol_amount: item.sol_amount,
          source_wallet: item.trader_wallet,
        },
      })
    );
    setTimeout(() => setCopiedId(null), 1500);
  }, []);

  // Empty state -- no wallet
  if (!wallet) {
    return (
      <div className="surface rounded-xl border bg-black/80 overflow-hidden">
        <div className="border-b border-white/10 px-4 py-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="text-base">👥</span> Social Feed
          </h3>
        </div>
        <div className="flex h-48 items-center justify-center px-6 text-center">
          <p className="text-sm text-white/40">
            Connect your wallet to see activity from traders you follow.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="surface rounded-xl border bg-black/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="text-base">👥</span> Social Feed
          </h3>
          <span className="inline-block h-2 w-2 rounded-full bg-pump animate-pulse" />
          <span className="text-xs text-white/40 font-mono">live</span>
        </div>

        <button
          onClick={fetchFeed}
          className="rounded px-2 py-0.5 text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          aria-label="Refresh feed"
          title="Refresh"
        >
          ↻
        </button>
      </div>

      {/* Feed body */}
      <div className="h-80 overflow-y-auto scrollbar-thin" style={{ scrollBehavior: "smooth" }}>
        {/* Loading */}
        {loading && items.length === 0 && (
          <ul className="divide-y divide-white/5">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2.5 w-32" />
                </div>
                <Skeleton className="h-6 w-16 rounded-md" />
              </li>
            ))}
          </ul>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div>
              <p className="text-sm text-dump font-bold">Failed to load feed</p>
              <p className="text-xs text-white/30 mt-1">Check back later</p>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && items.length === 0 && (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div>
              <p className="text-sm text-white/50 font-bold">No activity yet</p>
              <p className="text-xs text-white/30 mt-1">
                Follow traders to see their moves here.
              </p>
            </div>
          </div>
        )}

        {/* Feed items */}
        {!loading && !error && items.length > 0 && (
          <ul className="divide-y divide-white/5">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors"
              >
                {/* Trader avatar */}
                <Avatar value={item.trader_wallet} size="sm" />

                {/* Trader identity + action */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white/80 truncate">
                      {shortName(item.trader_wallet, item.trader_name)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        item.side === "buy"
                          ? "bg-pump/15 text-pump"
                          : "bg-dump/15 text-dump"
                      }`}
                    >
                      {item.side === "buy" ? "BUY" : "SELL"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-white/50 font-mono">
                      ${item.token_ticker}
                    </span>
                    <span className="text-[11px] text-white/40 font-mono">
                      {item.sol_amount.toFixed(2)} SOL
                    </span>
                    <span className="text-[10px] text-white/25 font-mono ml-auto">
                      {formatAgo(item.ts)}
                    </span>
                  </div>
                </div>

                {/* Copy-trade button */}
                <button
                  onClick={() => handleCopyTrade(item)}
                  className={`flex-shrink-0 rounded-md px-2.5 py-1 text-[10px] font-bold transition-all active:scale-95 ${
                    copiedId === item.id
                      ? "bg-pump/20 text-pump border border-pump/40"
                      : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"
                  }`}
                  aria-label={`Copy ${item.side} ${item.token_ticker}`}
                  title={`Mirror this ${item.side}`}
                >
                  {copiedId === item.id ? "✓ Copied" : item.side === "buy" ? "Copy Buy" : "Copy Sell"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 px-4 py-1.5 flex items-center justify-between">
        <span className="text-[10px] text-white/30 font-mono">
          {items.length} {items.length === 1 ? "activity" : "activities"}
        </span>
        <span className="text-[10px] text-white/30 font-mono">
          auto-refresh 15s
        </span>
      </div>
    </div>
  );
}
