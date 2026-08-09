# Hermes Launchpad — Deployment Guide

## Architecture

```
Browser ──► Cloudflare Pages (hermes-launchpad.pages.dev)   [static frontend]
      ──► Cloudflare Worker hermes-api (hermes-api.tahamtandariush.workers.dev)
            ├── D1 (hermes-launchpad-db) — token index, trades, comments, likes,
            │   profiles, XP, quests, streaks, positions
            └── Workers AI (@cf/meta/llama-3.1-8b-instruct) — The Bard (lore) / The Oracle (risk)
      ──► Solana devnet (program: 9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz)
            └── On-chain: create_token, buy, sell, migrate
```

All trading runs on-chain via the Anchor program. The Worker is an indexer, not a ledger.

**Status (2026-08-09):** WU-00..WU-05b complete and merged to `main`; public devnet preview is live; CI PR gate verified. The fee wallet is funded for live devnet verification; create → buy → sell Explorer evidence is pending. Migration: ready at 85 SOL curve lock. Raydium CPMM pool creation is pending provisioned devnet amm_config (currently unprovisioned). Devnet only. No mainnet claim.

## IDs

| Thing | Value |
|---|---|
| Cloudflare account | `a55a43856c7029505b79300ec82f1629` |
| Pages project | `hermes-launchpad` → https://hermes-launchpad.pages.dev |
| API worker | `hermes-api` → https://hermes-api.tahamtandariush.workers.dev |
| D1 database | `hermes-launchpad-db` id `afa984c4-30e5-4f47-afce-a401ee2df098` |
| Anchor program ID | `9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz` (devnet, keypair backed up) |
| Config PDA | `9Sv1kApQK428EUueU7dR9mTPqKqNR7dxkBmwtZuHDTkr` |
| Fee wallet | `GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a` |

## Frontend deploy (Pages, git-connected)

The Pages project builds from the `main` branch of `galaxycoils/hermes-launchpad`:

- Build command: `npm run build`
- Output dir: `dist`
- `public/_worker.js` ships into the output and provides the `/rpc` devnet proxy.

Push to `main` → Cloudflare builds & deploys automatically.

Set Cloudflare Pages environment variables:
- `VITE_PROGRAM_ID=9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz`
- `VITE_SOLANA_RPC=https://devnet.rpcpool.com`
- `VITE_API_BASE=https://hermes-api.tahamtandariush.workers.dev`
- `VITE_FEE_WALLET=GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a`
- `VITE_GRADUATION_SOL=85`
- `VITE_ALLOW_OFFCHAIN_TRADES=false`

## API worker deploy

```bash
cd workers
npx wrangler deploy        # wrangler.toml has the D1 + AI bindings + vars
```

Worker environment variables (in `wrangler.toml` `[vars]`):
- `PROGRAM_ID=9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz`
- `CLUSTER=devnet`
- `GRADUATION_SOL=85`
- `REQUIRE_SIGNED_TRADES=true`

## D1 schema / seeds

```bash
cd workers
npx wrangler d1 execute hermes-launchpad-db --remote --file=schema.sql
# For an existing pre-v3 database, apply schema_v3.sql once before verification.
```

## Curve parameters (shared by Worker / Frontend / on-chain)

- Virtual reserves: `V_SOL0 = 30 SOL`, `V_TOK0 = 1.073B tokens`, `K = 3.219e10`
- Supply 1B, fee 0.5% on-chain (0.25% platform + 0.25% creator)
- Graduation at 85 SOL raised
- Anti-whale: max 10% of virtual reserves per trade (demo); 50% cap (on-chain)
- Buy: `eff = solIn × 0.993; tokOut = vt × eff / (vs + eff)`
- Sell: `gross = vs × tokIn / (vt + tokIn); net = gross × 0.993`

## On-chain program deploy (devnet)

```bash
# Prerequisites
solana config set --url https://api.devnet.solana.com

# Generate and BACKUP keypair OUTSIDE any sandbox
solana-keygen new -o programs/hermes-curve/target/deploy/hermes_curve-keypair.json --no-bip39-passphrase
# Save the seed phrase to encrypted offline backup!

# Update declare_id! in programs/hermes-curve/programs/hermes-curve/src/lib.rs
# Update Anchor.toml [programs.devnet] to match

# Fund deployer (may need multiple airdrops due to rate limits)
solana airdrop 2

# Build & deploy
cd programs/hermes-curve
anchor build
anchor deploy --provider.cluster devnet

# Initialize config (one-time)
# See lib.rs Initialize instruction: admin, fee_wallet, migration_authority, migration_threshold_lamports
# Run via small script or anchor test
```

## Verify

```bash
solana program show 9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz --url devnet
```

## Keypair backup policy

- Keypair lives at `programs/hermes-curve/target/deploy/hermes_curve-keypair.json`
- **Copy to encrypted offline storage immediately** (e.g., 1Password, encrypted USB, paper)
- Add `*-keypair.json` to `.gitignore` (already present)
- Never commit private keys to git
- Document recovery: operator must restore keypair to same path for future upgrades
- Use `npm run program:restore <backup-path>` to restore from backup

## Local development

```bash
# Frontend
cp .env.example .env
npm install
npm run dev

# Worker (local with wrangler)
cd workers
cp .dev.vars.example .dev.vars
# Edit .dev.vars with local values
wrangler dev --local

# Program (localnet)
cd programs/hermes-curve
solana-test-validator --reset
anchor test
```

## Free-tier notes

Everything runs on $0: GitHub free, Cloudflare Pages/Workers/D1/Workers AI free tiers, Solana devnet. Workers AI free tier includes 10k neurons/day — the Bard/Oracle endpoints are rate-limited server-side accordingly.