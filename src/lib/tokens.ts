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
}

export const MIGRATION_TARGET = 69420;

const spark = (seed: number, n = 24): number[] => {
  const out: number[] = [];
  let v = 50 + (seed % 20);
  for (let i = 0; i < n; i++) {
    v += Math.sin(seed * 7 + i * 1.7) * 8 + ((seed * (i + 3)) % 11) - 5;
    v = Math.max(5, Math.min(95, v));
    out.push(v);
  }
  return out;
};

export const TOKENS: Token[] = [
  {
    id: 'antigrav', name: 'Antigravity Pump', ticker: 'AGPUMP', emoji: '🛸',
    lore: 'The coin that forgot gravity exists. Born when a dev sneezed on the launch button.',
    creator: '0xHermes', marketCap: 58230, price: 0.00058, change24h: 312.4,
    volume24h: 182000, holders: 4211, curveProgress: 84, replies: 1204, riskScore: 22,
    sentiment: 'bullish', chain: 'SOL', spark: spark(3), createdMinsAgo: 47,
  },
  {
    id: 'mooncat', name: 'Moon Cat', ticker: 'MCAT', emoji: '🐱',
    lore: 'A cat. On the moon. It has a tiny helmet. That is the entire thesis.',
    creator: 'lunarpaw', marketCap: 44100, price: 0.00044, change24h: 128.9,
    volume24h: 96400, holders: 2877, curveProgress: 64, replies: 863, riskScore: 31,
    sentiment: 'bullish', chain: 'SOL', spark: spark(11), createdMinsAgo: 122,
  },
  {
    id: 'bogdanoff', name: 'Bog Coin', ticker: 'BOG', emoji: '🧙',
    lore: 'He bought? Dump eet. He sold? Pump eet. The council decides your candles.',
    creator: 'igorb', marketCap: 38800, price: 0.00039, change24h: -14.2,
    volume24h: 55300, holders: 1930, curveProgress: 56, replies: 420, riskScore: 58,
    sentiment: 'bearish', chain: 'BASE', spark: spark(17), createdMinsAgo: 240,
  },
  {
    id: 'toaster', name: 'Brave Little Toaster', ticker: 'TOAST', emoji: '🍞',
    lore: 'Every buy makes the toast browner. At migration we achieve golden brown.',
    creator: 'kitchensink', marketCap: 29500, price: 0.0003, change24h: 66.6,
    volume24h: 41200, holders: 1455, curveProgress: 43, replies: 512, riskScore: 27,
    sentiment: 'bullish', chain: 'SOL', spark: spark(23), createdMinsAgo: 310,
  },
  {
    id: 'npc', name: 'NPC Token', ticker: 'NPC', emoji: '🧍',
    lore: 'It does nothing. It says nothing. It just stands there gaining value.',
    creator: 'grayman', marketCap: 21800, price: 0.00022, change24h: 8.1,
    volume24h: 22800, holders: 980, curveProgress: 31, replies: 233, riskScore: 40,
    sentiment: 'neutral', chain: 'BASE', spark: spark(29), createdMinsAgo: 505,
  },
  {
    id: 'shrimp', name: 'Shrimp Fried Rice', ticker: 'SFR', emoji: '🍤',
    lore: 'Wok-hei infused liquidity. Certified 100% msg-free and rug-free* (*not certified).',
    creator: 'unclewok', marketCap: 15400, price: 0.00015, change24h: 44.4,
    volume24h: 18900, holders: 742, curveProgress: 22, replies: 198, riskScore: 35,
    sentiment: 'bullish', chain: 'SOL', spark: spark(37), createdMinsAgo: 640,
  },
  {
    id: 'goblin', name: 'Goblin Mode', ticker: 'GOBLIN', emoji: '👺',
    lore: 'No roadmap. No utility. Only goblin. You were warned in the name itself.',
    creator: 'cavedweller', marketCap: 9800, price: 0.000098, change24h: -32.0,
    volume24h: 9700, holders: 411, curveProgress: 14, replies: 97, riskScore: 74,
    sentiment: 'bearish', chain: 'SOL', spark: spark(41), createdMinsAgo: 880,
  },
  {
    id: 'doomer', name: 'Doomer Juice', ticker: 'DOOM', emoji: '🥤',
    lore: 'Tastes like red candles and 3am chart-watching. Surprisingly refreshing.',
    creator: 'nightowl', marketCap: 6200, price: 0.000062, change24h: 12.7,
    volume24h: 5400, holders: 268, curveProgress: 9, replies: 64, riskScore: 49,
    sentiment: 'neutral', chain: 'BASE', spark: spark(53), createdMinsAgo: 1120,
  },
];

export interface Quest {
  id: string;
  title: string;
  xp: number;
  progress: number;
  total: number;
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
