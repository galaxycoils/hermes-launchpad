import { describe, expect, it } from 'vitest';
import type { Token } from '../../src/lib/tokens';
import { LEADERBOARD, MIGRATION_TARGET, QUESTS, TOKENS } from '../../src/lib/tokens';
import {
  formatUnixAge,
  filterVerifiedTokens,
  migrationProgress,
  remainingToMigration,
  sortByCurveProgress,
  tokenCurveStatus,
} from '../../src/lib/token-truth';

const token = (realSol?: number): Token => ({
  id: String(realSol ?? 'none'), name: 'Real', ticker: 'REAL', emoji: 'R',
  lore: '', creator: 'creator', chain: 'SOL', onchainMint: 'mint', realSol,
});

describe('WU-05 frontend truth invariants', () => {
  it('ships no fixture token, quest, or leaderboard data', () => {
    expect(TOKENS).toEqual([]);
    expect(QUESTS).toEqual([]);
    expect(LEADERBOARD).toEqual([]);
  });

  it('derives migration values from one 85 SOL target', () => {
    expect(MIGRATION_TARGET).toBe(85);
    expect(migrationProgress(token(42.5))).toBe(50);
    expect(migrationProgress(token(100))).toBe(100);
    expect(remainingToMigration(token(100))).toBe(0);
  });

  it('formats Unix-second referral timestamps deterministically', () => {
    expect(formatUnixAge(1_700_000_000, 1_700_003_600_000)).toBe('1h');
  });

  it('sorts verified curve progress without inventing trending/new metrics', () => {
    expect(sortByCurveProgress([token(1), token(undefined), token(10)]).map((t) => t.realSol))
      .toEqual([10, 1, undefined]);
  });

  it('never treats demo reserves as verified progress', () => {
    const demo = { ...token(84), id: 'demo', onchainMint: undefined };
    const verified = { ...token(1), id: 'verified' };
    expect(migrationProgress(demo)).toBe(0);
    expect(sortByCurveProgress([demo, verified]).map((t) => t.id))
      .toEqual(['verified', 'demo']);
  });

  it('offers only evidence-backed discovery filters', () => {
    const ready = { ...token(10), id: 'ready', complete: true };
    const active = { ...token(1), id: 'active', complete: false };
    expect(filterVerifiedTokens([active, ready], 'curve-progress').map((t) => t.id))
      .toEqual(['ready', 'active']);
    expect(filterVerifiedTokens([active, ready], 'migration-ready')).toEqual([ready]);
    expect(filterVerifiedTokens([active, ready], 'all')).toEqual([active, ready]);
  });

  it('distinguishes demo, active, and migration-ready from migrated', () => {
    expect(tokenCurveStatus({ ...token(0), onchainMint: undefined })).toBe('demo');
    expect(tokenCurveStatus(token(1))).toBe('active');
    expect(tokenCurveStatus({ ...token(85), complete: true })).toBe('migration-ready');
  });
});
