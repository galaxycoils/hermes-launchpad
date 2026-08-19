# Hermes Launchpad — What's Next (2026-08-18) — REVISED v3

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.
> Follow **TDD** (red → green). Use checkboxes (`- [ ]`). One task at a time. Stop at Definition of Done.

**Goal:** Finish remaining **devnet preview** UX and proof work. Create → index is already live. Do **not** redo RPC discovery unless index breaks.

**Related plans:**
- `2026-08-16-hermes-endgame-super-ready.md` (full endgame)
- `2026-08-17-hermes-whats-next.md` (prior short queue)

---

## Live baseline (2026-08-18)

| Check | Value | Status |
|-------|-------|--------|
| API health | OK | ✅ |
| Pages | 200 | ✅ |
| Pages `/rpc` | 200 | ✅ |
| Tokens | 12 | ✅ |
| **`onchainMint`** | **3** (SMOKE, HNQ, **CX**) | ✅ improved |
| Index create | 200 `already` | ✅ |
| Fee wallet | ~16.2 SOL | ✅ |
| Demo vs on-chain badges | **PARTIALLY LIVE** — `TokenCard.tsx:18` renders `onchain`→"On-chain"; `Badge.tsx` accepts `onchain` variant; `TokenModal.tsx:63-64` already branches on provenance | ⚠️ acknowledge |
| Devnet preview banner | Not yet present | ❌ |
| Buy + sell smoke + Explorer docs | Not verified in product | ❌ |
| Worker tests locking index | `token-index.test.ts` + `trade-index.test.ts` exist | ⚠️ acknowledge |
| Full suite + secret scan | Not verified | ❌ |

**Progress since last plan:** third on-chain token (**CX**) indexed. Ship bar still green.

Re-check anytime:

```bash
curl -sS https://hermes-api.tahamtandariush.workers.dev/api/tokens | python3 -c "
import sys,json
d=json.load(sys.stdin)
print('onchainMint',sum(1 for t in d if t.get('onchainMint')))
print([t.get('ticker') for t in d if t.get('onchainMint')])
"
```

If `onchainMint === 0` → Task 0 (RPC restore). Else start Task 1.

---

## Skills to install

```bash
# Core (same family as before)
npx skills add cloudflare/skills@wrangler -g -y
npx skills add cloudflare/skills@workers-best-practices -g -y
npx skills add solana-foundation/solana-dev-skill@solana-dev -g -y
npx skills add sendaifun/skills@helius -g -y
npx skills add jezweb/claude-skills@cloudflare-d1 -g -y

# Docs / up-to-date library APIs
npx skills add intellectronica/agent-skills@context7 -g -y
npx skills add upstash/context7@find-docs -g -y

# Browser / UI verification
npx skills add anthropics/skills@webapp-testing -g -y
```

| Skill | When |
|-------|------|
| **context7** / **find-docs** | Before changing wrangler secrets, Vite env, Vitest, web3 Connection APIs |
| wrangler + helius | Only if index returns 403 again |
| solana-dev | Buy/sell txs + Explorer |
| webapp-testing | Optional browser buy/sell |
| cloudflare-d1 | Only if D1 errors |
| local **tdd** | Every new behavior |

---

## Global rules

1. Devnet only — no mainnet.
2. Never commit API keys, CF tokens, private keys.
3. Never re-add fake `/register`.
4. Never skip on-chain verification.
5. Minimal diffs; TDD for UI/tests.
6. Every task must specify its **file paths**, **acceptance criteria (Given/When/Then)**, **test command**, and **rollback commit** before execution.

---

## Definition of Done

- [ ] UI **Demo** / **On-chain** badges from `provenance` — `provenance === 'demo'` → demo badge; `provenance === 'onchain' || 'index'` → on-chain badge. **Already partially live** (see baseline); only new work if gaps exist.
- [ ] **Devnet preview** banner visible in `TopNav.tsx` (above wallet button) — text includes `Devnet` and `preview`
- [ ] Create + trade call index APIs (code or Network proof) — `CreateTokenModal.tsx` already calls `indexToken`; `useTrade.ts` already calls `indexTrade`. **Already live**; verify only.
- [ ] One buy + one sell indexed; Explorer links in docs
- [ ] Worker tests green for index + list `onchainMint` — `tests/worker/token-index.test.ts` + `tests/worker/trade-index.test.ts` already exist; augment/cover gaps only
- [ ] `lint` + `build` + unit/worker/client/integration/security green **AND** coverage meets `.coverage-thresholds.json` (lines 27, branches 46, functions 26, statements 27)
- [ ] Secret scan clean — `git grep -iE 'api-key=|cfat_|private_key|BEGIN PRIVATE|seed phrase' -- ':!*.md' ':!*.example'` returns empty
- [ ] STOP (no mainnet scope)

---

## Definition of Ready (all tasks)

Before starting any task:
1. The file path in the task resolves to a real file in the repo (verify with `search_files` or read)
2. The acceptance criteria are specific and testable
3. The test command is known and runs against the correct vitest project
4. Coverage threshold from `.coverage-thresholds.json` is noted if the task touches `src/`

---

## Rollback template (all tasks)

If a task's commit breaks the suite or introduces a regression:
```bash
git revert <commit-sha> -m "revert: <task short description>"
# then re-run the task's test command to confirm green
```

---

### Task 0 — Only if index broken

**Definition of Ready:** `onchainMint === 0` on live baseline curl above.

- [ ] Helius free key → verify `workers/wrangler.toml` exists and reads `SOLANA_RPC` (not a different env var) — use **context7** for current `wrangler secret put` syntax if unsure
- [ ] `npx wrangler secret put SOLANA_RPC` (from `workers/` dir with `--config workers/wrangler.toml`)
- [ ] `npx wrangler deploy` (from `workers/` dir)
- [ ] Confirm `onchainMint ≥ 1` again via baseline curl
- [ ] If deploy breaks index → `git revert <deploy-commit>` + rollback template
- [ ] Commit only if Task 0 actually runs (skip if baseline healthy)

Skip if baseline still shows 3 on-chain mints.

---

### Task 1 — Lock index tests (augment existing, do NOT create new file)

**File:** `tests/worker/token-index.test.ts` (exists) + `tests/worker/trade-index.test.ts` (exists)

**Acceptance criteria:**
- Given the worker test harness mocks `fetch` with a successful getTransaction response
- When `POST /api/tokens/index` is called with a valid mint/signature/creator
- Then response status is 201 and body has `ok: true` and `onchainMint` equals the mint
- And the token row is persisted with `onchain_mint` = mint
- Given the worker test harness mocks `fetch` with a successful getTransaction response for a trade
- When `POST /api/trades/index` is called with valid mint/signature/wallet/side
- Then response status is 200 and body has `ok: true`
- And the trade row is persisted with the signature

**Test command:** `npm run test:worker` (vitest project `worker`)

**Coverage:** `.coverage-thresholds.json` lines 27 / branches 46 / functions 26 / statements 27 — must still pass after any augmentation.

- [ ] Read existing `tests/worker/token-index.test.ts` and `tests/worker/trade-index.test.ts` to confirm they already cover the above
- [ ] RED only if a gap exists (e.g. missing trade-index test, missing failure-mode test); otherwise skip
- [ ] If augmenting: add failing test first, watch RED, then fix
- [ ] `npm run test:worker` → green
- [ ] If `npm run test:coverage` fails thresholds → fix before commit
- [ ] Commit: `test(worker): lock on-chain index ship bar` (only if changes made)

SMOKE reference (plan's mint — existing test uses HNQ; use whichever the test already uses; do NOT switch mints without reason):

```
mint=CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f
signature=4Q8bUzXiL8sQd1CwYakj4fmBn8RXVumeC1gH43hLMYeSfLnBSf5qtTjPuTTy2DykwzuwVH3atpRBrd53hgBVQk8C
creator=GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a
```

---

### Task 2 — Demo vs On-chain badges (verify existing, fix gaps only)

**File:** `src/components/TokenCard.tsx` (line 18 — already renders `onchain` variant → "On-chain" label); `src/components/TokenModal.tsx` (lines 63-64 — already branches on provenance)

**Acceptance criteria:**
- Given a token with `provenance === 'demo'`
- When rendered in TokenCard/TokenModal
- Then a demo badge shows (existing `Badge` with `variant="demo"`)
- Given a token with `provenance === 'onchain'` (or `'index'`)
- When rendered
- Then an on-chain badge shows (`Badge` with `variant="onchain"`)

**Note:** `Badge.tsx` accepts `variant="demo"` and `variant="onchain"` — NOT `badge-demo`/`badge-onchain` (no `badge-` prefix). Plan's original naming was wrong; corrected here.

**Test command:** `npm run test:client && npm run build`

**Coverage:** thresholds from `.coverage-thresholds.json` must still pass.

- [ ] Search `provenance` usage across `src/` to confirm current state (already did — `TokenCard.tsx:18`, `TokenModal.tsx:63-64`, `CreateTokenModal.tsx:76`, `lib/tokens.ts:10`, `lib/api.ts:85`)
- [ ] RED only if a provenance→badge gap exists (e.g. `index` provenance not mapped to on-chain badge); otherwise skip
- [ ] If fixing: add failing test first
- [ ] `npm run test:client && npm run build` → green
- [ ] Commit: `feat(ui): demo vs on-chain badges` (only if changes made)

---

### Task 3 — Devnet preview banner

**File:** `src/components/TopNav.tsx` (exists; renders site header with wallet button). No `src/layout/`, `Header.tsx`, or `Footer.tsx` exist — corrected from plan's original wrong path.

**Acceptance criteria:**
- Given the app is running on a devnet host (hostname includes `workers`, `dev`, or `localhost` — see existing `isDevnet()` at `TopNav.tsx:38`)
- When TopNav renders
- Then a banner appears above the wallet button with text containing both `Devnet` and `preview`
- And the banner text reads: `Devnet preview — not mainnet. Use a Devnet wallet and faucet SOL.`
- And the banner is visually distinct from the existing ReferralBanner

**Placement:** Inside `TopNav.tsx`'s returned JSX, above the wallet button / address display, rendered conditionally on `devnet === true` (reuse existing `isDevnet()`).

**Test command:** `npm run test:client && npm run build`

**Coverage:** thresholds from `.coverage-thresholds.json` must still pass.

- [ ] RED: add a client test that mounts TopNav with a devnet hostname mock and asserts the banner text appears
- [ ] GREEN: add the banner to `TopNav.tsx` (conditional on `isDevnet()`)
- [ ] `npm run test:client && npm run build` → green
- [ ] Commit: `feat(ui): devnet preview banner`

---

### Task 4 — Create/trade always call index APIs (verify existing, add trade side only if missing)

**Files:** `src/components/CreateTokenModal.tsx` (line 58 — already calls `indexToken`); `src/hooks/useTrade.ts` (line 101 — already calls `indexTrade`); `src/lib/api.ts` (lines 77-98 — already exports both)

**Acceptance criteria:**
- Given a token create succeeds
- When CreateTokenModal's success path runs
- Then `POST /api/tokens/index` is called (already live — verify, do NOT add)
- Given a trade executes
- When useTrade's executeTrade runs
- Then `POST /api/trades/index` is called with `side: 'buy'` or `'sell'` (already live — verify; add only if the `side` field is missing or wrong)
- Given the index API returns an error
- Then the UI shows an error toast / fallback (NOT specified in original plan — add acceptance criteria here: if index fails, trade/create still succeeds for the user; log error, optionally toast warning)

**Test command:** `npm run test:client && npm run build` (mocked fetch asserts — existing `token-index.test.ts` and `trade-index.test.ts` already cover the server side)

**Coverage:** thresholds from `.coverage-thresholds.json` must still pass.

- [ ] Confirm `CreateTokenModal.tsx` calls `indexToken` after launch (already true at line 58)
- [ ] Confirm `useTrade.ts` calls `indexTrade` with correct `side` (already true at line 101)
- [ ] RED only if the trade `side` field is missing/wrong or error handling is absent; otherwise skip
- [ ] If adding error handling: add failing test first
- [ ] `npm run test:client && npm run build` → green
- [ ] Commit: `fix(ui): create/trade always call index APIs` (only if changes made)

---

### Task 5 — Live buy + sell (automated proof via API, browser optional)

**Definition of Ready:** Devnet wallet with ≥ 1 SOL; `https://hermes-launchpad.pages.dev` is the devnet preview deployment (not a separate production deployment).

**Acceptance criteria:**
- Given a Devnet wallet with ≥ 1 SOL
- When a buy of 0.01–0.05 SOL is made on an on-chain token (SMOKE / HNQ / CX) at `https://hermes-launchpad.pages.dev`
- Then the transaction succeeds on-chain (verify via Explorer) AND the trade is indexed (verify via `GET /api/tokens` → trade appears, or via `POST /api/trades/index` curl returns `ok: true`)
- When a sell of a portion is made
- Then the sell succeeds on-chain AND is indexed
- Given the buy/sell indexed
- When `curl -sS -X POST https://hermes-api.tahamtandariush.workers.dev/api/trades/index -H 'Content-Type: application/json' -d '{"mint":"<MINT>","signature":"<SIG>","wallet":"<WALLET>","side":"buy"}'` is run
- Then response is `{"ok": true}` (or already-indexed response)

**Automated verification (required, not optional):** After live buy+sell, run the curl above for BOTH buy and sell signatures. Both must return `ok: true` (or already-indexed). Record the curl commands + responses in the commit message or a verification note.

**Test command:** `curl` (manual + automated proof); optional `webapp-testing` for browser steps.

- [ ] Wallet on **Devnet**, ≥ 1 SOL (fee wallet `GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a` has ~16.2 SOL — use it or a separate funded wallet)
- [ ] Open on-chain token (SMOKE / HNQ / CX) at `https://hermes-launchpad.pages.dev`
- [ ] Buy 0.01–0.05 SOL → Explorer success → record tx signature
- [ ] Sell portion → Explorer success → record tx signature
- [ ] Index both via curl (buy + sell) — both must return `ok: true`
- [ ] Optional: **webapp-testing** for browser steps (not required if curl proof suffices)
- [ ] Record Explorer links + curl proofs for Task 6 docs
- [ ] No commit required for Task 5 itself (proof step); docs commit in Task 6 captures evidence

```bash
curl -sS -X POST https://hermes-api.tahamtandariush.workers.dev/api/trades/index \
  -H 'Content-Type: application/json' \
  -d '{"mint":"<MINT>","signature":"<SIG>","wallet":"<WALLET>","side":"buy"}'
```

---

### Task 6 — Docs

**Files:** `DEPLOY.md`, `README.md` (both exist)

**Acceptance criteria:**
- Given README/DEPLOY are read
- When the docs are updated
- Then Explorer links exist for: create (existing), buy (new), sell (new)
- And a tester howto section exists: Devnet wallet, faucet URL, prefer On-chain badge
- And honesty statements exist: not mainnet; Demo ≠ on-chain; Worker needs keyed RPC
- And all Explorer URLs are valid (curl each to confirm 200, or note if unavailable)

**Faucet URL:** Use `https://developers.solana.com/docs/guides/explorer/hello-solana` or the current Solana faucet — verify before linking.

**Test command:** `npm run build` (docs are markdown; build confirms no build-breaking changes); optional link-check via `curl` for each Explorer URL.

- [ ] Read current `README.md` and `DEPLOY.md` to see what Explorer links already exist (plan said create is existing; verify buy/sell status)
- [ ] RED: if buy/sell Explorer links or tester howto are missing, add a failing assertion (e.g. a script that greps for the links, or just note the gap)
- [ ] GREEN: add missing Explorer links + tester howto + honesty statements
- [ ] Verify each new Explorer URL returns 200 via curl
- [ ] `npm run build` → green
- [ ] Commit: `docs: smoke proofs and tester howto`

---

### Task 7 — Suite + secrets + STOP

**Definition of Ready:** All prior tasks committed (or skipped with justification).

**Acceptance criteria:**
- Given all tasks are committed
- When the full suite runs
- Then `npm run lint` → exit 0
- And `npm run build` → exit 0
- And `npm run test:unit` → all pass + coverage meets `.coverage-thresholds.json`
- And `npm run test:worker` → all pass + coverage meets thresholds
- And `npm run test:client` → all pass + coverage meets thresholds
- And `npm run test:integration` → all pass + coverage meets thresholds
- And `npm run test:security` → all pass (verify this script exists in `package.json` before relying on it)
- And secret scan returns EMPTY (not just exit 0 — assert no matches)
- And `npm run test:coverage` → thresholds met (lines 27, branches 46, functions 26, statements 27)

**Secret scan pass criteria:** `git grep -iE 'api-key=|cfat_|private_key|BEGIN PRIVATE|seed phrase' -- ':!*.md' ':!*.example'` must produce NO output. If any output, fix before STOP.

**Test command:**
```bash
npm run lint
npm run build
npm run test:coverage   # enforces .coverage-thresholds.json
npm run test:security   # verify script exists first
git grep -iE 'api-key=|cfat_|private_key|BEGIN PRIVATE|seed phrase' -- ':!*.md' ':!*.example' || true
# ASSERT: secret scan output is empty
```

- [ ] Verify `npm run test:security` script exists in `package.json` (line 18: `"test:security": "vitest run --project worker tests/worker/security"`)
- [ ] Run `npm run lint` → green
- [ ] Run `npm run build` → green
- [ ] Run `npm run test:coverage` → green AND thresholds met (this is the enforcement command from `.coverage-thresholds.json`)
- [ ] Run `npm run test:worker` → green
- [ ] Run `npm run test:client` → green
- [ ] Run `npm run test:integration` → green
- [ ] Run `npm run test:security` → green
- [ ] Run secret scan → EMPTY output (assert, don't just ignore exit code)
- [ ] If ANY suite fails or threshold missed → fix, do NOT commit broken state
- [ ] **STOP** — no mainnet scope. Do not proceed to mainnet, Raydium migration, or RPC rebuild.

---

## Order

0 (only if broken) → 1 → 2 → 3 → 4 → 5 → 6 → 7 STOP

## Not next

- Mainnet
- Rebuilding RPC from scratch while `onchainMint ≥ 3`
- Raydium live migration claims

## One-line next action

**Start Task 1 (lock tests — augment existing `token-index.test.ts`/`trade-index.test.ts` only) or Task 3 (devnet banner in `TopNav.tsx`). Index is healthy at 3 on-chain mints.**
