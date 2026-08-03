-- Hermes Launchpad D1 schema + seed. Apply with:
--   npx wrangler d1 execute hermes-launchpad-db --remote --file=workers/schema.sql

CREATE TABLE IF NOT EXISTS tokens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ticker TEXT NOT NULL,
  emoji TEXT,
  lore TEXT,
  creator TEXT,
  market_cap REAL,
  price REAL,
  change_24h REAL,
  volume_24h REAL,
  holders INTEGER,
  curve_progress INTEGER,
  replies INTEGER,
  risk_score INTEGER,
  sentiment TEXT,
  chain TEXT,
  spark TEXT,
  created_mins_ago INTEGER
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

-- Token seed rows live in the live database; re-seed via the Cloudflare
-- dashboard D1 console or `wrangler d1 execute` if you recreate the DB.
-- See src/lib/tokens.ts for the canonical demo dataset.
