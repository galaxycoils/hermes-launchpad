-- Hermes Launchpad D1 schema v2: shared curve engine state + social/XP layer.
-- Curve math mirrors programs/hermes-curve (constant product w/ virtual reserves).

CREATE TABLE IF NOT EXISTS tokens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ticker TEXT NOT NULL,
  emoji TEXT DEFAULT '🪙',
  lore TEXT DEFAULT '',
  creator TEXT NOT NULL,
  chain TEXT DEFAULT 'SOL',
  -- curve state (raw units: lamports / token base units w/ 6 decimals)
  virtual_sol INTEGER NOT NULL DEFAULT 30000000000,      -- 30 SOL
  virtual_tokens INTEGER NOT NULL DEFAULT 1073000000000000, -- 1.073B tokens
  real_sol INTEGER NOT NULL DEFAULT 0,
  real_tokens INTEGER NOT NULL DEFAULT 0,
  complete INTEGER NOT NULL DEFAULT 0,                    -- migrated/graduated
  -- display stats (derived but cached for cheap reads)
  price REAL NOT NULL DEFAULT 0.0000279,                  -- SOL per token
  market_cap REAL NOT NULL DEFAULT 0,                     -- USD
  volume_24h REAL NOT NULL DEFAULT 0,                     -- USD
  holders INTEGER NOT NULL DEFAULT 1,
  change_24h REAL NOT NULL DEFAULT 0,
  risk_score INTEGER NOT NULL DEFAULT 50,
  sentiment TEXT DEFAULT 'neutral',
  spark TEXT DEFAULT '[]',
  replies INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  onchain_mint TEXT,
  created_at INTEGER NOT NULL                             -- unix seconds
);

CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_id TEXT NOT NULL REFERENCES tokens(id),
  wallet TEXT NOT NULL,
  side TEXT NOT NULL,               -- 'buy' | 'sell'
  sol_amount REAL NOT NULL,         -- SOL
  token_amount REAL NOT NULL,       -- whole tokens
  price REAL NOT NULL,              -- SOL/token at execution
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_trades_ts ON trades(ts DESC);
CREATE INDEX IF NOT EXISTS idx_trades_token ON trades(token_id, ts DESC);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_id TEXT NOT NULL REFERENCES tokens(id),
  wallet TEXT NOT NULL,
  text TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_comments_token ON comments(token_id, ts DESC);

CREATE TABLE IF NOT EXISTS likes (
  token_id TEXT NOT NULL,
  wallet TEXT NOT NULL,
  ts INTEGER NOT NULL,
  PRIMARY KEY (token_id, wallet)
);

CREATE TABLE IF NOT EXISTS profiles (
  wallet TEXT PRIMARY KEY,          -- solana pubkey or anon-xxxx local id
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_active_day TEXT,             -- YYYY-MM-DD (UTC)
  ref_code TEXT NOT NULL,
  referred_by TEXT,
  trades INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,  -- sells executed above avg buy price (approx)
  pnl REAL NOT NULL DEFAULT 0,      -- USD, simulated
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS quest_progress (
  wallet TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  done INTEGER NOT NULL DEFAULT 0,
  day TEXT NOT NULL,                -- quests reset daily
  PRIMARY KEY (wallet, quest_id, day)
);

CREATE TABLE IF NOT EXISTS positions (
  wallet TEXT NOT NULL,
  token_id TEXT NOT NULL,
  tokens REAL NOT NULL DEFAULT 0,   -- whole tokens held (sim)
  avg_cost REAL NOT NULL DEFAULT 0, -- SOL per token avg
  PRIMARY KEY (wallet, token_id)
);
