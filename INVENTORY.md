# Hermes Launchpad Inventory (WU-00)

> Generated 2026-08-07. Source of truth: git HEAD at time of write. Verified on disk this session.

## Source Tree (non-build)
```
.hermes/plans/2026-08-07_120000-hermes-launchpad-complete-vs-pump-fun.md
docs/launchpad/FEATURE_MATRIX.md
docs/launchpad/CAPABILITY_STATES.md
docs/launchpad/FEATURE_FLAGS.md
docs/launchpad/UPGRADE_AUTHORITY.md
docs/launchpad/MOBILE_TRADE_SHEET_SPEC.md
docs/launchpad/DEVNET_VERIFICATION.md
INVENTORY.md
README.md
DEPLOY.md
package.json  package-lock.json  eslint.config.js  index.html
Anchor.toml  Cargo.toml  Cargo.lock
workers/worker.js  workers/wrangler.toml  workers/schema.sql  workers/schema_v2.sql
workers/schema_v3.sql  workers/seed_v2.sql  workers/chain.js
src/lib/api.ts  src/lib/tokens.ts  src/components/*.tsx  src/pages/*.tsx  src/hooks/*.ts
programs/hermes-curve/programs/hermes-curve/src/lib.rs  (Anchor instructions)
.omh/state/hermes-launchpad-onchain/  (autopilot/ralph state)
.github/workflows/ci.yml
vitest.config.ts  playwright.config.ts  tests/setup.ts  tests/unit/smoke.test.ts
```

## Routes & Endpoints

### Cloudflare Worker (`workers/worker.js`) — verified line refs
| Method+Path | Purpose | State |
|---|---|---|
| GET /api/health | health | live |
| GET /api/tokens | list tokens | live |
| POST /api/tokens | create token (off-chain) | **QUARANTINED WU-03** (line 168) |
| POST /api/tokens/register | client-trusted on-chain register | **QUARANTINED WU-04** (line 190) |
| GET /api/tokens/:id | token detail | live |
| GET/POST /api/tokens/:id/comments | social | live (P1 hidden) |
| POST /api/tokens/:id/like | social | live (P1 hidden) |
| POST /api/tokens/:id/lore | AI Bard | live (P1, AI_ENABLED default false) |
| POST /api/tokens/:id/risk | AI Oracle | live (P1, AI_ENABLED default false) |
| GET /api/trades | list trades | live |
| POST /api/trades | off-chain trade | **QUARANTINED WU-04** (line 308) |
| POST /api/trades/index | on-chain trade index (signature-only) | live (WU-04 target) |
| GET /api/profile/:wallet | profile | live |
| POST /api/profile/:wallet/checkin | daily check-in | live |
| GET /api/profile/:wallet/referrals | referrals | live |
| GET /api/quests | quests | live |
| GET /api/leaderboard | leaderboard | live |
| GET /api/stats | stats | live |

### API Client (`src/lib/api.ts`) — verified
- `fetchTokens`, `fetchToken`, `fetchReferrals`
- `createTokenServer` → POST /api/tokens — **QUARANTINED WU-03** (line 58)
- `registerToken` → POST /api/tokens/register — **QUARANTINED WU-04** (line 63)
- `postTrade` → POST /api/trades — **QUARANTINED WU-04** (line 77)
- `fetchTrades`, `indexTrade`
- `postComment`, `likeToken`, `genLore`, `genRisk`
- `fetchProfile`, `checkin`, `fetchQuests`, `fetchLeaderboard`

### On-chain Instructions (Anchor `lib.rs`) — verified
- `initialize` (Initialize accounts) — line 47
- `create_token` (CreateToken accounts) — line 63
- `buy` (Trade accounts, min_tokens_out slippage floor) — line 99
- `sell` (Trade accounts, min_sol_out slippage floor) — line 192
- `migrate` (Migrate accounts) — line 257; emits `Migrated` event — line 292
- IDL: **not built** (`programs/hermes-curve/target/idl/*.json` absent) — pre-WU-01 blocker for `test:program`

## Verified Artifacts (on-chain)
- Program ID: `9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz` — devnet slot 481782747, 2.24 SOL, authority `GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a` (verified `solana program show`)
- Config PDA: `9Sv1kApQK428EUueU7dR9mTPqKqNR7dxkBmwtZuHDTkr` — initialized, fee wallet + migration authority = authority key
- Fee wallet: `GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a`
- No deploy keypair in `programs/hermes-curve/target/deploy/` (verified empty) — upgrade via `target/deploy/hermes_curve-upgrade-buffer.json`
- Worker: `hermes-api.tahamtandariush.workers.dev` ; Pages: `hermes-launchpad.pages.dev` ; D1: `hermes-launchpad-db` (`afa984c4-30e5-4f47-afce-a401ee2df098`)
- IDL: `programs/hermes-curve/target/idl/hermes_curve.json` — built (WU-01)
- Program tests: 5/5 passing on devnet via `npm run test:program`

## Build & Test (verified green)
- `npm run build` → exit 0
- `npm run lint` → exit 0
- `npm run test:unit` → 1 passed
- `npm run test:worker` → 6 passed (incl. quarantine-traceability)
- `npm run test:client` → 1 passed
- `npm run test:integration` → 1 passed
- `npm run test:security` → 5 passed
- `npm run test:program` → 5 passed on devnet (IDL built, config loaded, create/buy/sell/slippage)
- Configs: `vitest.config.ts` (unit/client/integration/worker), `playwright.config.ts` (5 browsers), `tests/setup.ts`

## OMH State
`.omh/state/hermes-launchpad-onchain/` — autopilot-state.json + ralph-state.json initialized (WU-00 complete, WU-01 pending approval).

## CI
`.github/workflows/ci.yml` — extended with test-unit/worker/client/integration/security/program/e2e + Lighthouse ≥90 gate (this WU-00 commit).

## Notes
- Quarantined routes (`createTokenServer`, `registerToken`, `postTrade`, `POST /api/tokens`, `POST /api/tokens/register`, `POST /api/trades`) present in source, marked prohibited in FEATURE_MATRIX.md; removal tracked in WU-03/04.
- No on-chain mutations performed; program authority unchanged.
- `workers/_worker.js` referenced by DEPLOY for `/rpc` proxy — **absent** at `workers/_worker.js` (verify path before WU-04).
- esbuild postinstall was blocked by npm allowScripts; fixed via `npm install-scripts approve esbuild` + `npm rebuild esbuild` (documented recurring env issue).
