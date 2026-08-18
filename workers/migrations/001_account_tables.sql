-- Hermes Launchpad Account Tables Migration
-- Apply with: npx wrangler d1 execute hermes-launchpad-db --local --file workers/migrations/001_account_tables.sql
-- Apply remote: npx wrangler d1 execute hermes-launchpad-db --remote --file workers/migrations/001_account_tables.sql

-- Sessions table: tracks signed-message sessions for wallet-based auth
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  wallet TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- API Keys table: user-managed API keys for bot access
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  name TEXT,
  scopes TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  revoked INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);

-- Notification Preferences table: per-user notification toggles
CREATE TABLE IF NOT EXISTS notification_prefs (
  user_id TEXT PRIMARY KEY,
  push_enabled INTEGER DEFAULT 0,
  email_enabled INTEGER DEFAULT 0,
  in_app_enabled INTEGER DEFAULT 1,
  trade_confirmed INTEGER DEFAULT 1,
  quest_complete INTEGER DEFAULT 1,
  graduation INTEGER DEFAULT 1,
  referral_signup INTEGER DEFAULT 1,
  updated_at INTEGER NOT NULL
);