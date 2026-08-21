import { useMemo } from 'react'
import type { Trade } from '@/lib/tokens'

interface LiveTickerProps {
  trades?: Trade[]
  className?: string
}

// Default initial trade stream
const INITIAL_TRADES: Partial<Trade>[] = [
  { token_id: '1', token_ticker: 'HERMES', side: 'buy', sol_amount: 0.5, ts: Date.now() },
  { token_id: '2', token_ticker: 'ORACLE', side: 'sell', sol_amount: 0.2, ts: Date.now() },
  { token_id: '3', token_ticker: 'SOL', side: 'buy', sol_amount: 1.2, ts: Date.now() },
  { token_id: '4', token_ticker: 'PULSE', side: 'buy', sol_amount: 0.8, ts: Date.now() },
  { token_id: '5', token_ticker: 'DEGEN', side: 'sell', sol_amount: 0.4, ts: Date.now() },
]

export default function LiveTicker({ trades, className = '' }: LiveTickerProps) {
  const displayTrades = useMemo(() => {
    if (trades && trades.length > 0) return trades
    return INITIAL_TRADES as Trade[]
  }, [trades])

  const renderItems = (keyPrefix: string) =>
    displayTrades.map((t, idx) => {
      const isBuy = t.side === 'buy'
      const sol = typeof t.sol_amount === 'number' ? t.sol_amount.toFixed(2) : '0.50'
      const tokenLabel = t.token_ticker
        ? `$${t.token_ticker}`
        : t.token_id
        ? `Token #${t.token_id.slice(0, 4)}`
        : '$TOKEN'

      return (
        <div
          key={`${keyPrefix}-${idx}-${t.id ?? idx}`}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono whitespace-nowrap"
        >
          <span className="text-sm select-none">{isBuy ? '🟢' : '🔴'}</span>
          <span className="font-semibold text-white/90">{tokenLabel}</span>
          <span className={isBuy ? 'text-pulse font-bold' : 'text-bleed font-bold'}>
            {isBuy ? 'BOUGHT' : 'SOLD'} {sol} SOL
          </span>
          <span className="text-white/20 mx-1">│</span>
        </div>
      )
    })

  return (
    <div
      className={`relative h-10 w-full overflow-hidden border-y border-white/5 bg-void/90 backdrop-blur-md ${className}`}
      data-testid="live-ticker"
    >
      {/* Edge gradient masks for smooth fade */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-void to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-void to-transparent" />

      <div className="flex w-max items-center h-full animate-marquee hover:[animation-play-state:paused]">
        {/* Track 1 */}
        <div className="flex items-center">{renderItems('track1')}</div>
        {/* Track 2 (seamless repeat) */}
        <div className="flex items-center">{renderItems('track2')}</div>
      </div>
    </div>
  )
}
