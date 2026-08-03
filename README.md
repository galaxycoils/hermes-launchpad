# 🛸 Hermes Launchpad — ANTIGRAVITY PUMP

AI-native multi-chain memecoin launchpad. Fair-launch bonding curves, AI agents
writing lore and scoring risk, XP/quests/streaks, referrals, and a live shared
curve engine — running on a **$0 stack** (GitHub + Cloudflare free tiers + Solana devnet).

## Live

- **App:** https://hermes-launchpad.pages.dev
- **API:** https://hermes-api.tahamtandariush.workers.dev/api/health

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vite + React 19 + TypeScript + Tailwind (this repo, root) |
| Hosting | Cloudflare Pages (git build from `main`: `npm run build` → `dist`) |
| Backend | Cloudflare Worker `hermes-api` (`workers/worker.js`) |
| Database | Cloudflare D1 `hermes-launchpad-db` (`workers/schema_v2.sql`) |
| AI | Workers AI `@cf/meta/llama-3.1-8b-instruct` (The Bard / The Oracle) |
| Chain | Solana devnet Anchor program (`programs/hermes-curve`) — see DEPLOY.md |

## Features

- Shared bonding-curve engine (constant product, virtual reserves) — every trade
  moves the real global price for everyone
- King of the Hill, live trade ticker, token graduation at 85 SOL raised
- XP, levels, daily quests, streaks with 2x multiplier, referral links (+750 XP)
- Comments, likes, AI lore (The Bard), AI risk scores (The Oracle)
- Wallet connect (Phantom) or wallet-less anonymous identity

## Dev

```bash
npm install
npm run dev
```

Deploy details, IDs, curve math, and the lost-keypair note: see **DEPLOY.md**.
