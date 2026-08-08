---
title: "Hermes Launchpad Completion: Verifiable Pump.fun Parity + Measurable Superiority"
date: "2026-08-07"
slug: "hermes-launchpad-complete-vs-pump-fun"
status: "approved-for-user-review — gate PASSED cycle 3 (0/0/0 blocking)"
cluster: "devnet only"
program_id: "9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz"
revision: "r2"
---

# Hermes Launchpad Completion Implementation Plan

> **For Hermes:** Execute only after the user explicitly approves this plan. Use the approved plan as the single work-unit specification; one bounded WU per iteration; TDD before production changes; devnet only. Never sign/send a transaction without a user-visible transaction summary and explicit confirmation.

**Goal:** Turn Hermes Launchpad into a fully verifiable, devnet-complete fair-launch product with pump.fun functional parity and measurable improvements in transaction truth, safety, creator transparency, real-time UX, resilience, and AI honesty.

**Architecture:** The Anchor program is the sole authority for token creation, curve state, pricing, fees, custody, and graduation. The Cloudflare Worker is an independently verifying read/index layer; D1 is a cache/query model only and may never create, price, settle, or mutate trades. React builds and simulates a user-owned transaction, the wallet signs it, the Worker indexes its confirmed/finalized on-chain result, and Durable Objects (post-core only) fan out verified events. AI and social features are optional, labeled services with no authority over trading, fees, or graduation.

**Tech stack:** Anchor/Rust, Solana devnet, SPL Token with an explicit Token-2022 compatibility gate, generated IDL client + `@solana/kit` (migration gated behind passing client tests; v1 adapter retained until then), Wallet Standard, React/Vite/TypeScript, Cloudflare Workers/D1/Durable Objects/R2, Vitest/Playwright, LiteSVM or Mollusk, Surfpool, Wrangler.

---

## 1. Success Contract — What "Better Than pump.fun" Means Here

"Better in every way" is not a truthfully testable promise against pump.fun's mainnet liquidity, brand, third-party liquidity, or network effects. This plan therefore defines a **verifiable product-superiority bar**. Hermes may claim parity/superiority only when every row is evidence-backed on devnet; otherwise the UI must say *planned*, *unavailable*, or *experimental*.

| Dimension | Pump.fun baseline to match | Hermes measurable advantage | Required evidence |
|---|---|---|---|
| Fair launch | permissionless creation + curve trading | every create/buy/sell is independently decoded and linked to Explorer; no server-side trade path | devnet create→buy→sell evidence, Worker decode tests |
| Price integrity | visible curve price | quote, fee, slippage floor, and post-trade deltas reconcile to the program event | property tests + signed transaction reconciliation |
| Graduation | migration to DEX liquidity | permissionless, auditable, non-custodial graduation state machine; no opaque authority sweep; Raydium pool + LP lock proof | negative/positive migration tests + Raydium pool proof |
| Creator economics | creator rewards | fee recipient, fee basis, payout mode, and post-graduation status shown from verified transfers | creator dashboard reconciliation test |
| Discovery | live feed, search, token pages | verified-event stream with explicit stale/offline state; fixture data cannot masquerade as live | reconnect + stale-state UI tests |
| Wallet UX | connect/sign/trade | Wallet Standard support, simulation-first preview, explicit fee/recipient/cluster, retry-safe indexing | mocked wallet + browser E2E |
| Safety | warnings/disclaimers | fail-closed trade path, signed social actions, replay protection, CSP/CORS/rate limits, transaction-source validation | adversarial test matrix + code review |
| AI/social | hype/community features | Bard/Oracle provenance and uncertainty labels; AI never gives trade authority; wallet-bound social anti-spam | prompt-injection, timeout, auth tests |
| Mobile | usable mobile trading | PWA installability, touch-first trade sheet, keyboard/screen-reader flow, reconnect/offline behavior | mobile Playwright + Lighthouse/accessibility results |
| Operations | opaque backend behavior | documented capability states, safe flags, indexed source evidence, rollback instructions | deployment runbook + health/metrics proof |

**Definition of done:** all `P0` work units pass locally and on devnet; all `P1` work units pass or are hidden/disabled with honest copy; all exposed controls have a real verified outcome or are removed/disabled; no mainnet deployment occurs under this plan. Release scope matrix (§2) assigns every visible control/API to P0/P1/P2.

---

## 2. Release Scope Matrix (P0 / P1 / P2)

WU-00 produces `docs/launchpad/FEATURE_MATRIX.md` with one row per exposed route/control/API/event: `priority`, `release inclusion`, `owner WU`, `source of truth`, `capability state`, `flag`, `automated test`, `evidence artifact`.

**Release rules:**
- **P0** — must pass before any devnet release claim. Core safe-trading path.
- **P1** — must pass or be hidden/disabled with `unavailable` copy. Enhanced UX/social.
- **P2** — explicitly excluded from the devnet release; no active control or live claim may remain.

| Capability | Priority | Owner WU | Source of truth | Flag |
|---|---|---|---|---|
| Token create (on-chain) | P0 | WU-01/03 | program event | — |
| Buy / Sell (on-chain) | P0 | WU-01/03 | program event | — |
| Worker index of confirmed tx (signature-only) | P0 | WU-04 | chain decode | CHAIN_INDEXING_REQUIRED |
| Verified quote / price / fee display | P0 | WU-03 | program event | — |
| Trade sheet (mobile + desktop) | P0 | WU-07 | program event | — |
| Capability/network state badges | P0 | WU-07 | Worker health | — |
| Discovery feed (verified polling) | P0 | WU-06 | Worker read API | REALTIME_ENABLED=false → polling |
| Creator fee ledger (verified) | P0 | WU-05 | fee_transfer events | — |
| Wallet Standard connect/sign | P0 | WU-03 | wallet | — |
| Real-time DO fan-out | P1 (post-core) | WU-06b | verified events | REALTIME_ENABLED (default false) |
| AI Bard lore | P1 | WU-05 | AI contract | AI_ENABLED (default false) |
| AI Oracle risk | P1 | WU-05 | AI contract | AI_ENABLED (default false) |
| Wallet-signed social (comments/likes/referrals) | P1 | WU-05 | signed session | SOCIAL_WRITES_ENABLED (default false) |
| Report/block links | P1 | WU-05/07 | moderation API | — |
| R2 media upload | P2 | — | — | excluded from devnet release |
| Push notifications | P2 | — | — | excluded from devnet release |
| Creator analytics dashboard | P2 | — | — | excluded from devnet release |
| Referral financial rewards | P2 | — | — | off-chain XP only, labeled non-financial |
| Legacy `migrate` sweep | REMOVED | WU-02 | — | LEGACY_MIGRATION_SWEEP (default false) |
| `postTrade` off-chain | REMOVED | WU-04 | — | prohibited in route graph |
| `createTokenServer` / `POST /api/tokens` | REMOVED | WU-03/04 | — | prohibited in route graph |
| Client-trusted `POST /api/tokens/register` | REMOVED | WU-04 | — | replaced by signature-only index |

---

## 3. Current Context / Ground Truth

| Area | Verified current state | Consequence |
|---|---|---|
| Canonical root | `/Users/cmd/workspace/hermes-launchpad`; Git HEAD `ed6b369`; draft plan untracked | All commands run at this root. |
| Frontend | Vite 7 + React 19 + TS; **no test script**; manual `@solana/web3.js` v1 builders in `src/lib/solana.ts` | Build test harness before SDK migration. |
| Wallet | `WalletButton.tsx` uses injected `window.solana`; `CreateTokenModal.tsx` uses partial-sign/send workaround | Move incrementally to Wallet Standard/Kit; retain narrow adapter until flow passes. |
| Program | Emits `TradeEvent`/`MigrationReady`; classic SPL Token; `migrate` sweeps SOL/tokens to migration authority (`lib.rs:255-293`) | **Not** Raydium; must not be marketed as one. |
| Program deps | `Cargo.toml` has only `anchor-lang`, `anchor-spl`, `solana-program`; **no Raydium CPI, no Token-2022** | WU-01b/WU-02 add deps after spikes. |
| Existing tests | Anchor TS tests cover initialize/create/buy/sell/slippage only; **no Worker/frontend tests** | Add authorization, invariant, migration, event, regression coverage. |
| Worker | `chain.js` matches account positions + log string; does not decode discriminators/args/events or reconcile balances | Client-provided `side`/`wallet`/amounts untrusted until verified parser exists. |
| Fake-write paths (live) | `src/lib/api.ts:58` `createTokenServer()`→`POST /api/tokens`; `:63` `registerToken()`→`POST /api/tokens/register` (client-trusted name/ticker/emoji/creator); `worker.js:168-187` writes D1 from client input; `:190-213` persists client metadata | **All quarantined/removed** in WU-03/04. |
| Data plane | D1 models curve figures; frontend has fixture fallbacks; Worker retains legacy/simulated create/trade routes | D1 becomes index/read only; fixtures test/demo-only. |
| Real time | Frontend polls every 30s; no DO binding | P0 = verified REST polling; DO deferred to post-core (P1). |
| Deployment | Worker uses D1 + Workers AI; `Anchor.toml` defaults `Localnet`; no secrets recorded | Stage separately; no credential/keypair in Git/chat/bundle. |
| Missing docs | `HERMES_LAUNCHPAD_REMAINING_PLAN.md` / `_WHATS_MISSING.md` **not present** at root during planning | Treat as **[Unverified]**; WU-00 locates/imports/reconciles or records absent. |
| Vault | Read-only Obsidian CLI unavailable (Obsidian not running); `00.context/now.md` read directly | Do not infer missing Roadmap content. |

### Research and skill inputs
- `solana-dev`, `solana-kit`: Kit-first client boundary; Wallet Standard; simulation before signing; LiteSVM/Mollusk + Surfpool; `NO_DNA=1` for non-interactive tooling.
- Context7 `/anza-xyz/kit`: wallet accounts → `TransactionSendingSigner`; messages carry payer, fresh blockhash, instructions, simulation, signing, send, confirmed handling.
- Context7 `/raydium-io/raydium-cpi`: CPMM needs funded creator, configured pool, ordered mints, vaults, LP mint/ATA, fee account, observation state, token programs, exact initial amounts. Feasibility gate, not assumption.
- Context7 Cloudflare: long-lived WebSockets belong in a Durable Object via hibernation (`ctx.acceptWebSocket`), auto ping/pong, lifecycle handlers.
- `/find-skills` candidates (not installed in plan mode): `cloudflare/skills@durable-objects` (36.8K installs), `sendaifun/skills@raydium` (208 installs). Inspect/install project-local before WU-05/WU-07 if still needed; never `-g`.
- `modern-web-guidance` invoked for launchpad UI/PWA search (required); returned no usable guidance, so no unverified rule attributed.

---

## 4. Non-Negotiable Guardrails

1. **Devnet only.** Never change configured cluster or submit mainnet tx under this plan.
2. **Source of truth:** program ID `9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz` remains source for balances/trades. No change to program ID/config/upgrade authority without separately approved migration decision.
3. **No off-chain trade settlement.** Delete/permanently feature-flag legacy `postTrade`; Worker may only verify/index a user-signed on-chain signature.
4. **No custody regression.** Never solve Raydium graduation by sweeping funds/tokens to an opaque server wallet. Migration authority must be transparent, constrained, auditable, ultimately removable/permissionless.
5. **No fake-live state.** Fixtures, estimates, simulated PnL, static leaderboards, AI output visually/semantically distinct from verified data; live badge requires known freshness/verification timestamp.
6. **No secrets.** Keys/seed/tokens/RPC creds/Cloudflare secrets/wallet files outside source control and chat. Wallet Standard for user signing; secret bindings only via Wrangler/Dashboard stdin.
7. **Fail closed.** If chain config, account owner/discriminator, quote freshness, simulation, wallet signing, confirmed tx, or Worker verification fails → disable trading/indexing, show reason. Never fall back to simulated trade.
8. **Compatibility before feature claims.** Token-2022 transfer hooks and Raydium CLMM opt-in only after written local/devnet compatibility spike. Classic SPL + CPMM safe baseline unless evidence says otherwise.
9. **Every new module small.** Focused modules (target ≤60 lines per new module) with tests beside them; do not enlarge god files.
10. **Transaction approval:** cluster, program, instruction, mint, fee payer, SOL/token amount, min-out, fee recipients, priority fee, estimated rent before wallet prompt. Simulate first; wait for approval.
11. **No Raydium graduation claim without verified pool address + LP lock receipt** on devnet Explorer.
12. **No optimistic UI mutation.** Trade sheet/price/quote state is inert until Worker confirmation; when `navigator.onLine === false` or Worker health is `degraded`, trading is disabled with explicit banner.
13. **Legacy `migrate` disabled by default.** `LEGACY_MIGRATION_SWEEP=false`; if enabled, explicit deprecation warning; no devnet graduation claim until Raydium CPMM proof exists.

---

## 5. Decision Gates Before Feature Work

| Gate | Options | Required proof | Default if proof fails |
|---|---|---|---|
| G1: Canonical scope | import/reconcile missing `HERMES_LAUNCHPAD_*` docs vs supersede | exact paths, Git ownership, overlapping tasks mapped | preserve this plan; append source findings |
| G2: Program upgrade path | preserve current layout + companion PDA vs approved new program/migration | **UPGRADE_AUTHORITY.md** (upgrade authority keypair/multisig, program-ID immutability decision, rollback procedure) before WU-01 | hard-stop program mutations until resolved |
| G3: Raydium pool type | CPMM mandatory baseline vs CLMM | local + devnet CPI proof, full required accounts, CU/fees, LP custody, DEX compat | retain `MigrationReady` state only; **no DEX graduation claim** until CPMM proof exists |
| G4: Token standard | classic SPL vs Token-2022 | Raydium pool/swap compat, wallet support, extension behavior, indexer decoding (WU-01b) | classic SPL; defer hooks, label referral off-chain XP only |
| G5: Creator fee model | direct per-trade payout vs escrow/claimable | program accounting invariants, withdrawal auth, reconciliation | retain direct verified per-trade payout; no fake "claim" UI |
| G6: Social identity | wallet-signed sessions vs anonymous read-only | nonce/replay tests + UX fallback | read-only anonymous; no anonymous writes/XP/referrals |
| G7: Real time | Worker WebSocket / REST verified stream | reconnect/backpressure/load + stale-state UI | **P0 = bounded verified REST polling**; DO deferred to post-core |

---

## 6. Execution Model

- Create file-backed OMH instance for this plan after approval. Persist WU IDs, dependency DAG, evidence paths, plan digest before WU-00. No overlapping autopilot/Ralph campaign mutates this root.
- Every WU: **RED → GREEN → REFACTOR → audit → commit**. Blocked external prerequisite → honest disabled/planned state, not synthetic pass.
- No deployment/remote D1 migration/program upgrade/deploy/tx merely because a WU completes. Each separately gated by tests, tx/deploy summary, user authorization.
- At each release candidate, run fresh three-reviewer gate: program/security, product/UX/truth, operations/test/rollback.

---

# Work Units

## WU-00 — Test Infrastructure, Inventory, Traceability, and Release Scope

**Depends on:** none
**Objective:** Establish test harness + authoritative scope before any feature work (gate r2: test infra is Step 0; no WU-01 start until green).

**Files:**
- Create: `vitest.config.ts`, `playwright.config.ts`, `tests/fixtures/`
- Create: `docs/launchpad/{FEATURE_MATRIX.md, CAPABILITY_STATES.md, FEATURE_FLAGS.md, CHAIN_CONTRACT.md, EXTERNAL_PREREQUISITES.md, UPGRADE_AUTHORITY.md, MOBILE_TRADE_SHEET_SPEC.md, DEVNET_VERIFICATION.md}`
- Modify: `package.json` (add test scripts), `README.md`, `DEPLOY.md`
- Inspect: `.omh/state/`, missing plan docs, `Anchor.toml`, `wrangler.toml`, Pages config, Git remote

**Steps:**
0. **Test infra first:** add Vitest + Playwright; root scripts `test`, `test:unit`, `test:worker`, `test:e2e`, `test:program`, `test:integration`, `test:security`, `test:client`, `test:all`. Each exits non-zero when zero tests collected. Add `vitest.config.ts`/`playwright.config.ts`. CI mirrors these. **WU-00 acceptance blocks WU-01 until green.**
1. Read-only locate the two missing plan docs; map valid items to WUs or record absent.
2. Reconcile OMH state, Git branch/remote, deployed Worker/Pages source, D1 schema history, Anchor IDL, program deployment/upgrade authority, config PDA. Public IDs + redacted env names only.
3. Build FEATURE_MATRIX.md per §2 (priority, inclusion, owner, source, capability state, flag, test, evidence).
4. CAPABILITY_STATES.md exact copy for `verified-live`, `confirmed-indexing`, `stale`, `degraded`, `fixture/demo`, `planned`, `unavailable` (see §6A).
5. FEATURE_FLAGS.md with exact keys/defaults (see §6B).
6. UPGRADE_AUTHORITY.md: record upgrade authority keypair/multisig, program-ID immutability decision, rollback procedure (G2). If unavailable → hard-stop program mutations.
7. MOBILE_TRADE_SHEET_SPEC.md (see §6C). DEVNET_VERIFICATION.md skeleton (§6D).
8. Update README/DEPLOY truthfully.

**Tests:** CI fails if a route/control has no owner/priority/capability state; `npm run build`/`lint`/test commands exit non-zero on zero collected tests; undocumented simulation/fixture claims catalogued.

**Rollback:** doc/test additions only.

## §6A — CAPABILITY_STATES.md exact copy

```
verified-live      → "Live · verified on-chain at slot {slot} ({verified_at_utc})"
confirmed-indexing → "Indexing confirmed · signature {sig} pending finalization"
stale              → "Stale · last verified {verified_at_utc}, >{threshold}s ago — reconnecting"
degraded           → "Degraded · {reason} (RPC/Worker) — trading disabled"
fixture/demo       → "Demo data · not live" (visually distinct, never in production read path)
planned            → "Planned · not yet available"
unavailable        → "Unavailable · {reason}" (AI disabled / wallet absent / feature flag off)
```
No control may render `verified-live` without a fresh `verified_at` timestamp and known slot.

## §6B — FEATURE_FLAGS.md exact keys/defaults

| Key | Default | Enabled | Disabled | Verification |
|---|---|---|---|---|
| CHAIN_INDEXING_REQUIRED | true | Worker must verify/index before UI shows trade | trade UI disabled/degraded | source scan: no postTrade/createTokenServer in route graph |
| REALTIME_ENABLED | false | DO WebSocket fan-out (post-core) | verified REST polling + `stale`/`reconnecting` labels | reconnect/stale UI test |
| AI_ENABLED | false | Bard/Oracle advisory with provenance | AI controls hidden, `unavailable` copy | AI contract test (disabled returns unavailable) |
| SOCIAL_WRITES_ENABLED | false | wallet-signed comments/likes/referrals | read-only; write controls hidden | anon-write test fails closed |
| MIGRATION_ENABLED | false | Raydium CPMM graduation after proof | `migration ready` state only | negative migration test |
| LEGACY_MIGRATION_SWEEP | false | (deprecated) old sweep if explicitly enabled | legacy `migrate` returns `LegacyMigrationDisabled` | negative test: authority cannot sweep |
| FIXTURES_ENABLED | false | (test/demo only) fixture data | no fixture in production read path | CI fails if true outside test config |

Startup validation rejects unknown/missing keys. CI fails if deployed defaults drift or FIXTURES_ENABLED true outside test-only config.

## §6C — MOBILE_TRADE_SHEET_SPEC.md

Bottom-sheet trade sheet: safe-area insets, touch targets ≥44px, thumb-zone buy/sell, one-hand amount entry, keyboard-dismiss on submit, focus trap, screen-reader transaction summary **before** wallet prompt, explicit fee/recipient/cluster/min-out, disabled when offline/degraded/unverified. No optimistic price mutation.

## §6D — DEVNET_VERIFICATION.md skeleton

Documents per-tx verification commands, failure modes, assertions, rollback steps. No wallet secrets or unverified claims.

---

## WU-01 — Contract Decomposition, Math Invariants, Security Gate, Compatibility Spikes

**Depends on:** WU-00 + G2
**Objective:** Make curve testable/auditable; prove Token-2022 + Raydium CPI feasibility before lifecycle change.

**Files:**
- Split: `programs/hermes-curve/.../lib.rs`
- Create: `math.rs`, `state.rs`, `events.rs`, `error.rs`, `instructions/{initialize,create_token,buy,sell,migrate}.rs`
- Create: `programs/hermes-curve/tests/{curve-invariants,curve-negative,raydium-cpmm-poc}.ts`
- Create: `docs/launchpad/{TOKEN_2022_DECISION.md, RAYDIUM_CPMM_MANIFEST.md}`

**Steps:**
1. Failing pure-math tests: zero amounts, max, fee rounding, virtual/real reserve updates, truncation, slippage boundaries, overflow/revert.
2. Extract checked quote/fee/reserve fns into tiny pure modules; preserve serialized layout + discriminators until G2 decides.
3. Negative instruction tests: wrong config/fee/creator/mint/PDA/ATA/token program, unauthorized migration, migration before complete, repeat migration, account substitution.
4. Decode/assert `TradeEvent`/`MigrationReady`/`Migrated` bytes.
5. Local fast tests (LiteSVM/Mollusk) + integration (Surfpool/validator) create→buy→sell→complete→migration. Test-only threshold; never weaken deployed devnet threshold.
6. **WU-01b Token-2022 spike (time-boxed):** attempt Raydium pool creation/swap with Token-2022; wallet support, extension init, indexer decode. Output TOKEN_2022_DECISION.md. If fail → lock `TOKEN_STANDARD=classic`, defer hooks.
7. **Raydium CPMM CPI PoC (prerequisite for WU-02):** add `raydium-cpmm`/equivalent dep; enumerate 15+ required accounts in `raydium/accounts.rs`; local + devnet proof with CU/fees/LP lock receipt. Output RAYDIUM_CPMM_MANIFEST.md.
8. Audit config/upgrade/migration roles; record upgrade-lock policy before mainnet planning.

**Tests:** property/fuzz no silent overflow; invariant `custody == real token reserve` + SOL accounting after every instruction; IDL-compatible where declared; Raydium PoC account manifest + LP lock.

**Rollback:** refactor preserves layout/IDL; abort on mismatch. No devnet upgrade.

---

## WU-02 — Versioned Graduation: Non-Custodial Raydium Feasibility + Lifecycle

**Depends on:** WU-01 + G2 + G3 + G4 + Raydium PoC
**Objective:** Replace authority sweep with provable graduation; no invented Raydium claim.

**Files:**
- Create: `state/migration.rs`, `instructions/{prepare_migration,finalize_migration}.rs`, `raydium/{cpmm.rs,accounts.rs}`
- Modify: `Cargo.toml` (add Raydium dep), `Anchor.toml`, IDL/client
- Create: `tests/raydium-migration.ts`, `docs/launchpad/RAYDIUM_COMPATIBILITY_DECISION.md`

**Steps:**
1. Build/verify **Raydium CPMM on-chain pool creation** on devnet as mandatory core. Assert every account, mint ordering, initial amounts, CU, LP destination.
2. LP token burn/lock is explicit non-optional graduation path for 100% completed curves.
3. Companion versioned PDA for new lifecycle/pool metadata; preserve `Curve` account + program ID.
4. States: `CurveActive → MigrationReady → MigrationPrepared → PoolCreated → Finalized`, each immutable-emitted + idempotent/retry rules.
5. Whitelist Raydium program/config; finalizer permissionless or deterministic-state-constrained; never transfers to server wallet.
6. LP policy before code: burn/lock/transparent recipient, recoverability, UI disclosure. Test no unauthorized redirect.
7. **Legacy `migrate` feature-flagged `LEGACY_MIGRATION_SWEEP=false`** with `LegacyMigrationDisabled` error when off; deprecation warning when on. Negative test: configured legacy authority cannot sweep by default.
8. G4 spike result decides Token-2022; if deferred, referrals off-chain XP only, UI says so.

**Tests:** CPMM pool + LP lock on 100% completion; idempotent finalization; failure after each stage, bad config, reordered mints, wrong vaults/LP, insufficient funds, unauthorized caller, CPI rollback; devnet proof with verified pool address + LP lock receipt.

**Rollback:** feature-flag graduation UI; original curve usable. Forward-only companion-state fixes.

---

## WU-03 — Typed Solana Client, Wallet Standard, Simulation-first Trading

**Depends on:** WU-01; WU-02 only for migration controls
**Objective:** Remove hand-maintained assumptions via typed client + Wallet Standard; **Kit migration gated behind passing `test:client`**.

**Files:**
- Create: `src/lib/chain/{client,quotes,simulation,transaction-status}.ts`, `src/lib/wallet/{provider,signer,session,message}.ts`, `src/lib/program/hermes-curve-client.ts`
- Modify: `src/lib/solana.ts` (enhance with typed IDL builders; **retain v1 adapter** until Kit path passes), `src/lib/api.ts`, `{WalletButton,CreateTokenModal,TokenModal}.tsx`
- Create: `src/components/trade/{TradePreview,TradeFailure,TransactionReceipt}.tsx`, `*.test.ts(x)`

**Steps:**
1. Standardize via `@solana/web3.js` v1 + Wallet Standard interfaces first; generate typed builders from checked-in IDL.
2. Kit migration only after `test:client` (mocked Wallet Standard) passes for connect/disconnect/refuse/unsupported/sign-fail/timeout/preflight-fail/retry. Retain v1 adapter behind flag until devnet create→buy→sell→index passes.
3. `simulateTrade` before `requestWalletSignature`; disable confirm if mismatch/stale/unknown config/preflight fail.
4. Review sheet: devnet cluster, program, mint, signer/fee payer, input, min out, price impact, fee recipients/amounts, rent/priority, failure mode.
5. Wallet Standard signer with capability detection + safe unsupported state. Never silently use `window.solana`.
6. Fresh blockhash, `skipPreflight:false`, timeout, signature receipt, Explorer link, `pending index` status; call verified index endpoint; **no optimistic mutation** until Worker confirmation.
7. Read paths use typed codecs verifying owner/data length/discriminator; expose `verified_at_slot`/freshness.
8. **Quarantine fake-write paths:** delete `createTokenServer` + all callers; remove `POST /api/tokens` from production/devnet routing (return stable `410 OFFCHAIN_CREATE_DISABLED`, zero D1 mutation); `CreateTokenModal` calls only the verified signature-only create-index endpoint after signed tx.

**Tests:** mocked Wallet Standard matrix; transaction builder asserts program ID/accounts/signer bits/amount encoding/PDAs from IDL; browser test proves no wallet prompt when simulation fails or stale; source scan prohibits `postTrade`/`createTokenServer`/`POST /api/tokens` in route graph; zero optimistic-state UI tests.

**Rollback:** retain v1 adapter behind disabled flag until all devnet tests pass.

---

## WU-04 — Verified Worker Indexer, Truthful Read Model, /health

**Depends on:** WU-01 + WU-03
**Objective:** Worker = source-verifying indexer; never transaction simulator/client-trust API.

**Files:**
- Split: `workers/worker.js` → `workers/src/{router,cors,validation,response,rate-limit}.js`
- Create: `workers/src/chain/{rpc,decode-events,reconcile,verify}.js`, `workers/src/indexer/{tokens,trades,fees,backfill}.js`, `workers/src/auth/{nonce,verify-message,session}.js`
- Create: `workers/schema_v4.sql`, `workers/migrations/`, `workers/tests/{chain,router,indexer,auth}.test.js`
- Modify: `wrangler.toml`

**Steps:**
1. Delete/quarantine server-side curve simulation + `POST /api/trades`. Tests use explicit fixture server; production returns truthful deprecation/error.
2. Decode Anchor discriminator + arg bytes for create/buy/sell/migration. Validate `meta.err == null`, cluster/RPC policy, full account list (incl. lookup-table), program ID, expected accounts, PDA derivations, mint ownership, instruction signer.
3. Decode canonical events from logs via IDL codecs; cross-check vs instruction args + pre/post balances/inner instructions; reject conflicting/incomplete.
4. **Token-create index = signature-only:** replace `POST /api/tokens/register` with endpoint accepting only `signature` + optional correlation ID; decode Anchor create instruction/event + account data to derive mint/creator/name/symbol/URI/state; **reject/ignore all client metadata** (name/ticker/emoji/creator/mint). `worker.js:168-187` client-trust path removed.
5. Idempotency keyed by signature + program ID; confirmed vs finalized explicit; bounded backoff; `indexing_pending`/`verification_failed` states.
6. D1 append/read: `chain_events`, `indexed_transactions`, `token_snapshots`, `fee_transfers`, `holders`, `migration_records`, `indexer_checkpoints`. Additive/checksum-safe migrations.
7. Backfill/reconciliation job from configured RPC + saved slot; never mutates curve state.
8. Replace permissive CORS with approved Pages + local origins; OPTIONS, JSON/schema/body limits, rate limits, security headers, request IDs, redacted errors.
9. **`GET /health` schema** (see §4A): sanitized readiness/dependency state; never leaks config; down RPC labeled unhealthy.

**§4A — /health response schema**
```json
{ "status": "ok|degraded|down",
  "cluster": "devnet",
  "program_id": "9K5e...",
  "rpc": { "status": "ok|degraded|down", "latency_ms": 0 },
  "d1": { "status": "ok|down" },
  "indexer_lag_slots": 0,
  "flags": { "CHAIN_INDEXING_REQUIRED": true, "REALTIME_ENABLED": false },
  "verified_at": "2026-08-07T..." }
```

**Tests:** fixtures (valid + malformed discriminator/wrong account/mint/signer/changed log/failed meta/v0 lookup/dup sig/timeout/event-balance mismatch); Worker 403/422 for forged requests, never inserts from request fields; D1 reconciles to exact base units; source scan proves no `postTrade`/`createTokenServer`/`POST /api/tokens`/client-trusted register in production route graph; /health never leaks secrets.

**Rollback:** `CHAIN_INDEXING_REQUIRED=true`; on failure, trade UI disabled/degraded, read-only records accessible.

---

## WU-05 — Wallet-bound Social, Referrals, Creator Economics, AI Honesty

**Depends on:** WU-04 + G5 + G6
**Objective:** Engagement without spoofable identity, fake financial data, or AI authority creep.

**Files:**
- Create: `workers/src/social/{comments,likes,profiles,quests,referrals}.js`, `workers/src/ai/{bard,oracle}.js`, `workers/src/creator/fees.js`
- Create: `src/components/{CreatorDashboard,VerifiedFeeLedger,CapabilityBadge}.tsx`
- Modify: `worker.js`, `schema_v4.sql`, `src/lib/{api,identity,tokens}.ts`, `TokenModal.tsx`, `Home.tsx`

**Steps:**
1. Domain-bound signed-message session: server nonce, audience/origin, devnet cluster, issued/expiry, one-time, Ed25519 verify, replay record, wallet binding. Anonymous = read-only.
2. Require session for comments/likes/profile/check-ins/referrals/quests/creator pages. Rate-limit by wallet/session/IP; length/URL/content validation.
3. Referral attribution only on first authenticated action. No financial referral rewards unless G4/G5 produces compatible audited on-chain path.
4. Replace simulated PnL/holder/leaderboard with verified indexed metrics or `unavailable`. XP off-chain game state, labeled non-financial.
5. Creator fee ledger from verified `fee_transfer` events. Direct payout → show `paid directly` per tx; no fake withdraw balance.
6. **AI provenance contract** (see §5A): Bard/Oracle return `{status, result, provenance, unavailable_reason}`; never silently reuse stored lore/risk as fresh. UI renders provenance for available; `unavailable` state replaces scored/actionable AI.
7. AI failures → no invented lore/risk; never changes ranking/price/fees/eligibility/trade.

**§5A — AI response contract**
```ts
type AiResponse = {
  status: "available" | "unavailable";
  result: string;
  provenance: { service: string; model: string; generated_at: string;
                source_kind: "onchain" | "offchain"; source_slot_or_verified_at: string;
                disclaimer: string };
  unavailable_reason?: "disabled" | "provider_timeout" | "provider_error" | "invalid_output";
};
```

**Tests:** replay/cross-origin/expired-nonce/wrong-wallet/forged-signature/anon-write fail closed; AI injection metadata cannot alter behavior; timeout/error → defined unavailable; creator ledger totals == indexed verified fee events; **runtime copy audit** finds no unqualified "live"/"AI verified"/"risk score"/"earned"/"paid out" without owning evidence source; AI contract tests for available/disabled/timeout/error/malformed/stale.

**Rollback:** disable AI/social via server flags; read-only token pages + trading remain. Additive schema only.

---

## WU-06 — Verified Real-time Event Plane (P0 = Polling; DO post-core)

**Depends on:** WU-04 + G7
**Objective:** Replace misleading fixed polling with bounded verified-event stream + graceful fallback. **Durable Objects deferred to post-core (P1); P0 ships verified REST polling.**

**Files:**
- Create: `src/lib/realtime/{protocol,client,reducer}.ts`, `src/hooks/useVerifiedTokenStream.ts`
- Modify: `Home.tsx`, `TokenCard/TokenModal/KingOfHill/Ticker.tsx`
- (Post-core) `workers/src/realtime/{token-room,events,publish}.js`, `wrangler.toml` DO binding

**Steps:**
1. **P0:** verified REST polling of read API with explicit `stale`/`reconnecting` labels; no DO in P0 release.
2. (Post-core P1) DO WebSocket fan-out of verified events only; schema: version, event ID/signature, mint, slot, `verified_at`, sequence, payload type; no raw untrusted text.
3. Client sequence/dedup/order, exponential reconnect + jitter, subscription limits, stale timer, visibility-aware disconnect.
4. Separate `live verified`/`indexing pending`/`stale`/`reconnecting`/`offline`. WebSocket alone ≠ current price.
5. Token-page live feed, volume/holder updates, curve progression, receipt-aware transitions. Never mutate from client-submitted values.

**Tests (P0):** polling staleness + reconnect label UI tests; load note for sub-second claim deferred to DO phase. **(Post-core):** DO upgrade rejection, hibernation wake, broadcast, close/error, malformed, backpressure, reconnect, dup/out-of-order, restart; browser stale-after-disconnect + recovery to exact snapshot.

**Rollback:** `REALTIME_ENABLED=false` → verified REST polling + `live updates unavailable`; no static demo data.

---

## WU-07 — Product Parity UX, Mobile PWA, Honest Launch Lifecycle

**Depends on:** WU-03 + WU-04 + WU-06
**Objective:** Minimum complete launch/trade/discovery/creator journey; mobile-first; no deceptive patterns.

**Files:**
- Create: `src/components/launch/{LaunchForm,MetadataPreview,LaunchReceipt}.tsx`, `src/components/market/{VerifiedChart,LiveTradeFeed,HolderList,GraduationPanel}.tsx`, `src/components/mobile/{TradeSheet,BottomNav}.tsx`, `src/components/status/{DataState,NetworkState}.tsx`, `src/pages/{TokenPage,CreatorPage,ActivityPage}.tsx`, `public/{manifest.webmanifest,offline.html,icons/}`, `src/service-worker.ts`, `src/styles/accessibility.css`
- Modify: `Home.tsx`, `{TokenCard,TokenModal,CreateTokenModal,Ticker,WalletButton}.tsx`, router, `vite.config.ts`, global CSS
- Create: `src/**/*.test.tsx`, `tests/e2e/{launch,trade,discovery,mobile,pwa}.spec.ts`

**Steps:**
1. Route model: discover feed, verified token page, launch form, creator dashboard, activity/receipt, share links. Samples for valid/missing/stale/migrated.
2. Launch form validates name/symbol/URI/media client + Worker-side; R2 upload = content-type/size checks, opaque keys, explicit failure; no trusted remote URLs.
3. Quote/trade sheet (per §6C) makes costs/impact/min-out/fee split/phase/program/cluster/receipt legible; one primary action; no auto wallet prompt; disabled on unverified.
4. Charts from `chain_events`/snapshots with granularity + missing-data state; no synthetic sparklines as history.
5. Graduation UI from lifecycle records: active/migration ready/pool creating/pool verified/unavailable; Explorer/Raydium links only after validated addresses.
6. Discovery with verified filters/search/sort, live activity, demo exclusion, creator profile, report/block links (P1), share cards; avoid unverified "trending"/follower/holder claims.
7. PWA manifest, install, offline shell, service-worker cache that never caches mutable quotes/trade state as fresh, offline trade-disable banner.
8. Mobile primary: safe-area, ≥44px targets, focus traps, keyboard nav, skip link, reduced motion, high contrast, no color-only signals, screen-reader tx summary. **No optimistic mutation; trade sheet inert offline/degraded.**

**Tests:** Playwright browse→connect→review→user-approved devnet trade→pending index→verified receipt (disposable funded wallet; stop if unauthorized); mobile viewport/keyboard/screen-reader/reduced-motion/no-JS/offline/slow-network/unsupported-wallet/stale-API; PWA manifest/SW audit; offline disables signing/trading; **Lighthouse CI PWA score ≥90 gate**.

**Rollback:** route/feature flags hide unverified views; static info pages live; never cache/replay signing request.

---

## WU-08 — Security, Reliability, Abuse Defense, Observability

**Depends on:** WU-02 through WU-07
**Objective:** Safe to operate, honest under partial failure.

**Files:**
- Create: `workers/src/security/{headers,origins,limits,abuse}.js`, `workers/src/ops/{health,metrics,alerts,flags}.js`, `docs/launchpad/{THREAT_MODEL,RUNBOOK,ROLLBACK,INCIDENT_RESPONSE}.md`
- Modify: `wrangler.toml`, routing, CI, README/DEPLOY

**Steps:**
1. Threat model: spoofed tx, forged index, RPC equivocation/outage, account substitution, replayed social sig, fee redirect, migration/LP theft, metadata injection/XSS, D1 abuse, WS amplification, supply-chain/upgrade-key risk.
2. Restrictive CORS/origin, CSP, `frame-ancestors`, sanitization, HSTS at host, body/request limits, cache-control, redacted errors. Test allowed + rejected origins.
3. Fixed approved RPC endpoints + health checks + bounded failover; endpoint failure → capability state, never alternate program/cluster/off-chain quote.
4. Rate limiting/abuse for signing nonces, create/register/index, comments/likes/AI, WS connects, backfill. Rate-limit Worker surface only, not on-chain tx.
5. Privacy-minimized metrics: indexer lag, RPC error rate, WS errors, verification rejects, AI availability/cost, D1 errors, client capability state. No wallet PII beyond public addresses; no raw secrets/log payloads.
6. Exact flags/owners/defaults/verification/disable/rollback per §6B. Defaults fail closed in deployed envs.
7. D1 migration/export/restore, remote migration lock/checksum, Worker/Pages rollback, program upgrade rollback limits, incident templates. **RUNBOOK.md with exact rollback commands:**
   - Worker rollback: `wrangler deploy --oldest` (or `wrangler rollback <version>`); verify `GET /health` returns `ok` post-rollback.
   - Pages rollback: `wrangler pages deployment list` → `wrangler pages deployment tail <id>` to promote last verified deployment; or dashboard "Rollback".
   - D1 repair: `wrangler d1 execute hermes-launchpad-db --file=workers/migrations/<forward-repair>.sql` only after `wrangler d1 export` backup + equivalence proof; never edit applied migration files.
   - Feature disable (no deploy): set `AI_ENABLED=false SOCIAL_WRITES_ENABLED=false REALTIME_ENABLED=false MIGRATION_ENABLED=false LEGACY_MIGRATION_SWEEP=false FIXTURES_ENABLED=false` via Wrangler/Dashboard secret bindings; deploy var change only.
   - Trading disable (degraded): `CHAIN_INDEXING_REQUIRED=true` + remove Worker trade-read routes or return `503 degraded`; UI shows `degraded` capability state.
   - Deployed Solana program is immutable: no rollback possible without separately approved remediation; document freeze + new-program migration path in UPGRADE_AUTHORITY.md.

**Tests:** positive/negative per threat-model control; rollback drill turns every optional service off while preserving verified read-only history + explicit trading state; /health sanitized, never labels down RPC healthy.

**Rollback:** server-side controls, documented defaults, tested enabled→disabled→enabled. No secret rotation without separate approval.

---

## WU-09 — Complete Devnet Evidence, Release Candidate, Documentation Skill

**Depends on:** WU-00 through WU-08
**Objective:** Prove end-to-end without fabricated claims; codify workflow.

**Files:**
- Create: `docs/launchpad/{E2E_EVIDENCE,RELEASE_CHECKLIST,KNOWN_LIMITATIONS,DEVNET_VERIFICATION}.md`
- Modify: `README.md`, `DEPLOY.md`, CI workflow files (add `devnet-e2e` job)

**Steps:**
1. Pin toolchain versions + dep locks. CI jobs: lint/build/unit/browser, Worker tests, program build/tests, IDL/client consistency, dep audit, secret scan, source-truth scan (postTrade/createTokenServer/POST /api/tokens prohibited), **Lighthouse PWA ≥90**.
2. Disposable local/Surfpool suite: full math + security matrix. Record command/versions/duration/counts.
3. **`devnet-e2e` CI job (blocked-when-absent):** preflight disposable wallet pubkey, secure signer availability, devnet cluster, min balance, explicit protected-environment/user-approval artifact. If any prerequisite absent/insufficient/unapproved → emit `E2E_BLOCKED_WALLET_UNAVAILABLE` (or specific reason), perform no tx, exit non-zero. When present → create→simulate→buy→verified index→fee-ledger→sell→negative auth→graduation evidence; redact secrets; upload signed tx URLs/slots + test evidence. CI tests for absent-wallet/insufficient-funds/missing-approval blocked paths.
4. Deploy only after local gates pass: Worker preview + disposable D1 migration; Pages preview; non-mutating GET/WS health; then user-approved devnet promotion. One bounded post-deploy verification pass; no loop.
5. Capture public tx/pool/Explorer URLs, slots, evidence hashes, UI screenshots, redacted API responses, test results in `E2E_EVIDENCE.md`. Never call deployed/live merely because build succeeded.
6. Run three independent release reviewers (Anchor/Solana security; product/UX/truth; Cloudflare ops/test/rollback). Any FAIL → new bounded WU + fresh full review.
7. `DEVNET_VERIFICATION.md` per §6D with verified commands, failure modes, assertions, rollback. No wallet secrets/unverified claims.
8. Update superiority scorecard row-by-row; undemonstrated → `planned`/`unavailable`, control removed/disabled.

**Tests:** all CI/local gates green; each E2E journey evidence from source tx through Worker/index/UI; no page/API/status text says mainnet/production-ready/graduated/live/real-time/AI-verified/paid/on-chain without documented proof; release checklist explicit pass/fail/blocked + external prereqs + tested rollback.

**Rollback:** Worker/Pages revert to last verified artifact; D1 forward-only repair after backup; deployed program immutable, needs separate approved remediation.

---

## 7. File Impact Summary

| Area | Primary files | New assets |
|---|---|---|
| Anchor | `lib.rs`, `Cargo.toml`, `Anchor.toml`, tests | math/state/events/instructions/Raydium/Token-2022 modules, lifecycle + PoC tests |
| Typed client | `solana.ts`, `api.ts`, wallet/modal components | Kit client (gated), IDL adapter, simulation/status, quarantine of fake-write paths |
| Worker | `worker.js`, `chain.js`, `wrangler.toml`, schemas | split routing/auth/chain/indexer/realtime/security, /health, append-only migrations/tests |
| UI/PWA | `Home/TokenModal/CreateTokenModal/WalletButton/TokenCard/Ticker` | trade/launch/market/status/mobile, manifest/SW/e2e, MOBILE_TRADE_SHEET_SPEC |
| Ops/docs | `README`, `DEPLOY`, CI | feature matrix, capability/flag docs, threat model, runbooks, evidence, devnet-e2e job |

## 8. Test and Validation Matrix

| Layer | Required proof | Stop condition |
|---|---|---|
| Rust math/program | unit/property + LiteSVM/Mollusk + Surfpool/Anchor | any reserve/fee/PDA/slippage/migration invariant fails |
| Compatibility | Token-2022 spike + Raydium CPMM PoC | spike fail → lock classic SPL; no Raydium claim without proof |
| Client | typed instruction/codec/quote/simulation; Wallet Standard mocks; `test:client` gates Kit | wallet prompt after failed sim/unknown state |
| Worker | tx fixture decode, event/balance reconcile, idempotency, auth/CORS/rate, **signature-only create-index** | body data creates/indexes trade or token without confirmed chain proof |
| Database | append-only migration checksum, reconciliation, backfill | schema migration changes history or dup signatures |
| Real-time | P0 polling staleness + reconnect labels; (post-core) DO lifecycle/load | stale shown as live or unverified event broadcast |
| UI | Playwright desktop/mobile/a11y/PWA/offline/slow; **Lighthouse PWA ≥90** | mock/demo ambiguity, inaccessible trade, cached quote execution |
| Devnet | user-approved disposable-wallet create→buy→sell→index→fee→migration; **CI blocked when wallet absent** | no signed source tx, mismatched indexed outcome, prereq absent |
| Release | fresh three-reviewer gate, source-truth copy audit, rollback drill | any FAIL or unsupported capability claim |

## 9. External Prerequisites / Blocking Conditions

| Prerequisite | Needed for | If absent |
|---|---|---|
| Upgrade authority + public deployment/IDL evidence | V2 lifecycle on current ID | stop at local/devnet compat; no upgraded-program claim |
| Disposable funded devnet wallet + explicit approval | live E2E | deterministic local tests only; CI marks `E2E_BLOCKED_WALLET_UNAVAILABLE` |
| Cloudflare Worker/D1/Pages access + approved secret bindings | staging/deploy/R2 | verify locally; no mocked remote success |
| Raydium devnet program/config compat | graduation proof | retain `migration ready`; no DEX graduation claim |
| Wallet Standard test wallet | sign/send browser path | test unsupported-wallet; no injected key |
| Reliable approved RPC endpoints | indexer/quotes | fail closed degraded; no arbitrary endpoint |
| AI binding/model availability | Bard/Oracle | hide/disable with unavailable; trading unaffected |

## 10. Risks, Trade-offs, Explicit Non-Goals

| Risk / trade-off | Decision |
|---|---|
| Raydium CPI complex, pool config evolves | CPMM evidence-first; CLMM/Token-2022 gated |
| V1 layout can't absorb fields | companion versioned PDA or approved migration; no destructive realloc |
| Kit wallet migration may not support legacy partial-sign | contained adapter until evidence; never remove v1 prematurely |
| Worker not chain source | verifies/indexes only; request fields never decide trade state |
| D1/DO eventual stale presentation | verified slot/time, monotonic events, snapshot reconcile, visible degraded |
| AI output misleading/injectable | advisory/optional/isolated; sanitized inputs; no protocol authority |
| "Best" UX changes fast | benchmark testable journeys + a11y/perf data; no vague claims |
| Mainnet legal/economic/custody obligations | out of scope; separate approved mainnet readiness plan after devnet evidence |

## 11. Open Questions Requiring Explicit Decision Before Execution

1. **G2:** Is upgrade authority for current devnet program available; must program ID stay immutable for V2 lifecycle? (recorded in UPGRADE_AUTHORITY.md)
2. **G3:** Does verified Raydium devnet target support chosen CPMM with current toolchain; permanent LP policy?
3. **G4:** Is Token-2022 required for first release given compat risks, or wait? (WU-01b decides)
4. **G5:** Creator fees direct per-trade (current truthful model) or claimable escrow?
5. **Product scope:** Does "superior" require R2 media/notifications/reporting/creator-analytics in first devnet release, or ship as `planned` after core safe-trading? (§2 matrix: R2/notifications/analytics = P2)
6. **Governance:** Upgrade/migration authority policy (single key/multisig/timelock/eventual lock) for devnet + later mainnet?

## 12. Plan-review Gate Record

- **Revision:** draft r2 → **GATE PASSED (2026-08-07, cycle 3)**
- **Gate history:**
  - Cycle 1 (deleg_0dfcde21): FAIL — 6 feasibility + 9 completeness + 7 scope/UX
  - Cycle 2 (deleg_21240763): FAIL — 6 feasibility + 5 completeness + scope/UX error (HTTP 403)
  - Cycle 3 (deleg_051cafc3): **PASS** — 0/0/0 blocking (all three reviewers PASS on plan-design adequacy)
- **Incorporated amendments (r2):** test infra as WU-00 Step 0; release scope matrix P0/P1/P2 (§2); FEATURE_FLAGS.md exact defaults (§6B); CAPABILITY_STATES.md exact copy (§6A); MOBILE_TRADE_SHEET_SPEC.md (§6C); DEVNET_VERIFICATION.md; UPGRADE_AUTHORITY.md; legacy `migrate` feature-flag `LEGACY_MIGRATION_SWEEP=false` + `LegacyMigrationDisabled` + negative test; Raydium CPMM dep + accounts.rs + PoC before WU-02; Token-2022 spike WU-01b; Kit migration gated behind `test:client`; quarantine `createTokenServer`/`POST /api/tokens`/client-trusted register → signature-only create-index; AI provenance contract (§5A); Worker `/health` schema (§4A); DO deferred to post-core (P0 = verified REST polling); remove optimistic UI mutations (Guardrail 12); Lighthouse PWA ≥90 CI gate; devnet-e2e CI job blocked-when-absent (`E2E_BLOCKED_WALLET_UNAVAILABLE`); RUNBOOK.md exact rollback commands (WU-08 step 7).
- **Frozen digest:** computed at save; plan is APPROVED FOR USER REVIEW (not yet executed).
- **Required reviewers:** feasibility/program architecture; completeness/verification; scope/UX/operations — all three PASS.
- **Rule:** all three PASS same frozen revision; gate closed at cycle 3.

---

## Execution Handoff

This is a **plan only**. No code/deploy/migration/Cloudflare/on-chain action performed while producing it.

After gate passes: user approves decision gates (G2/G3/G4/G5), then WU-00 only.
