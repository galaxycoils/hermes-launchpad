/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";

type FilterMode = "all" | "buys" | "sells" | "whales";

interface TradeMessage {
  type: "trade";
  data: {
    wallet: string;
    side: "buy" | "sell";
    sol_amount: number;
    token_ticker?: string;
    token_name?: string;
    token_id?: string;
  };
  ts: number;
}

const shortWallet = (w: string) =>
  w.length > 10 ? `${w.slice(0, 4)}…${w.slice(-4)}` : w;

const formatAgo = (ts: number): string => {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
};

function isTradeMessage(msg: { type: string; data: unknown }): msg is TradeMessage {
  return msg.type === "trade";
}

export default function LiveTradeFeed({ tokenId }: { tokenId?: string }) {
  const { connected, messages, subscribe, unsubscribe } = useWebSocket();
  const [filter, setFilter] = useState<FilterMode>("all");
  const [soundOn, setSoundOn] = useState(false);
  const [flashing, setFlashing] = useState<string | null>(null);

  const feedRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Subscribe to trade channel on mount
  useEffect(() => {
    subscribe("trades");
    if (tokenId) subscribe(`trades:${tokenId}`);
    return () => {
      unsubscribe("trades");
      if (tokenId) unsubscribe(`trades:${tokenId}`);
    };
  }, [tokenId, subscribe, unsubscribe]);

  // Play beep sound
  const playBeep = useCallback((frequency: number) => {
    if (!soundOn) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio not available
    }
  }, [soundOn]);

  // Filter trades
  const trades = useMemo(() => {
    return messages
      .filter(isTradeMessage)
      .filter((msg) => {
        if (tokenId && msg.data.token_id !== tokenId) return false;
        switch (filter) {
          case "buys": return msg.data.side === "buy";
          case "sells": return msg.data.side === "sell";
          case "whales": return msg.data.sol_amount >= 1;
          default: return true;
        }
      })
      .map((msg) => ({
        id: `${msg.ts}-${msg.data.wallet}`,
        wallet: msg.data.wallet,
        side: msg.data.side,
        amount: msg.data.sol_amount,
        ticker: msg.data.token_ticker ?? msg.data.token_name ?? "???",
        ts: msg.ts,
      }));
  }, [messages, filter, tokenId]);

  // Flash animation + sound on new trade
  useEffect(() => {
    if (trades.length === 0) return;
    const latest = trades[trades.length - 1];
    setFlashing(latest.id);
    playBeep(latest.side === "buy" ? 880 : 440);
    const timer = setTimeout(() => setFlashing(null), 300);
    return () => clearTimeout(timer);
  }, [trades.length, trades, playBeep]);

  // Auto-scroll to bottom, pause on hover
  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;

    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (isAtBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [trades]);

  return (
    <div className="surface rounded-xl border bg-black/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white">Live Trades</h3>
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              connected ? "bg-pump animate-pulse" : "bg-red-500"
            }`}
          />
          <span className="text-xs text-white/40 font-mono">
            {connected ? "live" : "offline"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <button
            onClick={() => setSoundOn((s) => !s)}
            className={`rounded px-2 py-0.5 text-xs transition-colors ${
              soundOn
                ? "bg-pump/20 text-pump"
                : "bg-white/5 text-white/40 hover:text-white/60"
            }`}
            aria-label={soundOn ? "Disable sound" : "Enable sound"}
            title={soundOn ? "Sound on" : "Sound off"}
          >
            {soundOn ? "🔊" : "🔇"}
          </button>

          {/* Filter dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterMode)}
            className="rounded bg-white/5 px-2 py-0.5 text-xs text-white/70 border border-white/10 outline-none cursor-pointer"
            aria-label="Filter trades"
          >
            <option value="all">All</option>
            <option value="buys">Buys</option>
            <option value="sells">Sells</option>
            <option value="whales">Whales (&gt;1 SOL)</option>
          </select>
        </div>
      </div>

      {/* Feed */}
      <div
        ref={feedRef}
        className="h-80 overflow-y-auto scrollbar-thin"
        style={{ scrollBehavior: "smooth" }}
      >
        {trades.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-white/30">
            {connected ? "Waiting for trades…" : "Connecting…"}
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {trades.map((trade) => (
              <li
                key={trade.id}
                className={`flex items-center gap-3 px-4 py-2 font-mono text-xs transition-colors duration-300 ${
                  flashing === trade.id
                    ? trade.side === "buy"
                      ? "bg-pump/10"
                      : "bg-dump/10"
                    : "hover:bg-white/[0.03]"
                }`}
              >
                {/* Side indicator */}
                <span
                  className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${
                    trade.side === "buy" ? "bg-pump" : "bg-dump"
                  }`}
                />

                {/* Wallet */}
                <span className="text-white/50 w-20 truncate">
                  {shortWallet(trade.wallet)}
                </span>

                {/* Side label */}
                <span
                  className={`font-bold w-10 ${
                    trade.side === "buy" ? "text-pump" : "text-dump"
                  }`}
                >
                  {trade.side === "buy" ? "BUY" : "SELL"}
                </span>

                {/* Amount */}
                <span className="text-white/80 w-20 text-right">
                  {trade.amount.toFixed(2)} SOL
                </span>

                {/* Ticker */}
                <span className="text-white/60 flex-1 truncate">
                  ${trade.ticker}
                </span>

                {/* Time ago */}
                <span className="text-white/30 w-16 text-right">
                  {formatAgo(trade.ts)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 px-4 py-1.5 flex items-center justify-between">
        <span className="text-[10px] text-white/30 font-mono">
          {trades.length} trades
        </span>
        <span className="text-[10px] text-white/30 font-mono">
          {tokenId ? `filtered: ${tokenId.slice(0, 8)}…` : "all tokens"}
        </span>
      </div>
    </div>
  );
}
