import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import OracleRing from '@/components/OracleRing'
import Sparkline from '@/components/Sparkline'
import KOHStrip from '@/components/KOHStrip'
import LiveTicker from '@/components/LiveTicker'
import FilterBar from '@/components/FilterBar'
import TokenCard from '@/components/TokenCard'
import type { Token, Trade } from '@/lib/tokens'

function stripReactComments(html: string): string {
  return html.replace(/<!-- -->/g, '')
}

describe('Phase 3 Feed Architecture & Micro-Components', () => {
  describe('OracleRing', () => {
    it('renders with children and applies low risk score', () => {
      const html = renderToString(
        <OracleRing score={20}>
          <span>🚀</span>
        </OracleRing>
      )
      expect(html).toContain('data-testid="oracle-ring"')
      expect(html).toContain('data-risk-score="20"')
      expect(html).toContain('🚀')
    })

    it('renders dashed ring for demo tokens', () => {
      const html = renderToString(
        <OracleRing isDemo={true}>
          <span>🧪</span>
        </OracleRing>
      )
      expect(html).toContain('data-testid="oracle-ring"')
      expect(html).toContain('stroke-dasharray="3 3"')
    })
  })

  describe('Sparkline', () => {
    it('renders SVG polyline when data points >= 2 are provided', () => {
      const html = renderToString(<Sparkline data={[1, 2, 3, 2, 4]} positive={true} height={32} />)
      expect(html).toContain('data-testid="sparkline"')
      expect(html).toContain('<polyline')
    })

    it('renders fallback when data is empty or too short', () => {
      const html = renderToString(<Sparkline data={[1]} />)
      expect(html).toContain('data-testid="sparkline-empty"')
      expect(html).toContain('no price history')
    })
  })

  describe('KOHStrip', () => {
    const mockKing: Token = {
      id: 'smoke',
      name: 'Smoke',
      ticker: 'SMOKE',
      emoji: '🐉',
      lore: 'The king',
      creator: 'creator-wallet',
      chain: 'SOL',
      onchainMint: 'mint123',
      realSol: 42.5,
      change24h: 15.2,
      sparkline: [1, 2, 3, 4],
    }

    it('renders King of the Hill strip when king contender exists', () => {
      const html = stripReactComments(renderToString(<KOHStrip token={mockKing} />))
      expect(html).toContain('data-testid="koh-strip"')
      expect(html).toContain('Smoke')
      expect(html).toContain('$SMOKE')
      expect(html).toContain('42.5 SOL raised')
    })

    it('returns null if token is null or has no realSol raised', () => {
      const html1 = renderToString(<KOHStrip token={null} />)
      expect(html1).toBe('')

      const html2 = renderToString(<KOHStrip token={{ ...mockKing, realSol: 0 }} />)
      expect(html2).toBe('')
    })
  })

  describe('LiveTicker', () => {
    it('renders live ticker with trade records', () => {
      const trades: Trade[] = [
        { id: 1, token_id: 'SMOKE', wallet: 'w1', side: 'buy', sol_amount: 1.5, token_amount: 1000, price: 0.001, ts: Date.now() },
        { id: 2, token_id: 'HNQ', wallet: 'w2', side: 'sell', sol_amount: 0.5, token_amount: 500, price: 0.001, ts: Date.now() },
      ]

      const html = stripReactComments(renderToString(<LiveTicker trades={trades} />))
      expect(html).toContain('data-testid="live-ticker"')
      expect(html).toContain('BOUGHT 1.50 SOL')
      expect(html).toContain('SOLD 0.50 SOL')
    })
  })

  describe('FilterBar', () => {
    it('renders search input and filter pills', () => {
      const html = renderToString(
        <FilterBar
          filter="all"
          onFilterChange={() => {}}
          search="smoke"
          onSearchChange={() => {}}
        />
      )

      expect(html).toContain('value="smoke"')
      expect(html).toContain('All')
      expect(html).toContain('Curve')
      expect(html).toContain('Ready')
    })
  })

  describe('TokenCard Redesign', () => {
    it('renders token card with oracle ring, name, ticker, and progress', () => {
      const token: Token = {
        id: 't1',
        name: 'Alpha Coin',
        ticker: 'ALPHA',
        emoji: '🦁',
        lore: 'Lore',
        creator: 'creator-addr',
        chain: 'SOL',
        onchainMint: 'mint-alpha',
        realSol: 12.0,
        riskScore: 25,
        change24h: 8.5,
      }

      const html = stripReactComments(renderToString(<TokenCard token={token} onSelect={() => {}} />))

      expect(html).toContain('data-testid="token-card"')
      expect(html).toContain('Alpha Coin')
      expect(html).toContain('$ALPHA')
      expect(html).toContain('data-testid="provenance-onchain"')
    })
  })
})
