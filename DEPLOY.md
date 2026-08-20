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

**Status (2026-08-18):** Public devnet preview is live. Four on-chain tokens indexed (SMOKE, HNQ, CX, FJEWS). Migration is ready at the 85 SOL curve lock; Raydium CPMM pool creation remains pending an unprovisioned devnet `amm_config`. Devnet only. No mainnet claim. Worker indexing proven: `SOLANA_RPC` wrangler secret set to authenticated RPC; `POST /api/trades/index` returns `{"ok":true}` for live buy+sell signatures.

## Tester howto (devnet preview)

1. **Wallet:** Install Phantom or Solflare. Switch to **Solana Devnet** (not mainnet).
2. **Fund:** Airdrop from [Solana faucet](https://developers.solana.com/docs/guides/explorer/hello-solana) or claim via `solana airdrop 1` (CLI). Fee wallet `GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a` holds ~16 SOL on devnet.
3. **Browse:** Open [hermes-launchpad.pages.dev](https://hermes-launchpad.pages.dev). You should see the yellow **Devnet preview** banner.
4. **Create:** Hit "Launch Token", fill name/ticker/emoji, sign the tx. Token appears with **On-chain** badge if indexed (may take a moment).
5. **Trade:** Pick an on-chain token (SMOKE/HNQ/CX), hit Buy or Sell, confirm in wallet. Trade indexes automatically.
6. **Verify:** Check Explorer links for tx signatures. Curl `POST /api/trades/index` to confirm worker indexed the trade.
7. **Do NOT use a mainnet wallet** — devnet tokens have no real value.

## Devnet smoke proof

The create → buy → sell path completed successfully on Solana devnet for mint [`HnqNovn7kkJbCbwxMYuxZDgGQoMAbmnbLxpFooCwnKbJ`](https://explorer.solana.com/address/HnqNovn7kkJbCbwxMYuxZDgGQoMAbmnbLxpFooCwnKbJ?cluster=devnet):

- Create HNQ: [`5dyWsG1VpGz6QzmGUfpyZTMAAe9WghtyiXeNk6jJBwhsYJ5A8LQH3QsiybAo8zB8L3ctCxYEqsXS2vwxAiXwcxT9`](https://explorer.solana.com/tx/5dyWsG1VpGz6QzmGUfpyZTMAAe9WghtyiXeNk6jJBwhsYJ5A8LQH3QsiybAo8zB8L3ctCxYEqsXS2vwxAiXwcxT9?cluster=devnet)
- Buy HNQ: [`4vbiH8ChvaM2b71Dch4xuNWHviVsz4jXttdqWkDThWab1NRVDmR9pX4oVw1PbLoTy3s5K3LghHqqcJUV4LLsMvKa`](https://explorer.solana.com/tx/4vbiH8ChvaM2b71Dch4xuNWHviVsz4jXttdqWkDThWab1NRVDmR9pX4oVw1PbLoTy3s5K3LghHqqcJUV4LLsMvKa?cluster=devnet)
- Sell HNQ: [`3PAv8dYYnrTUBayMbPkcnURvXn6HA6okjLv8UHeFENxyb96K4L2dEtchmx2ZFmdYfnttuYhLiqSDTTLkXJJzBqFY`](https://explorer.solana.com/tx/3PAv8dYYnrTUBayMbPkcnURvXn6HA6okjLv8UHeFENxyb96K4L2dEtchmx2ZFmdYfnttuYhLiqSDTTLkXJJzBqFY?cluster=devnet)

Worker indexing is now proven live: `SOLANA_RPC` wrangler secret configured with an authenticated Cloudflare-compatible RPC; `POST /api/trades/index` returns `{"ok":true}` for both buy and sell signatures. SMOKE trade proof: buy [`XLBNHF…q98s`](https://explorer.solana.com/tx/XLBNHFCyMPUQ4zqJ8tiL5DTdnbBeaWQ97GaLjiwhQMuRcYC2Xhj4itRhE85W8hhZjdR5t3oPRQXW88ZUDRKq98s?cluster=devnet) → sell [`39Myku…Q5YfR`](https://explorer.solana.com/tx/39MykuF1uVs9ksZYoYd9jdWFo6HHqrVV9gS1d3LkZevcbVvM3vpBUb7KV5V378yZANsTExT4cUuBBA7NLCrQ5YfR?cluster=devnet). Additionally two more tokens created and indexed on-chain: SMOKE (`CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f`) and CX (`8fXmJGNZQkBYHTaDHof1zgiEiYR1uGmoTLqEj6qAS8Db`) and FJEWS (`BTkZnXxgrrquqLKTZj8kje1YnuEyJiqGV7Ec2NigCkCS`). SMOKE/CX/FJEWS create transaction signatures not captured in this session; mints verified non-null via API.

**Latest SMOKE trade (2026-08-20):** buy [`3K5zCqp78mCQiCskVeHq4wAvCMzsTaYKNztoMg5N9SZVKhCTqMsX22QuAUqvdKHf2NWpdwq6bNuAGwZryXABGiEu`](https://explorer.solana.com/tx/3K5zCqp78mCQiCskVeHq4wAvCMzsTaYKNztoMg5N9SZVKhCTqMsX22QuAUqvdKHf2NWpdwq6bNuAGwZryXABGiEu?cluster=devnet) → sell [`5qEimVN6K3ekvAvPuLE8KYq6duXeSfee1bER3Q8vr6p45FQQmGYdnzPeKYq6H7gkJpPtjGXhxQopLpAi9K2DrtLC`](https://explorer.solana.com/tx/5qEimVN6K3ekvAvPuLE8KYq6duXeSfee1bER3Q8vr6p45FQQmGYdnzPeKYq6H7gkJpPtjGXhxQopLpAi9K2DrtLC?cluster=devnet). Both indexed via `POST /api/trades/index` returning `{"ok":true}`.

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

`schema.sql` is canonical for fresh databases. Never re-run it against a populated remote database if a change can overwrite seed rows. Apply additive live changes only with explicit `ALTER TABLE ... ADD COLUMN` statements, then verify with `PRAGMA table_info(<table>)`.

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