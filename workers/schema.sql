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
  emoji TEXT,
  lore TEXT,
  creator TEXT,
  chain TEXT,
  onchain_mint TEXT,
  real_sol REAL,
  price_sol REAL,
  price_usd REAL,
  volume_24h REAL,
  holders INTEGER,
  curve_progress INTEGER,
  replies INTEGER,
  likes INTEGER,
  risk_score INTEGER,
  risk_flag TEXT,
  sentiment TEXT,
  spark TEXT,
  complete INTEGER DEFAULT 0,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS trades (
  id TEXT PRIMARY KEY,
  token_id TEXT NOT NULL,
  wallet TEXT NOT NULL,
  side TEXT NOT NULL,
  sol_amount REAL,
  token_amount REAL,
  price REAL,
  pnl REAL,
  signature TEXT,
  source TEXT DEFAULT 'demo',
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  token_id TEXT NOT NULL,
  wallet TEXT,
  body TEXT NOT NULL,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS likes (
  token_id TEXT NOT NULL,
  wallet TEXT NOT NULL,
  created_at INTEGER,
  PRIMARY KEY (token_id, wallet)
);

CREATE TABLE IF NOT EXISTS profiles (
  wallet TEXT PRIMARY KEY,
  handle TEXT,
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_active INTEGER,
  ref_code TEXT,
  referred_by TEXT
);

CREATE TABLE IF NOT EXISTS positions (
  wallet TEXT NOT NULL,
  token_id TEXT NOT NULL,
  amount REAL,
  avg_price REAL,
  PRIMARY KEY (wallet, token_id)
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
