import { TOKENS, QUESTS, LEADERBOARD } from './tokens';
import type { Token, Quest, Trader } from './tokens';

const API_BASE = 'https://hermes-api.tahamtandariush.workers.dev';
const TIMEOUT_MS = 4000;

async function get<T>(path: string, fallback: T): Promise<{ data: T; live: boolean }> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(`${API_BASE}${path}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { data: (await res.json()) as T, live: true };
  } catch {
    return { data: fallback, live: false };
  }
}

export const fetchTokens = () => get<Token[]>('/api/tokens', TOKENS);
export const fetchQuests = () => get<Quest[]>('/api/quests', QUESTS);
export const fetchLeaderboard = () => get<Trader[]>('/api/leaderboard', LEADERBOARD);
