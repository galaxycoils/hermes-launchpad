import { useEffect, useMemo, useState } from 'react';
import { fetchTrades } from '@/lib/api';
import type { Trade } from '@/lib/tokens';

const short = (w: string) => (w.length > 10 ? `${w.slice(0, 4)}…${w.slice(-3)}` : w);

export default function Ticker({ tokenNames, onSelect }: { tokenNames: Record<string, string>; onSelect?: (tokenId: string) => void }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let dead = false;
    const load = () => fetchTrades(undefined, 20).then((t) => { if (!dead) setTrades(t); }).catch(() => {});
    load();
    const iv = setInterval(load, 15000);
    return () => { dead = true; clearInterval(iv); };
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(iv);
  }, []);

  const items = useMemo(() => trades.map((t) => {
    const name = tokenNames[t.token_id] || t.token_id;
    const ago = Math.max(1, Math.floor((tick / 1000 - t.ts) / 60));
    return { ...t, name, ago };
  }), [trades, tokenNames, tick]);

  const strip = [...items, ...items]; // duplicate for seamless loop
  const animationDuration = Math.max(30, strip.length * 4);

  if (trades.length === 0) return null;

  return (
    <div className="relative overflow-hidden border-t border-white/10 bg-black/40 py-1.5">
      <style>{`@keyframes hermes-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
      <div
        className="flex gap-6 whitespace-nowrap text-xs w-max"
        style={{ animation: `hermes-ticker ${animationDuration}s linear infinite` }}
      >
        {strip.map((t, i) => (
          <button
            key={`${t.id}-${i}`}
            onClick={() => onSelect?.(t.token_id)}
            className={`${t.side === 'buy' ? 'text-green-300' : 'text-red-300'} hover:underline`}
          >
            {short(t.wallet)} {t.side === 'buy' ? 'bought' : 'sold'} {t.sol_amount.toFixed(2)} SOL of <b>{t.name}</b> · {t.ago}m ago
          </button>
        ))}
      </div>
    </div>
  );
}