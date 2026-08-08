export interface Token {
  id: string;
  name: string;
  ticker: string;
  emoji: string;
  lore: string;
  creator: string;
  chain: 'SOL' | 'BASE';
  onchainMint?: string; // set when created on devnet for real
  provenance?: 'demo' | 'index' | 'onchain'; // where realSol/complete came from
  complete?: boolean;   // curve reached threshold and locked; migration not proven
  realSol?: number;     // SOL raised on the curve
  priceSol?: number;    // SOL per token
  riskFlag?: string;    // The Oracle's one-line verdict (persisted)
  likedByMe?: boolean;  // set when fetched with ?wallet=
}

export interface ReferralStats {
  code: string;
  invites: number;
  xpEarned: number;
  xpPerInvite: number;
  referred: { name: string; ts: number }[];
}

export const MIGRATION_TARGET = 85; // SOL curve-lock/migration threshold (matches on-chain program)

export const TOKENS: Token[] = [];

export interface Quest {
  id: string;
  title: string;
  xp: number;
  progress: number;
  total: number;
  done?: boolean;
}

export const QUESTS: Quest[] = [];

export interface Trader {
  rank: number;
  name: string;
  pnl: number;
  trades: number;
  winRate: number;
  xp: number;
  level?: number;
  streak?: number;
}

export interface Profile {
  wallet: string;
  xp: number;
  level: number;
  streak_days: number;
  ref_code: string;
  trades: number;
  pnl: number;
}

export interface Trade {
  id: number;
  token_id: string;
  wallet: string;
  side: 'buy' | 'sell';
  sol_amount: number;
  token_amount: number;
  price: number;
  ts: number;
}

export interface CommentItem {
  wallet: string;
  text: string;
  ts: number;
}

export const LEADERBOARD: Trader[] = [];

export const fmtUsd = (n: number): string =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000 ? `$${(n / 1_000).toFixed(1)}K`
    : `$${n.toFixed(0)}`;

export const fmtAgo = (mins: number): string =>
  mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;