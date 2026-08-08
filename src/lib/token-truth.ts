import type { Token } from './tokens';
import { MIGRATION_TARGET } from './tokens';

const verifiedSol = (token: Token): number => {
  if (!token.onchainMint) return 0;
  const value = token.realSol;
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
};

export const migrationProgress = (token: Token): number =>
  Math.min(100, verifiedSol(token) / MIGRATION_TARGET * 100);

export const remainingToMigration = (token: Token): number =>
  Math.max(0, MIGRATION_TARGET - verifiedSol(token));

export const sortByCurveProgress = (tokens: Token[]): Token[] =>
  [...tokens].sort((a, b) => verifiedSol(b) - verifiedSol(a));

export type VerifiedTokenFilter = 'all' | 'curve-progress' | 'migration-ready';

export type TokenCurveStatus = 'demo' | 'active' | 'migration-ready';

export const tokenCurveStatus = (token: Token): TokenCurveStatus => {
  if (!token.onchainMint) return 'demo';
  return token.complete ? 'migration-ready' : 'active';
};

export const filterVerifiedTokens = (
  tokens: Token[], filter: VerifiedTokenFilter,
): Token[] => {
  if (filter === 'curve-progress') return sortByCurveProgress(tokens);
  if (filter === 'migration-ready') {
    return tokens.filter((token) => tokenCurveStatus(token) === 'migration-ready');
  }
  return tokens;
};

export const formatUnixAge = (unixSeconds: number, nowMs = Date.now()): string => {
  const minutes = Math.max(0, Math.floor((nowMs / 1000 - unixSeconds) / 60));
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`;
};
