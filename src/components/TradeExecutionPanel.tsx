import React, { useState, useEffect, useMemo, useRef } from 'react'
import { FocusTrap } from 'focus-trap-react'
import { Button } from '@/components/Button'
import { triggerConfetti } from '@/lib/confetti-presets'
import { useSoundEffect } from '@/hooks/useSoundEffect'
import { useHaptic } from '@/hooks/useHaptic'
import { useTrade } from '@/hooks/useTrade'
import { computeBuyQuote, computeSellQuote, FEE_BPS, BPS_DENOM } from '@/lib/solana'
import type { Token } from '@/lib/tokens'
import type { TradeResult } from '@/lib/api'

interface TradeExecutionPanelProps {
  token: Token | null
  wallet: string | null
  onTradeComplete?: (result: TradeResult) => void
  className?: string
}

const BUY_PRESETS = [0.1, 0.5, 1, 5]
const SELL_PRESETS = [25, 50, 75, 100]

export default function TradeExecutionPanel({
  token,
  wallet,
  onTradeComplete,
  className = '',
}: TradeExecutionPanelProps) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [quoteAnimKey, setQuoteAnimKey] = useState(0)
  const [prevQuote, setPrevQuote] = useState<boolean>(false)

  const { play: playSound } = useSoundEffect()
  const { trigger: triggerHaptic } = useHaptic()

  // Fallback initial token if token is null
  const activeToken: Token = token || {
    id: 'empty-token',
    name: 'Token',
    ticker: 'TOK',
    emoji: '🪙',
    lore: '',
    creator: '',
    chain: 'SOL',
  }

  const { executeTrade, pending, error, curve, balance, refreshCurve } = useTrade(activeToken, wallet)

  useEffect(() => {
    if (token?.onchainMint) {
      refreshCurve()
    }
  }, [token?.onchainMint, refreshCurve])

  const quote = useMemo(() => {
    const val = parseFloat(amount)
    if (!val || val <= 0 || !curve) return null
    try {
      if (side === 'buy') {
        const q = computeBuyQuote(val, curve.virtualSol, curve.virtualTokens)
        const fee = (val * Number(FEE_BPS * 2n)) / Number(BPS_DENOM)
        const price = val / (q.tokOut / 1_000_000)
        const impact = ((val * 1_000_000_000) / curve.virtualSol) * 100
        return {
          receive: q.tokOut / 1_000_000,
          minReceive: Number(q.minOut) / 1_000_000,
          fee,
          price,
          impact: Math.min(impact, 100),
          solAmount: val,
        }
      } else {
        const q = computeSellQuote(val, curve.virtualSol, curve.virtualTokens)
        const fee = (q.solOut * Number(FEE_BPS * 2n)) / Number(BPS_DENOM)
        const impact = ((val * 1_000_000) / curve.virtualTokens) * 100
        return {
          receive: q.solOut,
          minReceive: Number(q.minOut) / 1_000_000_000,
          fee,
          price: q.solOut / val,
          impact: Math.min(impact, 100),
          solAmount: q.solOut,
        }
      }
    } catch {
      return null
    }
  }, [amount, side, curve])

  const animTriggeredRef = useRef(false)
  useEffect(() => {
    if (quote && !prevQuote && !animTriggeredRef.current) {
      animTriggeredRef.current = true
      setQuoteAnimKey((k) => k + 1)
    }
    requestAnimationFrame(() => {
      setPrevQuote(Boolean(quote))
    })
  }, [quote, prevQuote])

  const handleTrade = () => {
    const val = parseFloat(amount)
    if (!val || val <= 0) return
    if (side === 'buy' && balance !== null && val > balance) return

    triggerHaptic('medium')
    playSound('click')
    setShowConfirm(true)
  }

  const confirmTrade = async () => {
    const val = parseFloat(amount)
    setShowConfirm(false)
    const result = await executeTrade(side, val)
    if (result) {
      triggerHaptic('heavy')
      playSound('trade')
      triggerConfetti('trade')
      onTradeComplete?.(result)
      setAmount('')
    }
  }

  const handlePreset = (preset: number) => {
    triggerHaptic('light')
    playSound('click')
    setAmount(String(preset))
  }

  const handleMax = () => {
    triggerHaptic('light')
    playSound('click')
    if (balance !== null && balance > 0) {
      setAmount(String(Math.floor(balance * 10000) / 10000))
    }
  }

  const fmtNum = (n: number, decimals = 4) =>
    n < 0.0001 ? n.toExponential(2) : n.toLocaleString(undefined, { maximumFractionDigits: decimals })

  const getPriceImpactColor = (impact: number) => {
    if (impact < 3) return 'text-pulse'
    if (impact < 5) return 'text-sol'
    return 'text-bleed'
  }

  const getPriceImpactBg = (impact: number) => {
    if (impact < 3) return 'bg-pulse/10'
    if (impact < 5) return 'bg-sol/10'
    return 'bg-bleed/10'
  }

  const isValidToTrade =
    amount !== '' &&
    parseFloat(amount) > 0 &&
    !pending &&
    !(side === 'buy' && balance !== null && parseFloat(amount) > balance)

  if (!token) {
    return (
      <div className="rounded-xl border border-white/5 bg-obsidian/40 p-6 text-center" data-testid="trade-execution-empty">
        <p className="text-xs text-white/40">Select a token to trade</p>
      </div>
    )
  }

  if (!wallet) {
    return (
      <div className="rounded-xl border border-white/5 bg-obsidian/50 p-6 text-center" data-testid="trade-execution-no-wallet">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 text-xl">
          👛
        </div>
        <p className="text-sm font-display font-bold text-white/80">Connect wallet to trade</p>
        <p className="mt-1 text-xs text-white/40">Instant on-chain bonding curve execution</p>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-obsidian/80 p-4 backdrop-blur-md ${className}`}
      data-testid="trade-execution-panel"
    >
      {/* Buy / Sell Tab Switcher */}
      <div className="mb-3.5 flex gap-1 rounded-xl bg-black/40 p-1 border border-white/5">
        <button
          type="button"
          onClick={() => {
            setSide('buy')
            setAmount('')
            triggerHaptic('light')
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-display font-black uppercase tracking-wider transition-all duration-200 ${
            side === 'buy'
              ? 'bg-pulse/15 text-pulse border border-pulse/30 shadow-[0_0_15px_rgba(0,255,102,0.15)]'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          <span>↑</span> Buy
        </button>
        <button
          type="button"
          onClick={() => {
            setSide('sell')
            setAmount('')
            triggerHaptic('light')
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-display font-black uppercase tracking-wider transition-all duration-200 ${
            side === 'sell'
              ? 'bg-bleed/15 text-bleed border border-bleed/30 shadow-[0_0_15px_rgba(255,51,68,0.15)]'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          <span>↓</span> Sell
        </button>
      </div>

      {/* Amount Input with Token / SOL ticker tag */}
      <div className="relative mb-2">
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, '')
            if (v.split('.').length <= 2) setAmount(v)
          }}
          placeholder="0.00"
          disabled={pending}
          aria-label="Trade amount"
          className="h-12 w-full rounded-xl border border-white/10 bg-black/50 px-4 pr-20 font-mono text-base font-bold text-white placeholder:text-white/20 outline-none transition-colors focus:border-iris focus:ring-1 focus:ring-iris/50 disabled:opacity-50"
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-white/50">
          {side === 'buy' ? 'SOL' : `$${token.ticker}`}
        </div>
      </div>

      {/* Balance display & Max Button */}
      {balance !== null && (
        <div className="mb-2.5 flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-1.5 text-xs font-mono">
          <span className="text-white/40">
            Balance: <b className="text-white/80">{fmtNum(balance)}</b> SOL
          </span>
          <button
            type="button"
            onClick={handleMax}
            disabled={pending}
            className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/80 hover:bg-iris/20 hover:text-iris-start transition-colors disabled:opacity-50"
          >
            MAX
          </button>
        </div>
      )}

      {/* Quick Amount Preset Pills */}
      <div className="mb-3.5 grid grid-cols-4 gap-1.5">
        {(side === 'buy' ? BUY_PRESETS : SELL_PRESETS).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handlePreset(p)}
            disabled={pending}
            className="rounded-lg border border-white/5 bg-white/[0.03] py-2 text-xs font-mono font-bold text-white/60 hover:border-iris/40 hover:bg-iris/10 hover:text-white transition-all disabled:opacity-50"
          >
            {side === 'buy' ? `${p} SOL` : `${p}%`}
          </button>
        ))}
      </div>

      {/* Real-time Output Quote */}
      {quote && (
        <div
          key={quoteAnimKey}
          className="mb-3.5 space-y-1.5 rounded-xl border border-white/5 bg-black/40 p-3 text-xs font-mono"
        >
          <div className="flex justify-between">
            <span className="text-white/40">You receive</span>
            <span className="font-bold text-white">
              ≈ {fmtNum(quote.receive, side === 'buy' ? 0 : 4)} {side === 'buy' ? `$${token.ticker}` : 'SOL'}
            </span>
          </div>
          <div className={`flex justify-between rounded px-1.5 py-0.5 ${getPriceImpactBg(quote.impact)}`}>
            <span className="text-white/40">Price impact</span>
            <span className={`font-bold ${getPriceImpactColor(quote.impact)}`}>
              {fmtNum(quote.impact, 2)}%
            </span>
          </div>
          <div className="flex justify-between text-white/40">
            <span>Fee (0.5%)</span>
            <span>{fmtNum(quote.fee)} SOL</span>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mb-3 rounded-lg border border-bleed/30 bg-bleed/10 p-2.5 text-center text-xs text-bleed">
          {error}
        </div>
      )}

      {/* Main Execution CTA Button */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={handleTrade}
        loading={pending}
        disabled={!isValidToTrade}
        className={`h-12 text-sm font-display font-black tracking-wide ${
          side === 'buy'
            ? 'bg-pulse text-void hover:bg-pulse/90 shadow-[0_0_20px_rgba(0,255,102,0.3)]'
            : 'bg-bleed/20 text-bleed border-2 border-bleed hover:bg-bleed/30'
        }`}
      >
        {pending ? 'Executing on-chain…' : side === 'buy' ? `BUY $${token.ticker}` : `SELL $${token.ticker}`}
      </Button>

      {/* Confirmation Modal */}
      {showConfirm && quote && (
        <FocusTrap focusTrapOptions={{ initialFocus: false, allowOutsideClick: false }}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-obsidian p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display font-black text-base text-white">
                  Confirm {side === 'buy' ? 'Buy' : 'Sell'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="text-white/40 hover:text-white text-lg"
                  aria-label="Cancel"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4 rounded-xl bg-white/5 p-3.5 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-white/40">You pay</span>
                  <span className="font-bold text-white">
                    {fmtNum(parseFloat(amount), 4)} {side === 'buy' ? 'SOL' : `$${token.ticker}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">You receive</span>
                  <span className="font-bold text-pulse">
                    ≈ {fmtNum(quote.receive, side === 'buy' ? 0 : 4)} {side === 'buy' ? `$${token.ticker}` : 'SOL'}
                  </span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between text-white/40">
                  <span>Price impact</span>
                  <span className={getPriceImpactColor(quote.impact)}>{fmtNum(quote.impact, 2)}%</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" size="md" fullWidth onClick={() => setShowConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" fullWidth onClick={confirmTrade} loading={pending}>
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </FocusTrap>
      )}
    </div>
  )
}
