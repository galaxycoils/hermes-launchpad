export interface Token {
  id: string;
  name: string;
  ticker: string;
  emoji: string;
  lore: string;
  creator: string;
  marketCap: number;
  price: number;
  change24h: number;
  volume24h: number;
  holders: number;
  curveProgress: number; // 0-100 % to migration at $69,420
  replies: number;
  riskScore: number; // 0-100 (AI analyst)
  sentiment: 'bullish' | 'neutral' | 'bearish';
  chain: 'SOL' | 'BASE';
  spark: number[]; // sparkline points
  createdMinsAgo: number;
  onchainMint?: string; // set when created on devnet for real
  likes?: number;
  complete?: boolean; // graduated / migrated
  realSol?: number;   // SOL raised on the curve
  priceSol?: number;  // SOL per token
  riskFlag?: string;  // The Oracle's one-line verdict (persisted)
  likedByMe?: boolean; // set when fetched with ?wallet=
}

export interface ReferralStats {
  code: string;
  invites: number;
  xpEarned: number;
  xpPerInvite: number;
  referred: { name: string; ts: number }[];
}

export const MIGRATION_TARGET = 69420;

export const TOKENS: Token[] = [
  {
    id: 'antigrav', name: 'Antigravity Pump', ticker: 'AGPUMP', emoji: '🛸',
    lore: 'The coin that forgot gravity exists. Born when a dev sneezed on the launch button.',
    creator: '0xHermes', marketCap: 58230, price: 0.00058, change24h: 312.4,
    volume24h: 182000, holders: 4211, curveProgress: 84, replies: 1204, riskScore: 22,
    sentiment: 'bullish', chain: 'SOL', spark: [52, 55, 49, 58, 54, 61, 57, 64, 60, 67, 63, 70, 66, 72, 69, 75, 71, 78, 74, 80, 76, 82, 79, 84], createdMinsAgo: 47,
  },
  {
    id: 'mooncat', name: 'Moon Cat', ticker: 'MCAT', emoji: '🐱',
    lore: 'A cat. On the moon. It has a tiny helmet. That is the entire thesis.',
    creator: 'lunarpaw', marketCap: 44100, price: 0.00044, change24h: 128.9,
    volume24h: 96400, holders: 2877, curveProgress: 64, replies: 863, riskScore: 31,
    sentiment: 'bullish', chain: 'SOL', spark: [55, 52, 57, 53, 59, 56, 61, 58, 63, 60, 65, 62, 67, 64, 69, 66, 71, 68, 73, 70, 75, 72, 77, 74], createdMinsAgo: 122,
  },
  {
    id: 'bogdanoff', name: 'Bog Coin', ticker: 'BOG', emoji: '🧙',
    lore: 'He bought? Dump eet. He sold? Pump eet. The council decides your candles.',
    creator: 'igorb', marketCap: 38800, price: 0.00039, change24h: -14.2,
    volume24h: 55300, holders: 1930, curveProgress: 56, replies: 420, riskScore: 58,
    sentiment: 'bearish', chain: 'BASE', spark: [67, 63, 68, 62, 66, 60, 64, 58, 62, 56, 60, 54, 58, 52, 56, 50, 54, 48, 52, 46, 50, 44, 48, 42], createdMinsAgo: 240,
  },
  {
    id: 'toaster', name: 'Brave Little Toaster', ticker: 'TOAST', emoji: '🍞',
    lore: 'Every buy makes the toast browner. At migration we achieve golden brown.',
    creator: 'kitchensink', marketCap: 29500, price: 0.0003, change24h: 66.6,
    volume24h: 41200, holders: 1455, curveProgress: 43, replies: 512, riskScore: 27,
    sentiment: 'bullish', chain: 'SOL', spark: [53, 57, 52, 58, 54, 59, 55, 60, 56, 61, 57, 62, 58, 63, 59, 64, 60, 65, 61, 66, 62, 67, 63, 68], createdMinsAgo: 310,
  },
  {
    id: 'npc', name: 'NPC Token', ticker: 'NPC', emoji: '🧍',
    lore: 'It does nothing. It says nothing. It just stands there gaining value.',
    creator: 'grayman', marketCap: 21800, price: 0.00022, change24h: 8.1,
    volume24h: 22800, holders: 980, curveProgress: 31, replies: 233, riskScore: 40,
    sentiment: 'neutral', chain: 'BASE', spark: [59, 55, 60, 56, 61, 55, 60, 56, 61, 57, 60, 56, 61, 57, 62, 56, 61, 57, 62, 58, 61, 57, 62, 58], createdMinsAgo: 505,
  },
  {
    id: 'shrimp', name: 'Shrimp Fried Rice', ticker: 'SFR', emoji: '🍤',
    lore: 'Wok-hei infused liquidity. Certified 100% msg-free and rug-free* (*not certified).',
    creator: 'unclewok', marketCap: 15400, price: 0.00015, change24h: 44.4,
    volume24h: 18900, holders: 742, curveProgress: 22, replies: 198, riskScore: 35,
    sentiment: 'bullish', chain: 'SOL', spark: [57, 53, 58, 54, 59, 55, 60, 56, 61, 57, 62, 58, 63, 59, 64, 60, 65, 61, 66, 62, 67, 63, 68, 64], createdMinsAgo: 640,
  },
  {
    id: 'goblin', name: 'Goblin Mode', ticker: 'GOBLIN', emoji: '👺',
    lore: 'No roadmap. No utility. Only goblin. You were warned in the name itself.',
    creator: 'cavedweller', marketCap: 9800, price: 0.000098, change24h: -32.0,
    volume24h: 9700, holders: 411, curveProgress: 14, replies: 97, riskScore: 74,
    sentiment: 'bearish', chain: 'SOL', spark: [71, 67, 72, 66, 70, 64, 68, 62, 66, 60, 64, 58, 62, 56, 60, 54, 58, 52, 56, 50, 54, 48, 52, 46], createdMinsAgo: 880,
  },
  {
    id: 'doomer', name: 'Doomer Juice', ticker: 'DOOM', emoji: '🥤',
    lore: 'Tastes like red candles and 3am chart-watching. Surprisingly refreshing.',
    creator: 'nightowl', marketCap: 6200, price: 0.000062, change24h: 12.7,
    volume24h: 5400, holders: 268, curveProgress: 9, replies: 64, riskScore: 49,
    sentiment: 'neutral', chain: 'BASE', spark: [53, 49, 54, 50, 55, 51, 54, 50, 55, 51, 56, 50, 55, 51, 56, 52, 55, 51, 56, 52, 57, 51, 56, 52], createdMinsAgo: 1120,
  },
];

export interface Quest {
  id: string;
  title: string;
  xp: number;
  progress: number;
  total: number;
  done?: boolean;
}

export const QUESTS: Quest[] = [
  { id: 'q1', title: 'Trade 3 tokens today', xp: 500, progress: 1, total: 3 },
  { id: 'q2', title: 'Create your first token', xp: 1000, progress: 0, total: 1 },
  { id: 'q3', title: 'Refer a degen friend', xp: 750, progress: 0, total: 1 },
  { id: 'q4', title: 'Hold a token for 24h', xp: 400, progress: 0, total: 1 },
];

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

export const LEADERBOARD: Trader[] = [
  { rank: 1, name: '0xWhaleWatcher', pnl: 48210, trades: 342, winRate: 68, xp: 98400 },
  { rank: 2, name: 'degensarah', pnl: 31900, trades: 511, winRate: 61, xp: 87200 },
  { rank: 3, name: 'PaperHandzPhil', pnl: 27450, trades: 198, winRate: 72, xp: 76800 },
  { rank: 4, name: 'solsnipe', pnl: 19870, trades: 623, winRate: 55, xp: 71100 },
  { rank: 5, name: 'moonfarmer', pnl: 15420, trades: 287, winRate: 59, xp: 64300 },
  { rank: 6, name: 'cointosscarl', pnl: 11200, trades: 154, winRate: 64, xp: 52800 },
];

export const fmtUsd = (n: number): string =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000 ? `$${(n / 1_000).toFixed(1)}K`
    : `$${n.toFixed(0)}`;

export const fmtAgo = (mins: number): string =>
  mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
