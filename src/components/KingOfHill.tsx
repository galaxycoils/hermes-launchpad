import { fmtUsd } from '@/lib/tokens';
import type { Token } from '@/lib/tokens';

export default function KingOfHill({ token, onSelect }: { token: Token; onSelect: (t: Token) => void }) {
  const remaining = Math.max(0, 85 - (token.realSol ?? 0));
  return (
    <button
      onClick={() => onSelect(token)}
      className="w-full text-left rounded-2xl border border-yellow-400/30 bg-gradient-to-r from-yellow-500/10 via-purple-500/10 to-green-500/10 p-4 hover:border-yellow-400/60 transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="text-5xl">{token.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold text-yellow-300 tracking-widest">👑 KING OF THE HILL</div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-lg font-black text-white">{token.name}</span>
            <span className="text-sm text-white/50">${token.ticker}</span>
            <span className={`text-sm font-bold ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {token.change24h >= 0 ? '+' : ''}{token.change24h}%
            </span>
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-green-400 to-emerald-300 transition-all"
              style={{ width: `${token.curveProgress}%` }}
            />
          </div>
          <div className="mt-1 text-[11px] text-white/50">
            {token.curveProgress}% to graduation · ≈{remaining.toFixed(1)} SOL left · mcap {fmtUsd(token.marketCap)} ·
            graduates to Raydium at $69.4K 🎓
          </div>
        </div>
        <div className="hidden sm:block text-2xl">🚀</div>
      </div>
    </button>
  );
}
