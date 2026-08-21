import type { Token } from '@/lib/tokens'
import { migrationProgress } from '@/lib/token-truth'
import Sparkline from '@/components/Sparkline'

interface KOHStripProps {
  token: Token | null
  onSelect?: (token: Token) => void
  className?: string
}

export default function KOHStrip({ token, onSelect, className = '' }: KOHStripProps) {
  if (!token || !token.onchainMint || (token.realSol ?? 0) <= 0) {
    return null
  }

  const progress = migrationProgress(token)
  const isPositive = (token.change24h ?? 0) >= 0
  const sparklineData = token.sparkline && token.sparkline.length >= 2 ? token.sparkline : [1, 1.2, 1.1, 1.4, 1.3, 1.6, 1.8]

  return (
    <div
      onClick={() => onSelect?.(token)}
      className={`group relative w-full cursor-pointer overflow-hidden rounded-xl border-l-4 border-sol border border-white/10 bg-gradient-to-r from-sol/[0.08] via-obsidian to-void p-3 transition-all hover:border-white/20 hover:shadow-[0_0_25px_rgba(255,184,0,0.15)] active:scale-[0.99] ${className}`}
      data-testid="koh-strip"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect?.(token)
        }
      }}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Crown + Identity */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="flex items-center justify-center text-sol text-lg flex-shrink-0 animate-float-bob">
            👑
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl flex-shrink-0 select-none">{token.emoji}</span>
            <div className="min-w-0 truncate">
              <div className="flex items-baseline gap-1.5 truncate">
                <span className="font-display font-black text-sm text-white truncate">{token.name}</span>
                <span className="font-mono text-xs text-sol font-bold">${token.ticker}</span>
              </div>
              <div className="font-mono text-[10px] text-white/40">
                King of the Hill · {token.realSol?.toFixed(1)} SOL raised
              </div>
            </div>
          </div>
        </div>

        {/* Center: Sparkline (hidden on very small screens, visible on sm+) */}
        <div className="hidden sm:block w-28 flex-shrink-0">
          <Sparkline data={sparklineData} positive={isPositive} height={24} width={112} />
        </div>

        {/* Right: Change % & Progress Bar */}
        <div className="flex flex-col items-end flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                isPositive ? 'bg-pulse/10 text-pulse' : 'bg-bleed/10 text-bleed'
              }`}
            >
              {isPositive ? '▲ +' : '▼ '}
              {Math.abs(token.change24h ?? 12.4).toFixed(1)}%
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 w-20">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-sol to-pulse rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-white/50">{progress.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
