"use client";
import { useEffect, useMemo, useState } from "react";
import { fetchTrades } from "@/lib/api";
import type { Trade } from "@/lib/tokens";

const shortWallet = (w: string) => (w.length > 10 ? `${w.slice(0, 4)}…${w.slice(-4)}` : w);

export default function Ticker({ tokenNames, onSelect }: { tokenNames: Record<string, string>; onSelect?: (tokenId: string) => void }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [now, setNow] = useState(0);

  useEffect(() => {
    let dead = false;
    const load = () => fetchTrades(undefined, 20).then((items) => { if (!dead) setTrades(items); }).catch(() => {});
    load();
    const interval = setInterval(load, 15_000);
    return () => { dead = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const items = useMemo(() => {
    return trades.map((trade) => {
      const minutes = Math.max(1, Math.floor((now / 1000 - trade.ts) / 60));
      return {
        ...trade,
        name: tokenNames[trade.token_id] || trade.token_id,
        ago: minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h`,
      };
    });
  }, [trades, tokenNames, now]);

  if (!items.length) return null;

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Live trades ticker"
      className="group relative overflow-hidden border-t border-white/10 bg-black/60 py-2"
    >
      <style>{`
        @keyframes hermes-ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
      <div className="flex w-max gap-6 whitespace-nowrap font-mono text-xs motion-safe:animate-[hermes-ticker_55s_linear_infinite] group-hover:[animation-play-state:paused]">
        {[...items, ...items].map((trade, index) => (
          <button
            key={`${trade.id}-${index}`}
            onClick={() => onSelect?.(trade.token_id)}
            className={`inline-flex items-center gap-1.5 transition-colors hover:underline ${
              trade.side === "buy" ? "text-pump hover:text-green-300" : "text-dump hover:text-red-300"
            }`}
          >
            <span className="text-white/40">{shortWallet(trade.wallet)}</span>
            <span className="font-bold">{trade.side === "buy" ? "BOUGHT" : "SOLD"}</span>
            <span className="text-white/70">{trade.sol_amount.toFixed(2)} SOL</span>
            <span className="text-white/80">{trade.name}</span>
            <span className="text-white/30">·</span>
            <span className="text-white/30">{trade.ago}</span>
          </button>
        ))}
      </div>

      {/* Gradient edge */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/80 to-transparent pointer-events-none" />
    </div>
  );
}
