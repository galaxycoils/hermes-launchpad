-- Hermes Launchpad v2 Foundation Migration
-- Apply with: npx wrangler d1 execute hermes-launchpad-db --local --file workers/migrations/002_v2_foundation.sql
-- Apply remote: npx wrangler d1 execute hermes-launchpad-db --remote --file workers/migrations/002_v2_foundation.sql
--
-- NOTE: This migration extends the v1 schema (001_account_tables.sql) with v2 viral
-- features. It assumes the canonical schema (workers/schema.sql) is already applied.
-- Columns already present in the canonical schema (referred_by, ref_code, trades, pnl)
-- are NOT re-added here — see schema.sql for the full current state.

-- 1. Extend existing profiles table with new v2 columns
ALTER TABLE profiles ADD COLUMN display_name TEXT;
ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN rank TEXT DEFAULT 'novice';
ALTER TABLE profiles ADD COLUMN win_rate REAL DEFAULT 0.0;

CREATE INDEX IF NOT EXISTS idx_profiles_referral ON profiles(ref_code);
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(xp DESC);

-- 2. Achievements table (new)
CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  unlocked_at TEXT DEFAULT (datetime('now')),
  token_id TEXT,
  UNIQUE(wallet, badge_id, token_id)
);

CREATE INDEX IF NOT EXISTS idx_achievements_wallet ON achievements(wallet);
CREATE INDEX IF NOT EXISTS idx_achievements_badge ON achievements(badge_id);

-- 3. Follows table (new)
CREATE TABLE IF NOT EXISTS follows (
  follower TEXT NOT NULL,
  following TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (follower, following)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following);

-- 4. Referrals table (new)
CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer TEXT NOT NULL,
  referee TEXT NOT NULL UNIQUE,
  total_fees_generated REAL DEFAULT 0.0,
  total_credits REAL DEFAULT 0.0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer);

-- 5. Push subscriptions table (new)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_wallet ON push_subscriptions(wallet);

-- 6. Extend existing comments table for chat
ALTER TABLE comments ADD COLUMN reply_to INTEGER;
ALTER TABLE comments ADD COLUMN reactions TEXT DEFAULT '[]';

-- 7. Create leaderboard snapshot table for history
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet TEXT NOT NULL,
  xp INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  snapshot_date TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_date ON leaderboard_snapshots(snapshot_date, rank);
