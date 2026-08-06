import { useEffect, useMemo, useState } from 'react';
import { fetchTrades } from '@/lib/api';
import type { Trade } from '@/lib/tokens';

const shortWallet = (wallet: string) => wallet.length > 10 ? `${wallet.slice(0, 4)}…${wallet.slice(-4)}` : wallet;

export default function Ticker({ tokenNames, onSelect }: { tokenNames: Record<string, string>; onSelect?: (tokenId: string) => void }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [now, setNow] = useState(0);
  useEffect(() => { let dead = false; const load = () => fetchTrades(undefined, 20).then((items) => { if (!dead) setTrades(items); }).catch(() => {}); load(); const interval = setInterval(load, 15_000); return () => { dead = true; clearInterval(interval); }; }, []);
  useEffect(() => { const interval = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(interval); }, []);
  const items = useMemo(() => trades.map((trade) => { const minutes = Math.max(1, Math.floor((now / 1000 - trade.ts) / 60)); return { ...trade, name: tokenNames[trade.token_id] || trade.token_id, ago: minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h` }; }), [trades, tokenNames, now]);
  if (!items.length) return null;
  const stream = [...items, ...items];
  return <div className="group overflow-hidden border-t border-[#2a2a2a] bg-[#090909] py-2" aria-label="Live trades"><style>{`@keyframes hermes-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style><div className="flex w-max gap-8 whitespace-nowrap font-mono text-xs motion-safe:animate-[hermes-ticker_55s_linear_infinite] group-hover:[animation-play-state:paused]">{stream.map((trade, index) => <button key={`${trade.id}-${index}`} onClick={() => onSelect?.(trade.token_id)} className={trade.side === 'buy' ? 'text-pump hover:underline' : 'text-dump hover:underline'}><span className="text-white/55">{shortWallet(trade.wallet)}</span> {trade.side === 'buy' ? 'BOUGHT' : 'SOLD'} {trade.sol_amount.toFixed(2)} SOL <span className="font-bold">{trade.name}</span> <span className="text-white/40">· {trade.ago}</span></button>)}</div></div>;
}
