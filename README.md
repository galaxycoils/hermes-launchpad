# 🛸 Hermes Launchpad

AI-native fair launches on Solana. Bonding curves you can verify on-chain. Lore and risk from agents — not influencers.

## Live

- **App (Devnet):** https://hermes-launchpad.pages.dev
- **API:** https://hermes-api.tahamtandariush.workers.dev/api/health

**Status (2026-08-18):** Public devnet preview is live. Three on-chain tokens indexed (SMOKE, HNQ, CX). Migration is ready at the 85 SOL curve lock. Raydium CPMM pool creation remains pending an unprovisioned devnet `amm_config`. Devnet only. No mainnet claim. Worker indexing proven via authenticated RPC (`SOLANA_RPC` wrangler secret).

**Devnet smoke (2026-08-18):** Four on-chain tokens created and indexed — SMOKE (`CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f`), HNQ (`HnqNovn7kkJbCbwxMYuxZDgGQoMAbmnbLxpFooCwnKbJ`), CX (`8fXmJGNZQkBYHTaDHof1zgiEiYR1uGmoTLqEj6qAS8Db`), FJEWS (`BTkZnXxgrrquqLKTZj8kje1YnuEyJiqGV7Ec2NigCkCS`). HNQ trade proof: buy [`4vbiH8…MvKa`](https://explorer.solana.com/tx/4vbiH8ChvaM2b71Dch4xuNWHviVsz4jXttdqWkDThWab1NRVDmR9pX4oVw1PbLoTy3s5K3LghHqqcJUV4LLsMvKa?cluster=devnet) → sell [`3PAv8d…BqFY`](https://explorer.solana.com/tx/3PAv8dYYnrTUBayMbPkcnURvXn6HA6okjLv8UHeFENxyb96K4L2dEtchmx2ZFmdYfnttuYhLiqSDTTLkXJJzBqFY?cluster=devnet). SMOKE trade proof: buy [`XLBNHF…q98s`](https://explorer.solana.com/tx/XLBNHFCyMPUQ4zqJ8tiL5DTdnbBeaWQ97GaLjiwhQMuRcYC2Xhj4itRhE85W8hhZjdR5t3oPRQXW88ZUDRKq98s?cluster=devnet) → sell [`39Myku…Q5YfR`](https://explorer.solana.com/tx/39MykuF1uVs9ksZYoYd9jdWFo6HHqrVV9gS1d3LkZevcbVvM3vpBUb7KV5V378yZANsTExT4cUuBBA7NLCrQ5YfR?cluster=devnet). Both trades indexed via `POST /api/trades/index` returning `{"ok":true}`. CX and FJEWS create signatures not independently captured in this session; mints verified non-null via API.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vite + React 19 + TypeScript + Tailwind (this repo, root) |
| Hosting | Cloudflare Pages (git build from `main`: `npm run build` → `dist`) |
| Backend | Cloudflare Worker `hermes-api` (`workers/worker.js`) |
| Database | Cloudflare D1 `hermes-launchpad-db` (`workers/schema.sql`, canonical; `schema_v3.sql` historical migration) |
| AI | Workers AI `@cf/meta/llama-3.1-8b-instruct` (The Bard / The Oracle) |
| Chain | Solana devnet Anchor program (`programs/hermes-curve`) — program ID: `9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz` |

## Architecture

**On-chain ledger (source of truth):**
- Token creation, buy, sell, migration via Anchor program
- Real signatures, real balances, verifiable on explorer

**Worker indexer (D1):**
- Token metadata cache (keyed by `onchain_mint`)
- Social layer: comments, likes, XP, quests, referrals
- Trade indexing via `POST /api/trades/index` (deduped on signature)
- AI agents: The Bard (lore), The Oracle (risk)

**Frontend:**
- `CreateTokenModal` → on-chain create + register to indexer
- `TokenModal` → on-chain buy/sell via wallet + index for XP
- Demo tokens (no `onchain_mint`) clearly badged; off-chain trades disabled by default

## Features

- On-chain token creation, buy, sell (Phantom/Solflare signed txs)
- Cryptographic identity — no spoofable wallet strings for XP/trades
- King of the Hill, live trade ticker, graduation at 85 SOL raised
- XP, levels, daily quests, streaks with 2x multiplier, referral links (+750 XP)
- Comments, likes, AI lore (The Bard), AI risk scores (The Oracle)
- Wallet connect (Phantom) or wallet-less anonymous identity (read-only)

## Dev

```bash
npm install
npm run dev
```

## Deploy

See **DEPLOY.md** for program deploy, worker deploy, schema migration, and env vars.

## Curve Parameters (must stay in sync: FE / Worker / on-chain)

- Virtual reserves: `V_SOL0 = 30 SOL`, `V_TOK0 = 1.073B tokens`, `K ≈ 3.219e10`
- Supply: 1B tokens (6 decimals)
- Fees: 0.5% on-chain (0.25% platform + 0.25% creator)
- Graduation: 85 SOL raised
- Anti-whale: max 10% of virtual reserves per trade (on-chain: 50% cap)
- Buy: `eff = solIn × 0.993; tokOut = vt × eff / (vs + eff)`
- Sell: `gross = vs × tokIn / (vt + tokIn); net = gross × 0.993`