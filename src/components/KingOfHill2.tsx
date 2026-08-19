import { useState, useEffect, useCallback } from "react";
import type { Token } from "@/lib/tokens";
import { migrationProgress, remainingToMigration } from "@/lib/token-truth";
import Progress from "@/components/Progress";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface KingData {
  priceUsd: number;
  change24h: number;           // percentage, can be negative
  kingSince: number;           // unix seconds when token became king
  tradeCount24h: number;
  holderCount: number;
  sparkline: number[];         // last ~24 price points (USD)
}

interface Props {
  token: Token | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatKingDuration(kingSince: number): string {
  const seconds = Math.max(0, Math.floor(Date.now() / 1000) - kingSince);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatPrice(n: number): string {
  if (n >= 1) return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toExponential(2)}`;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/* ------------------------------------------------------------------ */
/*  Sparkline SVG                                                      */
/* ------------------------------------------------------------------ */

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return null;

  const w = 280;
  const h = 64;
  const pad = 4;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  const linePoints = points.join(" ");
  const areaPoints = `${pad},${h - pad} ${points.join(" ")} ${w - pad},${h - pad}`;

  const strokeColor = positive ? "#00ff66" : "#ff3b30";
  const fillId = positive ? "spark-grad-up" : "spark-grad-down";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${fillId})`} />
      <polyline
        points={linePoints}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="sparkline-path"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Crown icon                                                         */
/* ------------------------------------------------------------------ */

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M2.5 6.5L6 10l4-6 4 6 3.5-3.5L21 13v7H3v-7L2.5 6.5z" />
      <rect x="3" y="15" width="18" height="3" rx="1" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function KingOfHill2({ token }: Props) {
  const [kingData, setKingData] = useState<KingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchKingData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/king-of-the-hill", {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setKingData({
        priceUsd: data.priceUsd ?? 0,
        change24h: data.change24h ?? 0,
        kingSince: data.kingSince ?? Math.floor(Date.now() / 1000),
        tradeCount24h: data.tradeCount24h ?? 0,
        holderCount: data.holderCount ?? 0,
        sparkline: Array.isArray(data.sparkline) ? data.sparkline : [],
      });
    } catch {
      setError(true);
      // Fallback: derive from token fields
      setKingData({
        priceUsd: token.priceSol ? token.priceSol * 150 : 0,
        change24h: 0,
        kingSince: Math.floor(Date.now() / 1000),
        tradeCount24h: 0,
        holderCount: 0,
        sparkline: [],
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchKingData();
  }, [fetchKingData]);

  // Live timer refresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const progress = token ? migrationProgress(token) : 0;
  const remaining = token ? remainingToMigration(token) : 0;
  const isPositive = (kingData?.change24h ?? 0) >= 0;
  const kingDuration = kingData ? formatKingDuration(kingData.kingSince) : "—";

  /* ---------- Loading / empty states ---------- */

  if (!token) {
    return (
      <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-black via-[#0a0a1a] to-[#0f0520] p-6">
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <CrownIcon className="h-10 w-10 text-white/20" />
          <p className="text-sm text-white/40">No king yet — waiting for the next contender…</p>
        </div>
      </div>
    );
  }

  /* ---------- Main render ---------- */

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-black via-[#0a0a1a] to-[#0f0520] shadow-[0_0_60px_rgba(168,85,247,0.12)]">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-hermes/15 blur-[80px] animate-pulse-glow" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-pump/10 blur-[60px] animate-pulse-glow" style={{ animationDelay: "1s" }} />
      <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-72 -translate-x-1/2 rounded-full bg-gold/10 blur-[50px]" />

      <div className="relative p-5 sm:p-6 lg:p-8">
        {/* ---- Header row ---- */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CrownIcon className="h-5 w-5 text-gold animate-float-bob" />
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-gold">
              King of the Hill
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-2.5 py-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
            <span className="font-mono text-[10px] font-bold text-gold">{kingDuration}</span>
          </div>
        </div>

        {/* ---- Token identity + price ---- */}
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: avatar + name */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 text-3xl shadow-lg sm:h-20 sm:w-20 sm:text-4xl">
                {token.emoji}
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-[10px] shadow-md">
                <CrownIcon className="h-3 w-3 text-black" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{token.name}</h2>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="font-mono text-sm text-white/50">${token.ticker}</span>
                <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/40">
                  {token.chain}
                </span>
              </div>
            </div>
          </div>

          {/* Right: price + change */}
          <div className="text-left sm:text-right">
            <div className="font-mono text-3xl font-black tabular-nums text-white sm:text-4xl">
              {loading ? "—" : formatPrice(kingData?.priceUsd ?? 0)}
            </div>
            <div
              className={`mt-1 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-lg font-bold tabular-nums sm:text-xl ${
                isPositive
                  ? "bg-pump/10 text-pump"
                  : "bg-dump/10 text-dump"
              } ${loading ? "" : "animate-fly-in"}`}
            >
              <span className="text-sm">{isPositive ? "▲" : "▼"}</span>
              {loading ? "—" : `${isPositive ? "+" : ""}${kingData?.change24h.toFixed(2)}%`}
            </div>
          </div>
        </div>

        {/* ---- Stats row ---- */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
            <p className="font-mono text-[10px] uppercase tracking-wider text-white/30">Trades</p>
            <p className="mt-1 font-mono text-lg font-bold text-white tabular-nums">
              {loading ? "—" : formatCompact(kingData?.tradeCount24h ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
            <p className="font-mono text-[10px] uppercase tracking-wider text-white/30">Holders</p>
            <p className="mt-1 font-mono text-lg font-bold text-white tabular-nums">
              {loading ? "—" : formatCompact(kingData?.holderCount ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
            <p className="font-mono text-[10px] uppercase tracking-wider text-white/30">King For</p>
            <p className="mt-1 font-mono text-lg font-bold text-gold tabular-nums">
              {kingDuration}
            </p>
          </div>
        </div>

        {/* ---- Sparkline ---- */}
        <div className="mt-5 rounded-xl border border-white/5 bg-black/30 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/30">24h price</span>
            {kingData && kingData.sparkline.length > 0 && (
              <span className={`font-mono text-[10px] font-bold ${isPositive ? "text-pump" : "text-dump"}`}>
                {isPositive ? "+" : ""}{kingData.change24h.toFixed(1)}%
              </span>
            )}
          </div>
          {kingData && kingData.sparkline.length >= 2 ? (
            <Sparkline data={kingData.sparkline} positive={isPositive} />
          ) : (
            <div className="flex h-16 items-center justify-center">
              <span className="font-mono text-xs text-white/20">
                {loading ? "Loading chart…" : "No chart data"}
              </span>
            </div>
          )}
        </div>

        {/* ---- Bonding curve progress ---- */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
              Bonding curve
            </span>
            <span className="font-mono text-xs font-bold text-white/60">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} size="lg" />
          <div className="flex items-center justify-between font-mono text-[10px] text-white/30">
            <span>{token.realSol?.toFixed(1) ?? "0.0"} SOL raised</span>
            <span>{remaining.toFixed(1)} SOL to threshold</span>
          </div>
        </div>

        {/* ---- CTA buttons ---- */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="group relative overflow-hidden rounded-xl bg-pump px-6 py-4 font-black text-lg text-black transition-all duration-200 hover:bg-pump/90 hover:shadow-[0_0_40px_rgba(0,255,102,0.4)] active:scale-[0.97]"
          >
            <span className="relative z-10">BUY</span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          </button>
          <button
            type="button"
            className="group relative overflow-hidden rounded-xl border-2 border-dump/60 bg-dump/10 px-6 py-4 font-black text-lg text-dump transition-all duration-200 hover:border-dump hover:bg-dump/20 hover:shadow-[0_0_40px_rgba(255,59,48,0.3)] active:scale-[0.97]"
          >
            <span className="relative z-10">SELL</span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-dump/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          </button>
        </div>

        {/* ---- Error indicator ---- */}
        {error && (
          <p className="mt-3 text-center font-mono text-[10px] text-dump/60">
            Live data unavailable — showing fallback
          </p>
        )}
      </div>
    </div>
  );
}
