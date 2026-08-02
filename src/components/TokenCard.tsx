import { fmtUsd, fmtAgo } from '@/lib/tokens';
import type { Token } from '@/lib/tokens';
import Sparkline from './Sparkline';

const sentimentColor = { bullish: 'text-green-400', neutral: 'text-yellow-400', bearish: 'text-red-400' } as const;

export default function TokenCard({ token, onSelect }: { token: Token; onSelect: (t: Token) => void }) {
  const up = token.change24h >= 0;
  return (
    <button
      onClick={() => onSelect(token)}
      className="w-full text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-green-400/40 transition-all p-4 group"
    >
      <div className="flex items-start gap-3">
        <div className="text-4xl">{token.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white truncate">{token.name}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/70">{token.chain}</span>
            <span className={`text-xs ${sentimentColor[token.sentiment]}`}>{token.sentiment}</span>
          </div>
          <div className="text-xs text-white/50 mt-0.5">
            ${token.ticker} · by {token.creator} · {fmtAgo(token.createdMinsAgo)}
          </div>
        </div>
        <Sparkline data={token.spark} positive={up} />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-white/40">Mkt Cap</div>
          <div className="text-sm font-semibold text-white">{fmtUsd(token.marketCap)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-white/40">24h</div>
          <div className={`text-sm font-semibold ${up ? 'text-green-400' : 'text-red-400'}`}>
            {up ? '+' : ''}{token.change24h.toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-white/40">Holders</div>
          <div className="text-sm font-semibold text-white">{token.holders.toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-[10px] text-white/50 mb-1">
          <span>Bonding curve</span>
          <span>{token.curveProgress}% to migration</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${token.curveProgress > 80 ? 'bg-gradient-to-r from-green-400 to-emerald-300' : 'bg-gradient-to-r from-purple-500 to-green-400'}`}
            style={{ width: `${token.curveProgress}%` }}
          />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-white/40">
        <span>💬 {token.replies} · AI risk {token.riskScore}/100</span>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-green-400">Trade →</span>
      </div>
    </button>
  );
}
