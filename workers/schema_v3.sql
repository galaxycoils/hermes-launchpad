-- Hermes Launchpad D1 schema v3: on-chain integration support
-- Adds signature column for trade deduplication and source tracking

-- Add signature column to trades table for on-chain deduplication
ALTER TABLE trades ADD COLUMN signature TEXT;
ALTER TABLE trades ADD COLUMN source TEXT DEFAULT 'demo';

-- Create unique index on signature for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_trades_signature ON trades(signature) WHERE signature IS NOT NULL;

-- Ensure onchain_mint is unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_tokens_onchain_mint ON tokens(onchain_mint) WHERE onchain_mint IS NOT NULL;