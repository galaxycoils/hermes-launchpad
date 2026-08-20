import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import TokenCard from '../../src/components/TokenCard';
import KingOfHill from '../../src/components/KingOfHill';
import type { Token } from '../../src/lib/tokens';
import { MIGRATION_TARGET } from '../../src/lib/tokens';

const token = (overrides: Partial<Token> = {}): Token => ({
  id: 'real', name: 'Real', ticker: 'REAL', emoji: 'R', lore: '',
  creator: 'creator-wallet', chain: 'SOL', ...overrides,
});
const renderCard = (value: Token) => renderToStaticMarkup(
  React.createElement(TokenCard, { token: value, onSelect: () => undefined }),
);

describe('WU-05 truthful token presentation', () => {
  it('labels records without an on-chain mint as demo', () => {
    expect(renderCard(token())).toContain('Demo');
  });

  it.each([
    { provenance: 'index' as const },
    { provenance: 'onchain' as const },
    { onchainMint: 'mint' },
  ])('labels verified provenance as on-chain (%o)', (overrides) => {
    const html = renderCard(token(overrides));
    expect(html).toContain('On-chain');
    expect(html).not.toContain('Demo');
  });

  it('labels confirmed on-chain curves as on-chain', () => {
    const html = renderCard(token({ onchainMint: 'mint', complete: false }));
    expect(html).toContain('On-chain');
  });

  it('labels locked curves migration-ready, never migrated', () => {
    const html = renderCard(token({ onchainMint: 'mint', complete: true }));
    expect(html).toContain('Migration ready');
    expect(html).not.toMatch(/graduated|migrated/i);
  });

  it('renders shared migration threshold math', () => {
    const html = renderToStaticMarkup(React.createElement(KingOfHill, {
      token: token({ onchainMint: 'mint', realSol: MIGRATION_TARGET / 2 }),
      onSelect: () => undefined,
    }));
    expect(html).toContain(`${(MIGRATION_TARGET / 2).toFixed(1)} SOL`);
    expect(html).toContain('width:50%');
  });
});
