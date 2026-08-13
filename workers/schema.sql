-- Hermes Launchpad D1 canonical schema (v3 + on-chain integration).
-- Apply with: npx wrangler d1 execute hermes-launchpad-db --remote --file=workers/schema.sql
-- Apply locally: npx wrangler d1 execute hermes-launchpad-db --local --file=workers/schema.sql
--
-- NOTE: this file is the single source of truth. The worker (workers/worker.js) reads
-- the columns below; keep them in sync. Previously `schema_v3.sql` was an ALTER migration
-- that added onchain_mint/real_sol/complete/risk_flag/created_at/volume_24h — those are
-- now folded into this canonical CREATE so a fresh DB matches the live one.

CREATE TABLE IF NOT EXISTS tokens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ticker TEXT NOT NULL,
  emoji TEXT DEFAULT '🪙',
  lore TEXT DEFAULT '',
  creator TEXT NOT NULL,
  chain TEXT DEFAULT 'SOL',
  virtual_sol REAL NOT NULL DEFAULT 30,
  virtual_tokens REAL NOT NULL DEFAULT 1073000000,
  real_sol REAL NOT NULL DEFAULT 0,
  real_tokens REAL NOT NULL DEFAULT 0,
  complete INTEGER NOT NULL DEFAULT 0,
  price REAL NOT NULL DEFAULT 0.0000279,
  market_cap REAL NOT NULL DEFAULT 0,
  volume_24h REAL NOT NULL DEFAULT 0,
  holders INTEGER NOT NULL DEFAULT 1,
  change_24h REAL NOT NULL DEFAULT 0,
  risk_score INTEGER NOT NULL DEFAULT 50,
  sentiment TEXT DEFAULT 'neutral',
  spark TEXT DEFAULT '[]',
  replies INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  onchain_mint TEXT,
  created_at INTEGER NOT NULL,
  risk_flag TEXT
);

CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_id TEXT NOT NULL,
  wallet TEXT NOT NULL,
  side TEXT NOT NULL,
  sol_amount REAL NOT NULL,
  token_amount REAL NOT NULL,
  price REAL NOT NULL,
  ts INTEGER NOT NULL,
  signature TEXT,
  source TEXT DEFAULT 'demo'
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_id TEXT NOT NULL,
  wallet TEXT NOT NULL,
  text TEXT NOT NULL,
  ts INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS likes (
  token_id TEXT NOT NULL,
  wallet TEXT NOT NULL,
  ts INTEGER NOT NULL,
  PRIMARY KEY (token_id, wallet)
);

CREATE TABLE IF NOT EXISTS profiles (
  wallet TEXT PRIMARY KEY,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_active_day TEXT,
  ref_code TEXT NOT NULL,
  referred_by TEXT,
  trades INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  pnl REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS positions (
  wallet TEXT NOT NULL,
  token_id TEXT NOT NULL,
  tokens REAL NOT NULL DEFAULT 0,
  avg_cost REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (wallet, token_id)
);

CREATE TABLE IF NOT EXISTS quest_progress (
  wallet TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  done INTEGER NOT NULL DEFAULT 0,
  day TEXT NOT NULL,
  UNIQUE (wallet, quest_id, day)
);

CREATE TABLE IF NOT EXISTS quests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  xp INTEGER NOT NULL,
  progress INTEGER DEFAULT 0,
  total INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS leaderboard (
  rank INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  pnl REAL,
  trades INTEGER,
  win_rate INTEGER,
  xp INTEGER
);

-- Indexes for on-chain dedupe + lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_trades_signature ON trades(signature) WHERE signature IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tokens_onchain_mint ON tokens(onchain_mint) WHERE onchain_mint IS NOT NULL;

-- Demo seed (quests + leaderboard). Token seed rows live in the running DB;
-- the canonical demo dataset is in src/lib/tokens.ts (now empty by design — WU-05).
INSERT OR REPLACE INTO quests VALUES
('q1','Trade 3 tokens today',500,1,3),
('q2','Create your first token',1000,0,1),
('q3','Refer a degen friend',750,0,1),
('q4','Hold a token for 24h',400,0,1);

INSERT OR REPLACE INTO leaderboard VALUES
(1,'0xWhaleWatcher',48210,342,68,98400),
(2,'degensarah',31900,511,61,87200),
(3,'PaperHandzPhil',27450,198,72,76800),
(4,'solsnipe',19870,623,55,71100),
(5,'moonfarmer',15420,287,59,64300),
(6,'cointosscarl',11200,154,64,52800);
