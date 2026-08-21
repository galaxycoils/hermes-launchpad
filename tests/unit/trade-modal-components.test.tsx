import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import OracleSignal from '@/components/OracleSignal'
import TradeModalContent from '@/components/TradeModalContent'
import type { Token } from '@/lib/tokens'

function stripReactComments(html: string): string {
  return html.replace(/<!-- -->/g, '')
}

describe('Phase 4 Trade Modal & Execution Consolidation', () => {
  describe('OracleSignal', () => {
    it('renders Oracle signal with score and risk tags', () => {
      const html = stripReactComments(
        renderToString(<OracleSignal score={25} riskFlag="Healthy distribution" />)
      )
      expect(html).toContain('data-testid="oracle-signal"')
      expect(html).toContain('The Oracle')
      expect(html).toContain('LOW RISK')
      expect(html).toContain('25')
      expect(html).toContain('Healthy distribution')
    })

    it('renders loading state', () => {
      const html = renderToString(<OracleSignal loading={true} />)
      expect(html).toContain('data-testid="oracle-signal-loading"')
    })

    it('renders analyzing state when score is undefined', () => {
      const html = renderToString(<OracleSignal />)
      expect(html).toContain('ANALYZING')
      expect(html).toContain('Awaiting Oracle analysis')
    })
  })

  describe('TradeModalContent', () => {
    const mockToken: Token = {
      id: 'smoke-token',
      name: 'Smoke Token',
      ticker: 'SMOKE',
      emoji: '🐉',
      lore: 'Ancient dragon lore',
      creator: 'creator123',
      chain: 'SOL',
      onchainMint: 'mint-smoke',
      realSol: 35.0,
      riskScore: 28,
      riskFlag: 'Low risk profile',
      change24h: 12.5,
    }

    it('renders complete trade modal layout with chart, oracle signal, and trade panel', () => {
      const html = stripReactComments(
        renderToString(
          <TradeModalContent
            token={mockToken}
            wallet="wallet-user"
            liked={true}
            onLike={() => {}}
            comments={[]}
            onClose={() => {}}
          />
        )
      )

      expect(html).toContain('data-testid="trade-modal-content"')
      expect(html).toContain('Smoke Token')
      expect(html).toContain('$SMOKE')
      expect(html).toContain('data-testid="oracle-signal"')
      expect(html).toContain('data-testid="trade-execution-panel"')
      expect(html).toContain('The Bard Lore')
      expect(html).toContain('Ancient dragon lore')
    })
  })
})
