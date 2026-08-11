// Hermes API client v2 — talks to the live curve-engine worker.
import type { Token, Quest, Trader, Profile, Trade, CommentItem, ReferralStats } from './tokens';
import { TOKENS, QUESTS, LEADERBOARD } from './tokens';

// Re-export Token type for consumers
export type { Token } from './tokens';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://hermes-api.tahamtandariush.workers.dev';

async function req<T>(path: string, method: 'GET' | 'POST' = 'GET', body?: unknown, timeoutMs = 8000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      signal: ctrl.signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error((e as { error?: string }).error || `HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

// ---- tokens ----
export async function fetchTokens(): Promise<{ data: Token[]; live: boolean }> {
  try {
    return { data: await req<Token[]>('/api/tokens'), live: true };
  } catch {
    return { data: TOKENS, live: false };
  }
}

export async function fetchToken(tokenId: string, wallet?: string): Promise<Token | null> {
  try {
    return await req<Token>(`/api/tokens/${tokenId}${wallet ? `?wallet=${encodeURIComponent(wallet)}` : ''}`);
  } catch {
    return null;
  }
}

export async function fetchReferrals(wallet: string): Promise<ReferralStats | null> {
  try {
    return await req<ReferralStats>(`/api/profile/${encodeURIComponent(wallet)}/referrals`);
  } catch {
    return null;
  }
}

export interface XpResult { xpGained?: number; questCompleted?: { title: string; xp: number } | null }

// ---- trades ----
export interface TradeResult extends XpResult {
  ok: boolean;
  side: 'buy' | 'sell';
  solAmount: number;
  tokenAmount: number;
  price: number;
  pnl: number;
  migrationReady: boolean; // curve locked at threshold; NOT a Raydium graduation
  token: Token;
}
export async function fetchTrades(tokenId?: string, limit = 25): Promise<Trade[]> {
  return req<Trade[]>(`/api/trades?limit=${limit}${tokenId ? `&token_id=${tokenId}` : ''}`);
}

export async function indexTrade(input: { mint: string; signature: string; wallet: string; side: 'buy' | 'sell' }): Promise<TradeResult> {
  return req<TradeResult>('/api/trades/index', 'POST', input);
}

export interface TokenIndexResult {
  ok: boolean;
  id: string;
  onchainMint: string;
  provenance: 'onchain';
  realSol: number;
  complete: boolean;
}

export async function indexToken(input: {
  name: string;
  ticker: string;
  emoji: string;
  creator: string;
  mint: string;
  signature: string;
}): Promise<TokenIndexResult> {
  return req<TokenIndexResult>('/api/tokens/index', 'POST', input);
}

// ---- social ----
export async function fetchComments(tokenId: string): Promise<CommentItem[]> {
  return req<CommentItem[]>(`/api/tokens/${tokenId}/comments`);
}
export async function postComment(tokenId: string, wallet: string, text: string): Promise<XpResult> {
  return req<XpResult>(`/api/tokens/${tokenId}/comments`, 'POST', { wallet, text });
}
export async function likeToken(tokenId: string, wallet: string): Promise<{ liked: boolean } & XpResult> {
  return req<{ liked: boolean } & XpResult>(`/api/tokens/${tokenId}/like`, 'POST', { wallet });
}

// ---- AI agents ----
export async function genLore(tokenId: string): Promise<{ lore: string }> {
  return req<{ lore: string }>(`/api/tokens/${tokenId}/lore`, 'POST', {}, 30000);
}
export async function genRisk(tokenId: string): Promise<{ score: number; flag: string }> {
  return req<{ score: number; flag: string }>(`/api/tokens/${tokenId}/risk`, 'POST', {}, 30000);
}

// ---- profiles / quests / leaderboard ----
export async function fetchProfile(wallet: string, ref?: string | null): Promise<Profile | null> {
  try {
    return await req<Profile>(`/api/profile/${wallet}${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`);
  } catch {
    return null;
  }
}
export interface CheckinResult { already?: boolean; streak: number; multiplier?: number; xpGained?: number }
export async function checkin(wallet: string): Promise<CheckinResult | null> {
  try {
    return await req<CheckinResult>(`/api/profile/${wallet}/checkin`, 'POST');
  } catch {
    return null;
  }
}
export async function fetchQuests(wallet?: string): Promise<{ data: Quest[]; live: boolean }> {
  try {
    return { data: await req<Quest[]>(`/api/quests${wallet ? `?wallet=${wallet}` : ''}`), live: true };
  } catch {
    return { data: QUESTS, live: false };
  }
}
export async function fetchLeaderboard(): Promise<{ data: Trader[]; live: boolean }> {
  try {
    return { data: await req<Trader[]>('/api/leaderboard'), live: true };
  } catch {
    return { data: LEADERBOARD, live: false };
  }
}
