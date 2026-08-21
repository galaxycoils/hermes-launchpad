import type { Token } from '@/lib/tokens'
import { tokenCurveStatus, migrationProgress } from '@/lib/token-truth'
import OracleRing from '@/components/OracleRing'
import Sparkline from '@/components/Sparkline'

interface TokenCardProps {
  token: Token
  onSelect: (token: Token) => void
  className?: string
}

export default function TokenCard({ token, onSelect, className = '' }: TokenCardProps) {
  const status = tokenCurveStatus(token)
  const progress = migrationProgress(token)

  // Truth signals matching project invariant (WU-05)
  const isOnChain = token.provenance === 'index' || token.provenance === 'onchain' || Boolean(token.onchainMint)
  const isDemo = !isOnChain && (status === 'demo' || token.provenance === 'demo' || !token.onchainMint)
  const isMigrationReady = status === 'migration-ready' || Boolean(token.complete)

  const isPositive = (token.change24h ?? 0) >= 0
  const progressGlow = progress > 75

  // Default sparkline if not provided
  const sparklineData =
    token.sparkline && token.sparkline.length >= 2
      ? token.sparkline
      : [1.0, 1.05, 1.02, 1.15, 1.12, 1.25, 1.3]

  return (
    <button
      type="button"
      onClick={() => onSelect(token)}
      className={`group relative flex flex-col justify-between w-full rounded-2xl border border-white/[0.06] bg-obsidian/70 p-3.5 text-left backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-iris/40 hover:bg-obsidian hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] active:scale-[0.98] ${className}`}
      data-testid="token-card"
      data-token-id={token.id}
    >
      {/* Top Row: OracleRing + Identity + Change Badge */}
      <div className="flex items-start justify-between gap-2 w-full">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <OracleRing score={token.riskScore} isDemo={isDemo} size="md">
            <span className="text-2xl select-none" aria-hidden="true">
              {token.emoji}
            </span>
          </OracleRing>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5 truncate">
              <span className="font-display font-black text-sm text-white truncate group-hover:text-pulse transition-colors">
                {token.name}
              </span>
              <span className="font-mono text-xs text-white/50">${token.ticker}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] font-mono text-white/40 truncate">
              {isOnChain ? (
                <span className="text-pulse font-semibold" data-testid="provenance-onchain">
                  ● On-chain
                </span>
              ) : isDemo ? (
                <span className="text-white/40 font-semibold" data-testid="provenance-demo">
                  Demo
                </span>
              ) : null}
              {token.creator && (
                <span>
                  · {token.creator.slice(0, 4)}…{token.creator.slice(-3)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Change Badge */}
        <div className="flex flex-col items-end flex-shrink-0">
          <span
            className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
              isPositive ? 'bg-pulse/10 text-pulse' : 'bg-bleed/10 text-bleed'
            }`}
          >
            {isPositive ? '▲ +' : '▼ '}
            {Math.abs(token.change24h ?? 8.5).toFixed(1)}%
          </span>
          {isMigrationReady && (
            <span
              className="mt-1 flex items-center gap-0.5 text-[10px] font-bold text-sol"
              data-testid="provenance-migration"
            >
              ✨ Migration ready
            </span>
          )}
        </div>
      </div>

      {/* Middle Row: Sparkline */}
      <div className="my-2.5 w-full">
        <Sparkline data={sparklineData} positive={isPositive} height={28} />
      </div>

      {/* Bottom Row: Raised Amount + Bonding Progress Bar */}
      <div className="w-full space-y-1 pt-1 border-t border-white/[0.04]">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-white/60">
            <b className="text-white font-bold">{token.realSol?.toFixed(1) ?? '0.0'}</b> SOL raised
          </span>
          <span className="font-bold text-white/80">{progress.toFixed(0)}%</span>
        </div>
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressGlow
                ? 'bg-gradient-to-r from-iris-start via-pulse to-sol animate-pulse-glow shadow-[0_0_8px_rgba(0,255,102,0.6)]'
                : 'bg-gradient-to-r from-iris-start to-pulse'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    </button>
  )
}
