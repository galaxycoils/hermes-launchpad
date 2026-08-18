import { useCallback, useEffect, useState } from "react";
import { Surface } from "@/components/Surface";
import Stat from "@/components/Stat";
import Skeleton from "@/components/Skeleton";
import { Button } from "@/components/Button";
import { fmtUsd } from "@/lib/tokens";

// ---- Types ----

export interface TokenAnalytics {
  tokenId: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  volumeChange24h: number;
  holders: number;
  holderChange24h: number;
  marketCap: number;
  marketCapChange24h: number;
}

interface Trade {
  id: string;
  wallet: string;
  side: "buy" | "sell";
  solAmount: number;
  tokenAmount: number;
  price: number;
  ts: number;
}

interface HolderBucket {
  label: string;
  count: number;
  pct: number;
}

interface ChatMessage {
  id: string;
  wallet: string;
  message: string;
  ts: number;
  flagged: boolean;
}

export interface CreatorDashboardProps {
  tokenId: string;
  wallet: string;
}

// ---- Helpers ----

const shortWallet = (w: string) =>
  w.length > 10 ? `${w.slice(0, 4)}…${w.slice(-4)}` : w;

const formatAgo = (ts: number): string => {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ---- Sub-components ----

function StatGrid({ analytics }: { analytics: TokenAnalytics }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Stat
        value={analytics.price < 0.01 ? analytics.price.toFixed(6) : analytics.price.toFixed(4)}
        label="Price (SOL)"
        trend={{ value: analytics.priceChange24h, positive: analytics.priceChange24h >= 0 }}
      />
      <Stat
        value={fmtUsd(analytics.volume24h)}
        label="Volume (24h)"
        trend={{ value: analytics.volumeChange24h, positive: analytics.volumeChange24h >= 0 }}
      />
      <Stat
        value={analytics.holders.toLocaleString()}
        label="Holders"
        trend={{ value: analytics.holderChange24h, positive: analytics.holderChange24h >= 0 }}
      />
      <Stat
        value={fmtUsd(analytics.marketCap)}
        label="Market Cap"
        trend={{ value: analytics.marketCapChange24h, positive: analytics.marketCapChange24h >= 0 }}
      />
    </div>
  );
}

function TradeFeed({ trades, loading }: { trades: Trade[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-white/30">
        No trades yet
      </div>
    );
  }

  return (
    <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin">
      {trades.map((trade) => (
        <div
          key={trade.id}
          className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2 font-mono text-xs transition-colors hover:bg-white/[0.06]"
        >
          <span
            className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${
              trade.side === "buy" ? "bg-pump" : "bg-dump"
            }`}
          />
          <span className="text-white/50 w-20 truncate">{shortWallet(trade.wallet)}</span>
          <span
            className={`font-bold w-10 ${trade.side === "buy" ? "text-pump" : "text-dump"}`}
          >
            {trade.side === "buy" ? "BUY" : "SELL"}
          </span>
          <span className="text-white/80 w-20 text-right">{trade.solAmount.toFixed(2)} SOL</span>
          <span className="text-white/40 flex-1 text-right">{formatAgo(trade.ts)}</span>
        </div>
      ))}
    </div>
  );
}

function HolderDistribution({ buckets }: { buckets: HolderBucket[] }) {
  return (
    <div className="space-y-3">
      {buckets.map((bucket) => (
        <div key={bucket.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">{bucket.label}</span>
            <span className="font-mono text-white/40">
              {bucket.count} holders · {bucket.pct.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 via-hermes to-pump transition-all duration-700 ease-out"
              style={{ width: `${Math.max(2, bucket.pct)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatModeration({
  messages,
  onDelete,
  onMute,
}: {
  messages: ChatMessage[];
  onDelete: (id: string) => void;
  onMute: (wallet: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (messages.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-white/30">
        No messages to moderate
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`rounded-lg border px-3 py-2 transition-colors ${
            msg.flagged
              ? "border-dump/30 bg-dump/5"
              : "border-white/10 bg-white/[0.03]"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-white/60">
                  {shortWallet(msg.wallet)}
                </span>
                <span className="text-[10px] text-white/30">{formatAgo(msg.ts)}</span>
                {msg.flagged && (
                  <span className="rounded-full bg-dump/20 px-1.5 py-0.5 text-[10px] font-bold text-dump">
                    FLAGGED
                  </span>
                )}
              </div>
              <p className={`text-xs break-words ${expanded === msg.id ? "" : "line-clamp-2"}`}>
                {msg.message}
              </p>
            </div>
            <button
              onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
              className="text-[10px] text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
            >
              {expanded === msg.id ? "less" : "more"}
            </button>
          </div>
          {expanded === msg.id && (
            <div className="mt-2 flex items-center gap-2 border-t border-white/5 pt-2">
              <button
                onClick={() => onDelete(msg.id)}
                className="rounded bg-dump/10 px-2 py-1 text-[10px] font-bold text-dump hover:bg-dump/20 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => onMute(msg.wallet)}
                className="rounded bg-white/5 px-2 py-1 text-[10px] font-bold text-white/50 hover:bg-white/10 transition-colors"
              >
                Mute user
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---- Main Component ----

export default function CreatorDashboard({ tokenId, wallet }: CreatorDashboardProps) {
  const [analytics, setAnalytics] = useState<TokenAnalytics | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [holderBuckets, setHolderBuckets] = useState<HolderBucket[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promoting, setPromoting] = useState(false);

  // Fetch analytics data
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/tokens/${encodeURIComponent(tokenId)}/analytics`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        setAnalytics({
          tokenId,
          price: data.price ?? 0,
          priceChange24h: data.priceChange24h ?? 0,
          volume24h: data.volume24h ?? 0,
          volumeChange24h: data.volumeChange24h ?? 0,
          holders: data.holders ?? 0,
          holderChange24h: data.holderChange24h ?? 0,
          marketCap: data.marketCap ?? 0,
          marketCapChange24h: data.marketCapChange24h ?? 0,
        });
        setTrades(data.trades ?? []);
        setHolderBuckets(data.holderDistribution ?? []);
        setChatMessages(data.chatMessages ?? []);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load analytics");
        // Fallback mock data for development
        setAnalytics({
          tokenId,
          price: 0.0042,
          priceChange24h: 12.5,
          volume24h: 48200,
          volumeChange24h: 8.3,
          holders: 342,
          holderChange24h: 5.1,
          marketCap: 420000,
          marketCapChange24h: 15.2,
        });
        setTrades([]);
        setHolderBuckets([]);
        setChatMessages([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tokenId]);

  // Moderation handlers
  const handleDeleteMessage = useCallback((id: string) => {
    setChatMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const handleMuteUser = useCallback((targetWallet: string) => {
    setChatMessages((prev) =>
      prev.map((m) =>
        m.wallet === targetWallet ? { ...m, flagged: true } : m
      )
    );
  }, []);

  // Promote handler
  const handlePromote = useCallback(async () => {
    setPromoting(true);
    try {
      const res = await fetch("/api/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId, wallet }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Success — could show toast here
    } catch {
      // Silently fail — promote is best-effort
    } finally {
      setPromoting(false);
    }
  }, [tokenId, wallet]);

  if (error && !analytics) {
    return (
      <Surface className="p-6">
        <div className="text-center">
          <p className="text-sm text-dump font-semibold">Failed to load dashboard</p>
          <p className="mt-1 text-xs text-white/40">{error}</p>
        </div>
      </Surface>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">Creator Dashboard</h2>
          <p className="text-xs text-white/40 font-mono">
            {tokenId.slice(0, 8)}…{tokenId.slice(-4)} · {shortWallet(wallet)}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          loading={promoting}
          onClick={handlePromote}
        >
          🚀 Promote
        </Button>
      </div>

      {/* Token Performance */}
      <Surface className="p-5">
        <h3 className="mb-4 text-sm font-bold text-white/70">Token Performance</h3>
        {loading || !analytics ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <StatGrid analytics={analytics} />
        )}
      </Surface>

      {/* Trade Feed + Holder Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trade Feed */}
        <Surface className="p-5">
          <h3 className="mb-4 text-sm font-bold text-white/70">Trade Feed</h3>
          <TradeFeed trades={trades} loading={loading} />
        </Surface>

        {/* Holder Distribution */}
        <Surface className="p-5">
          <h3 className="mb-4 text-sm font-bold text-white/70">Holder Distribution</h3>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : (
            <HolderDistribution buckets={holderBuckets} />
          )}
        </Surface>
      </div>

      {/* Chat Moderation */}
      <Surface className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white/70">Chat Moderation</h3>
          <span className="text-[10px] text-white/30 font-mono">
            {chatMessages.length} messages
          </span>
        </div>
        <ChatModeration
          messages={chatMessages}
          onDelete={handleDeleteMessage}
          onMute={handleMuteUser}
        />
      </Surface>
    </div>
  );
}



function generateMockHolderDistribution(): HolderBucket[] {
  return [
    { label: "Whales (>1%)", count: 3, pct: 42 },
    { label: "Large (0.1–1%)", count: 12, pct: 28 },
    { label: "Medium (0.01–0.1%)", count: 45, pct: 18 },
    { label: "Small (<0.01%)", count: 282, pct: 12 },
  ];
}

function generateMockChatMessages(): ChatMessage[] {
  const now = Date.now();
  return [
    { id: "msg-1", wallet: "0xabcd…1234", message: "This token is going to the moon! 🚀", ts: now - 120000, flagged: false },
    { id: "msg-2", wallet: "0xefgh…5678", message: "Just bought another 2 SOL worth, love the community!", ts: now - 90000, flagged: false },
    { id: "msg-3", wallet: "0xijkl…90ab", message: "Check out this scam token at suspicious[.]xyz", ts: now - 60000, flagged: true },
    { id: "msg-4", wallet: "0xmnop…cdef", message: "When is the next burn event?", ts: now - 30000, flagged: false },
  ];
}
