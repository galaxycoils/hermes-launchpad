# Hermes Launchpad — Deployment Guide

## Architecture (current, $0 stack)

```
Browser ──► Cloudflare Pages (hermes-launchpad.pages.dev)   [static frontend + /rpc proxy worker]
      ──► Cloudflare Worker (hermes-api.tahamtandariush.workers.dev)
            ├── D1 (hermes-launchpad-db) — shared bonding-curve engine, trades, comments,
            │   likes, profiles, XP, quests, streaks, positions
            └── Workers AI (@cf/meta/llama-3.1-8b-instruct) — The Bard (lore) / The Oracle (risk)
```

All trading currently runs on the **server-side shared curve engine** in the Worker
(constant-product with virtual reserves, mirroring the Anchor program's math):
one global price per token, every trade moves it for everyone, XP/quests/streaks
settle server-side. This is real shared state — not localStorage, not mocks.

## IDs

| Thing | Value |
|---|---|
| Cloudflare account | `a55a43856c7029505b79300ec82f1629` |
| Pages project | `hermes-launchpad` → https://hermes-launchpad.pages.dev |
| API worker | `hermes-api` → https://hermes-api.tahamtandariush.workers.dev |
| D1 database | `hermes-launchpad-db` id `afa984c4-30e5-4f47-afce-a401ee2df098` |
| Anchor program ID | `E99nGQh6iCAC43azp4zvpefCRmfY9bZHV7J6LL2yu93U` (**keypair lost — see below**) |

## Frontend deploy (Pages, git-connected)

The Pages project builds from the `main` branch of `galaxycoils/hermes-launchpad`:

- Build command: `npm run build`
- Output dir: `dist`
- `public/_worker.js` ships into the output and provides the `/rpc` devnet proxy.

Push to `main` → Cloudflare builds & deploys automatically.

## API worker deploy

```bash
cd workers
npx wrangler deploy        # wrangler.toml has the D1 + AI bindings
```

## D1 schema / seeds

```bash
cd workers
npx wrangler d1 execute hermes-launchpad-db --remote --file=schema_v2.sql
npx wrangler d1 execute hermes-launchpad-db --remote --file=seed_v2.sql
```

One statement per call if using the REST API
(`POST /accounts/{acct}/d1/database/{db}/query`).

## Curve parameters (shared by worker + Anchor program)

- Virtual reserves: `V_SOL0 = 30 SOL`, `V_TOK0 = 1.073e9 tokens`, `K = 3.219e10`
- Supply 1e9, fee 0.7%, graduation at 85 SOL raised (≈ $69.4K mcap at $150/SOL display peg)
- Anti-whale: max 10% of remaining curve per trade
- buy: `eff = solIn × 0.993; tokOut = vt × eff / (vs + eff)`
- sell: `gross = vs × tokIn / (vt + tokIn); net = gross × 0.993`

## ⚠ On-chain program: keypair lost

The program keypair for `E99nGQh6…u93U` lived only in a wiped sandbox (`/tmp`).
It is **unrecoverable** — that address can never be deployed to or upgraded.

To go on-chain for real:

1. `solana-keygen new -o hermes-curve-keypair.json` (back it up outside any sandbox!)
2. Update `declare_id!` in `programs/hermes-curve/src/lib.rs` and `PROGRAM_ID` in
   `src/lib/solana.ts` / `workers` config to the new pubkey.
3. `anchor build && anchor deploy --provider.cluster devnet`
4. Fund the deployer via `solana airdrop 2` (devnet faucet rate-limits; retry).
5. Flip the frontend trade flow from `postTrade()` (server curve) to the on-chain
   instruction builders in `src/lib/solana.ts`. The UI already has the wallet plumbing.

The compiled `hermes_curve.so` from the previous build exists in release artifacts
but is useless without the matching program keypair authority.

## Free-tier notes

Everything above runs on $0: GitHub free, Cloudflare Pages/Workers/D1/Workers AI free
tiers, Solana devnet. Workers AI free tier includes 10k neurons/day — the Bard/Oracle
endpoints are rate-limited server-side accordingly.
