import { fmtUsd } from '@/lib/tokens';
import type { Token } from '@/lib/tokens';
import Sparkline from './Sparkline';

export default function TokenCard({ token, onSelect }: { token: Token; onSelect: (t: Token) => void }) {
  const up = token.change24h >= 0;
  const signal = up ? 'text-pump' : 'text-dump';
  const isDemo = !token.onchainMint;
  return <button onClick={() => onSelect(token)} className="group surface content-visibility-auto w-full rounded-lg border p-3 text-left transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-[#00ff66]/70 hover:bg-[#161616] active:translate-y-0">
    <div className="flex min-w-0 flex items-center gap-2">
      <span className="text-3xl" aria-hidden="true">{token.emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-pump" aria-label="Active market" />
          <span className="truncate font-bold">{token.name}</span>
          <span className="font-mono text-xs text-white/55">${token.ticker}</span>
          {isDemo && <span className="rounded bg-yellow-400/20 px-1.5 py-0.5 text-[10px] font-mono text-yellow-300 border border-yellow-400/30">Demo</span>}
        </div>
        <div className="truncate text-[11px] text-white/45">{token.holders.toLocaleString()} holders · {token.replies} replies</div>
      </div>
      <Sparkline data={token.spark} positive={up} w={78} h={30} />
    </div>
    <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-xs tabular-nums">
      <div><span className="block text-[10px] uppercase tracking-wider text-white/45">Mcap</span><b>{fmtUsd(token.marketCap)}</b></div>
      <div><span className="block text-[10px] uppercase tracking-wider text-white/45">24h</span><b className={signal}>{up ? '+' : ''}{token.change24h.toFixed(1)}%</b></div>
      <div><span className="block text-[10px] uppercase tracking-wider text-white/45">Vol</span><b>{fmtUsd(token.volume24h)}</b></div>
    </div>
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-white/50">
        <span>Curve</span>
        <span>{token.curveProgress.toFixed(0)}% to Raydium</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={token.curveProgress > 80 ? 'h-full bg-pump' : 'h-full bg-hermes'} style={{ width: `${token.curveProgress}%` }} />
      </div>
    </div>
    <div className="mt-3 flex items-center justify-between">
      <span className="text-xs text-white/50">AI risk <b className={token.riskScore < 40 ? 'text-pump' : token.riskScore < 65 ? 'text-yellow-300' : 'text-dump'}>{token.riskScore}/100</b></span>
      <span className="rounded-md bg-pump px-2 py-1 text-xs font-black text-black">Trade</span>
    </div>
  </button>;
}
