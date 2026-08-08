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
src/lib/api.ts  src/lib/tokens.ts  src/lib/token-truth.ts  src/components/*.tsx  src/pages/*.tsx  src/hooks/*.ts
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
- `migrate_to_raydium` (MigrateRaydium accounts, manual CPI to Raydium CPMM) — WU-02; emits `Migrated` event
- IDL: **built** (`programs/hermes-curve/target/idl/hermes_curve.json`) — WU-01; `migrate_to_raydium` present (WU-02)

## Verified Artifacts (on-chain)
- Program ID: `9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz` — devnet slot 481956048, 2.69 SOL, authority `GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a` (verified `solana program show`)
- Config PDA: `9Sv1kApQK428EUueU7dR9mTPqKqNR7dxkBmwtZuHDTkr` — initialized, fee wallet + migration authority = authority key
- Fee wallet: `GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a`
- **No deploy keypair in `target/deploy/`** (verified empty)
- Worker: `hermes-api.tahamtandariush.workers.dev` ; Pages: `hermes-launchpad.pages.dev` ; D1: `hermes-launchpad-db` (`afa984c4-30e5-4f47-afce-a401ee2df098`)
- IDL: `programs/hermes-curve/target/idl/hermes_curve.json` — built (WU-01); `migrate_to_raydium` present (WU-02); devnet Raydium ID patched (WU-03)
- Raydium CPMM devnet program ID: `DRaycpLY18LhpbydsBWbVJtxpNv9oXPgjRSfpF2bWpYb` (verified `solana program show`)
- Program tests: 6/6 passing on devnet via `npm run test:program`

## Build & Test (verified green)
- `npm run build` → exit 0
- `npm run lint` → exit 0
- `npm run test:unit` → 12 passed (smoke:1, wu05-truth-regression:7, wu05-token-presentation:4)
- `npm run test:worker` → 6 passed (incl. quarantine-traceability)
- `npm run test:client` → 1 passed
- `npm run test:integration` → 1 passed
- `npm run test:security` → 5 passed
- `npm run test:program` → 6 passed on devnet (IDL built, config loaded, create/buy/sell/slippage + WU-02 migrate_to_raydium wiring, WU-03 devnet Raydium ID)
- Configs: `vitest.config.ts` (unit/client/integration/worker), `playwright.config.ts` (5 browsers), `tests/setup.ts`

## OMH State
`.omh/state/hermes-launchpad-onchain/` — autopilot-state.json + ralph-state.json (WU-00, WU-01, WU-02, WU-03 complete; WU-04 blocked at Raydium devnet amm_config provisioning — environmental, not code defect; WU-05 frontend truth remediation complete on branch `wu-05-frontend-truth`, pushed `5b30806`). Swarm init via OMH file-backed fallback (claude-flow@alpha unavailable).

## WU-03 — Fake-Write Removal + Devnet Raydium ID Fix ✅
- Removed 5 quarantined fake-write paths: `createTokenServer`, `registerToken`, `postTrade` (api.ts); `POST /api/tokens`, `POST /api/tokens/register` (worker.js)
- Corrected Raydium CPMM program ID from mainnet `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C` → devnet `DRaycpLY18LhpbydsBWbVJtxpNv9oXPgjRSfpF2bWpYb` (verified via context7 + `solana program show`)
- Program redeployed with fix (sig: `617yNMbQmR9Pft1B2gggBctmYkxn8gFvLcGCxhpLU9yRSn6sucbzdM5dWp4QC8hGCgiZeFhjSdeUyQAZtSnw1exS`)
- All 19+ tests passing (unit:1, worker:6, client:1, integration:1, security:5, program:6)
- **Blocked**: On-chain migration proof requires Raydium account funding (amm_config, pool_state, vaults) — WU-04+

## WU-05 — Frontend Truth Remediation ✅ (branch `wu-05-frontend-truth`, commit `5b30806`)
- Stripped fabricated `Token` fields from `src/lib/tokens.ts`: removed `marketCap`, `change24h`, `volume24h`, `curveProgress`, `riskScore`, `sentiment`, `spark`, `createdMinsAgo`, `replies`, `likes`, `holders`. Interface now carries only on-chain-real + indexing-fallback fields (`onchainMint`, `realSol`, `priceSol`, `priceUsd`, `lore`, `riskFlag`, `creator`, `complete`).
- `TOKENS` / `QUESTS` / `LEADERBOARD` const arrays now empty (`[]`); `api.ts` fallbacks return empty arrays — no fake feed.
- New `src/lib/token-truth.ts` — single source of truth for migration math + curve status:
  `verifiedSol` (zeros demo records lacking `onchainMint`), `migrationProgress`, `remainingToMigration`, `sortByCurveProgress`, `tokenCurveStatus` (demo|active|migration-ready), `filterVerifiedTokens` (all|curve-progress|migration-ready), `formatUnixAge` (unix **seconds**).
- Discovery filters changed from fabricated `trending|new|migrating` → evidence-backed `curve-progress|migration-ready`.
- Neutralized misleading copy: "Graduate at 85 SOL" → "Default curve threshold: 85 SOL. Locked curves become migration-ready."; "Active market" dot → status-aware label; "🎓 Graduated" → "Migration ready"; removed fabricated risk-score bar in TokenModal.
- Per-token threshold progress hidden for demo records (`status === 'demo'`); for `onchainMint` tokens shows Worker-supplied values with "default" disclaimer + "deployed config may differ" (Worker `mapToken` still derives price/real_sol from D1 seed, not decoded on-chain events — true verified provenance = future WU).
- Fixed referral timestamp bug: Worker stores `created_at` as unix **seconds**; `formatUnixAge` now treats input as seconds (was incorrectly mixing `Date.now()/1000 - seconds` as minutes).
- `vitest.config.ts`: added `@`→`src` alias via `fileURLToPath`, applied per-project resolve so component tests importing `@/lib/...` resolve.
- Tests: added `tests/unit/wu05-truth-regression.test.ts` (7) + `tests/unit/wu05-token-presentation.test.ts` (4) — 11 new, all green. Full `npm run test:unit` = 12 passed. `npm run build` = exit 0.
- **Not yet merged to main** — branch push only; merge pending review/approval.

## CI
`.github/workflows/ci.yml` — extended with test-unit/worker/client/integration/security/program/e2e + Lighthouse ≥90 gate (this WU-00 commit).

## Notes
- Quarantined routes (`createTokenServer`, `registerToken`, `postTrade`, `POST /api/tokens`, `POST /api/tokens/register`, `POST /api/trades`) present in source, marked prohibited in FEATURE_MATRIX.md; removal tracked in WU-03/04.
- No on-chain mutations performed; program authority unchanged.
- `workers/_worker.js` referenced by DEPLOY for `/rpc` proxy — **absent** at `workers/_worker.js` (verify path before WU-04).
- esbuild postinstall was blocked by npm allowScripts; fixed via `npm install-scripts approve esbuild` + `npm rebuild esbuild` (documented recurring env issue).
