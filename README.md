# 🛸 Hermes Launchpad

**Codename: ANTIGRAVITY PUMP** — an AI-native, multi-chain memecoin launchpad.
Zero-cost stack: Vite + React + TypeScript + Tailwind, hosted free on GitHub + Cloudflare Pages.

> ⚠️ This repo currently contains the **frontend demo** with mock data. No real funds, no real contracts yet.

## What's built (V0.1 — demo frontend)

- **Token discovery** — grid of bonding-curve tokens with sparklines, filters (trending / new / migrating), search
- **Token detail modal** — price chart, AI narrative lore, migration progress bar ($69,420 target), buy/sell widget with fee breakdown (0.7% total)
- **AI Agents strip** — The Bard (narrative), The Oracle (risk analyst), The Warden (moderator), The Weaver (sentiment)
- **Quests & XP** — daily quests, streak bonuses, leveling hooks
- **Leaderboard** — top traders with PnL, win rate, XP
- Responsive, dark neon theme, mobile-friendly

## Roadmap (from blueprint)

1. ✅ V0.1 — frontend demo on free hosting (this)
2. Solana bonding-curve program (Anchor/Rust) on devnet
3. Backend: event indexer, WebSocket price feeds, user service
4. AI agent orchestration (narrative / analyst / moderator / sentiment)
5. Gamification live + multi-chain (Base)
6. Audits, then mainnet

## Dev

```bash
npm install
npm run dev     # localhost dev server
npm run build   # outputs dist/
```

## Deploy (free)

- **Cloudflare Pages**: connect this repo → build command `npm run build` → output dir `dist`
- Or `npx wrangler pages deploy dist` with a free Cloudflare account

## Legal

Nothing here is financial advice. DYOR. Demo content only.
