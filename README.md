# 🛸 Hermes Launchpad

**Codename: ANTIGRAVITY PUMP** — an AI-native, multi-chain memecoin launchpad.
Zero-cost stack: GitHub + Cloudflare Pages + Workers + D1 (all free tier).

> ⚠️ Demo phase: token data is seeded demo data, trades are UI-only. The Solana
> program is compile-verified and ready to deploy to devnet (see below).

## Repo map

| Path | What |
|---|---|
| `src/` | Frontend (Vite + React + TS + Tailwind) — discovery, trade modal, quests, leaderboard |
| `workers/` | `hermes-api` Cloudflare Worker (REST API, D1-backed) + schema/seed |
| `programs/hermes-curve/` | Anchor bonding-curve program (compile-verified) + tests + deploy guide |
| `ci-cd/` | GitHub Actions workflows (activate per `ci-cd/README.md`) |

## Live

- **Site:** https://hermes-launchpad.pages.dev
- **API:** https://hermes-api.tahamtandariush.workers.dev (`/api/tokens`, `/api/quests`, `/api/leaderboard`, `/api/stats`)
- **Program ID (devnet):** `E99nGQh6iCAC43azp4zvpefCRmfY9bZHV7J6LL2yu93U`

The frontend calls the live API and shows a `● LIVE API` badge when connected,
falling back to built-in demo data if the API is unreachable.

## Dev

```bash
npm install
npm run dev     # frontend on :3000
npm run build   # outputs dist/

cd workers && npx wrangler dev        # local API
cd programs/hermes-curve && anchor test   # program tests (local validator)
```

## Deploy

- **Site + API:** push to main (after activating `ci-cd/` workflows) or
  `npx wrangler pages deploy dist` / `cd workers && npx wrangler deploy`
- **Program:** see `programs/hermes-curve/DEPLOY.md`

## Legal

Nothing here is financial advice. DYOR. Demo content only.
