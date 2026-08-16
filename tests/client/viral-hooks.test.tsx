import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import TradeReceiptCard from '../../src/components/TradeReceiptCard';
import GraduationModal from '../../src/components/GraduationModal';
import type { Token } from '../../src/lib/tokens';
import type { TradeResult } from '../../src/lib/api';

const mockToken: Token = {
  id: 'test-token',
  name: 'Test Token',
  ticker: 'TEST',
  emoji: '🚀',
  lore: 'Test lore',
  creator: '11111111111111111111111111111111',
  chain: 'SOL',
  complete: true,
  realSol: 85,
};

const mockTradeResult: TradeResult = {
  ok: true,
  side: 'buy',
  solAmount: 0.5,
  tokenAmount: 1000,
  price: 0.0005,
  pnl: 0,
  migrationReady: false,
  token: mockToken,
};

describe('Viral Hooks Components', () => {
  it('renders TradeReceiptCard correctly', () => {
    const html = renderToString(
      <TradeReceiptCard
        result={mockTradeResult}
        token={mockToken}
        refCode="HERMES123"
        onClose={() => {}}
      />
    );
    expect(html).toContain('Trade Confirmed');
    expect(html).toContain('TEST');
    expect(html).toContain('0.5');
    expect(html).toContain('SOL');
    expect(html).toContain('HERMES123');
  });

  it('renders GraduationModal correctly', () => {
    const html = renderToString(
      <GraduationModal token={mockToken} onClose={() => {}} />
    );
    expect(html).toContain('HAS GRADUATED!');
    expect(html).toContain('TEST');
    expect(html).toContain('CURVE COMPLETED');
  });
});
