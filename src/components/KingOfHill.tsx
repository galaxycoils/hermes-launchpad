import type { Token } from '@/lib/tokens';

export default function KingOfHill({ token, onSelect }: { token: Token; onSelect: (t: Token) => void }) {
  const remaining = Math.max(0, 85 - (token.realSol ?? 0));
  return (
    <button
      onClick={() => onSelect(token)}
      className="w-full rounded-lg border border-[#ffd60a]/40 bg-[linear-gradient(110deg,rgba(255,214,10,.14),rgba(168,85,247,.14),rgba(0,255,102,.10))] p-4 text-left transition-[border-color,transform] hover:-translate-y-0.5 hover:border-[#ffd60a] active:translate-y-0"
    >
      <div className="flex items-center gap-3">
        <span className="text-5xl" aria-hidden="true">{token.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-[#ffd60a]">King Of Hill</div>
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="truncate text-xl font-black">{token.name}</h2>
            <span className="font-mono text-sm text-white/60">${token.ticker}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/50">
            <div className="h-full bg-pump" style={{ width: `${Math.min(100, (token.realSol ?? 0) / 85 * 100)}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-white/65">
            <b>{remaining.toFixed(1)} SOL</b> to Raydium
            {token.complete && ' · 🎓 Graduated'}
          </p>
        </div>
      </div>
      <span className="hidden rounded-md bg-pump px-3 py-2 text-sm font-black text-black sm:inline">Ape In</span>
    </button>
  );
}