export interface OracleSignalProps {
  score?: number
  riskFlag?: string
  loading?: boolean
  className?: string
}

export default function OracleSignal({
  score,
  riskFlag,
  loading = false,
  className = '',
}: OracleSignalProps) {
  if (loading) {
    return (
      <div
        className={`rounded-xl border border-white/10 bg-obsidian/60 p-4 border-l-4 border-l-iris-start backdrop-blur-md animate-pulse ${className}`}
        data-testid="oracle-signal-loading"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 rounded bg-white/10" />
            <div className="h-3 w-2/3 rounded bg-white/5" />
          </div>
        </div>
      </div>
    )
  }

  const isScored = score !== undefined
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
  let riskColor = 'text-pulse'
  let riskBg = 'bg-pulse/10 border-pulse/30'

  if (isScored) {
    if (score < 30) {
      riskLevel = 'LOW'
      riskColor = 'text-pulse'
      riskBg = 'bg-pulse/10 border-pulse/30'
    } else if (score <= 70) {
      riskLevel = 'MEDIUM'
      riskColor = 'text-sol'
      riskBg = 'bg-sol/10 border-sol/30'
    } else {
      riskLevel = 'HIGH'
      riskColor = 'text-bleed'
      riskBg = 'bg-bleed/10 border-bleed/30'
    }
  }

  // Generate analysis signals
  const analysisSignals = [
    isScored && score < 30
      ? 'Strong bonding curve momentum & healthy holder distribution.'
      : isScored && score > 70
      ? 'High creator balance concentration. Exercise caution.'
      : 'Moderate trading activity on the bonding curve.',
    riskFlag || 'Oracle AI automated risk assessment via on-chain invariants.',
  ]

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/10 bg-obsidian/70 p-4 border-l-4 border-l-iris-start backdrop-blur-md ${className}`}
      data-testid="oracle-signal"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Circular score display */}
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.03] border border-white/10 flex-shrink-0">
            <span className="font-display font-black text-sm text-white">
              {isScored ? score : '—'}
            </span>
            <div className="absolute inset-0 rounded-full border border-iris/40 animate-pulse-glow" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-xs uppercase tracking-wider text-iris-start">
                The Oracle
              </span>
              {isScored ? (
                <span
                  className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${riskBg} ${riskColor}`}
                >
                  {riskLevel} RISK
                </span>
              ) : (
                <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/50">
                  ANALYZING
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-white/60">
              {isScored ? 'Live AI Risk Signal' : 'Awaiting Oracle analysis'}
            </p>
          </div>
        </div>
      </div>

      {/* Analysis bullets */}
      <ul className="mt-3 space-y-1.5 border-t border-white/[0.04] pt-2.5 text-xs text-white/70">
        {analysisSignals.map((signal, idx) => (
          <li key={idx} className="flex items-start gap-1.5">
            <span className="text-iris-start mt-0.5">◈</span>
            <span className="leading-relaxed">{signal}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
