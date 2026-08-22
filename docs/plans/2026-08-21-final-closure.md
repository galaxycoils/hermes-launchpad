# Hermes Launchpad — Final Closure Plan

> **For Hermes:** Execute task-by-task with fresh subagents + two-stage review (spec compliance, then code quality).

**Goal:** Take hermes-launchpad from "redesigned but red-CI and dirty-tree" to verifiably done **within the bounded closure scope below**: every gate green and honestly enforced, every claim evidenced, zero unexplained artifacts.

**Architecture:** Frontend Vite+React19+TS on Cloudflare Pages; Worker `hermes-api` on Cloudflare Workers + D1; Anchor program on Solana devnet (already deployed & proven). Runtime code changes are limited to the two hook-pattern fixes in `Home.tsx` plus CI workflow truth-pass edits; everything else is gates, hygiene, and truth.

**Tech Stack:** npm/vitest/playwright/eslint/react-hooks (React Compiler rules), wrangler, gh CLI.

**Revision history:** v1 failed gate iter 1 (stray e2e/clean-tree gap; continue-on-error conflict + watch blindspot; unbounded DoD). v2 failed gate iter 2 on residual masking paths (feasibility: test-sell2.mjs missing from B0 row + ci.yml test-e2e second exit-0 branch with never-matching `*.spec.ts` glob; completeness: per-line enumeration of ALL exit-0 skip/fallback branches required). v3: B0 row fixed; WU-B6 replaced by exhaustive masking inventory table with per-element actions; release-gate staged set includes workflow edits. Gate iter 3: Feasibility PASS, Scope PASS, Completeness FAIL on two mechanical residuals → **v3.1 (final, gate cap reached)** folds them in: (:123 `cargo install … || true` added to inventory with written justification + verification grep extended to `\|\| true`) and (dangling "Path B" risk-line reference rewritten self-contained). Consultation input: stack-engineer review accepted verbatim.

**Mode:** PRE-EXECUTION PLAN. Repo intentionally sits at pre-execution HEAD. Reviewers judge whether the plan adequately specifies each remediation — NOT whether the repo already reflects it.

---

## Scope Bound (explicit)

**IN scope:** lint/CI green (really green — no masked failures), repo hygiene, coverage gate, local E2E suite, docs truth, provider evidence, live probes.

**OUT of scope (waived, carried forward as current facts — never claimed done):**
1. **Graduation → Raydium CPMM pool creation** — blocked upstream on an unprovisioned devnet `amm_config`; README keeps carrying this as pending. Curve-lock plumbing stays ready-but-unproven end-to-end.
2. **Design-spec §16 KPI evaluation window** (14-day LCP/FCP/bundle/crash-rate go/no-go) — post-launch analytics period, cannot be executed inside a closure push; waived with note in docs.
3. **Mainnet** — devnet only, permanently until separately planned.
4. Any new features, dependency upgrades, schema/API changes.

DoD heading therefore reads "Definition of Done (bounded closure scope)" — finishing THIS project's shippable state, honestly bounded.

---

## Definition of Done (bounded closure scope)

- [ ] Exact final HEAD: CI workflow **and** Deploy workflow green with **every job conclusion == success verified individually via `gh run view --json jobs`** (no continue-on-error masking remains — see WU-B6)
- [ ] Live probes: Worker `/api/health` → `{"ok":true,...}`; Pages → HTTP 200; negative-path API probe returns structured error (not 500)
- [ ] Local: `npm run lint` 0 errors · `npm run build` exit 0 · vitest unit+worker+client+integration all pass · Playwright e2e 100% pass of the post-disposition inventory (WU-D) · coverage ≥ `.coverage-thresholds.json` (27/46/26/27)
- [ ] Tree clean: `git status --short` EMPTY after final push — every pre-existing stray carries an explicit disposition from WU-B
- [ ] Docs state only provider-evidenced facts with run links; graduation/Raydium + §16 KPI carried as pending facts; zero forward claims

---

## WU-0 — Preflight (read-only, ~10 min)

**Objective:** Pin canonical state + capture exact failure surfaces before touching anything.

1. `cd /Users/cmd/workspace/hermes-launchpad && git branch --show-current && git rev-parse HEAD` → expect `main`, `efcb200…`.
2. `npx eslint src/pages/Home.tsx` → exactly 2 known errors (set-state-in-effect :123, preserve-manual-memoization :158).
3. `git ls-files coverage/ | wc -l` (expect 74); `grep -n coverage .gitignore` (absent).
4. Port audit `grep -rn "4173\|4174" playwright.config.ts package.json .github/workflows/` → canonical = package.json#preview **4173** (matches green CI e2e job); config's 4174 = revert target.
5. `contracts/` reference audit → zero references confirmed (abandoned EVM pivot).
6. Strays census: `git status --short | grep '^??'` — full enumeration feeds WU-B disposition table. ✅ DONE in session: 34 top-level entries incl. 6 e2e specs, `.beads/plans/`, `.omh/specs/protocol-architecture-spec.md`, `docs/plans/`, contracts/, ~28 script paths.
7. Secrets audit ✅ DONE in session: `gh secret list` → `CF_ACCOUNT_ID`, `CF_API_TOKEN`, `DEVNET_WALLET` (set 2026-08-08), `SOLANA_RPC` all present; local keypair exists (`~/.config/solana/id.json` → `GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a`, funded). Consequence: any "no DEVNET_WALLET secret" skip branch in ci.yml test-e2e is DEAD CODE against reality — WU-B6 removes it rather than provisioning anything.

**Rollback:** none needed (no mutations).

## WU-A — Lint fix + targeted behavioral tests (TDD)

**Objective:** `npm run lint` → 0 errors, behavior provably unchanged.

**Files:** Modify `src/pages/Home.tsx` (two sites only) · Test `tests/client/home-data-loading.test.tsx` (new).

**A1 — failing tests first** (`tests/client/home-data-loading.test.tsx`): mock `../src/lib/api` (`fetchTokens→[{id:'t1',…}]`, `fetchTrades→[]`, `checkin→null`, `fetchProfile→null`); render `<Home/>`; assert (a) skeleton → token card appears, (b) unmount+remount does not crash and reloads. Run → wiring fails first, then passes with correct mocks; suite must stay green through A2/A3.

**A2 — site 1:** strip sync `setTokensLoading(true)`/`setTokensError(null)` out of `loadData()` (:79) — mount effect (:123) calls `loadData()` only (state writes live in promise callbacks = legal); new `const refresh = useCallback(() => { setTokensLoading(true); setTokensError(null); loadData() }, [loadData])`; retry button (:226) uses `refresh`.

**A3 — site 2:** `handleComment` deps `[selected?.id, wallet, identity]` → `[selected, wallet, identity]`; guard `if (!selected) return`; body unchanged otherwise.

**A4 — verify:** eslint Home.tsx → 0 problems · `npm run lint` → 0 errors · vitest client+unit projects → all green.

**Boundary rule (applies to ALL WUs):** any app-runtime change beyond these two Home.tsx sites HALTS execution → finding logged in gate notes → plan amended before continuing. No drive-by fixes.

**A5 — Commit:** `fix(ui): resolve react-hooks compiler errors in Home data-loading effect`

## WU-B — Repo hygiene + port decision

**B0 — Full stray disposition table** (every WU-0.6 entry gets exactly one):
| Item | Disposition |
|---|---|
| `coverage/**` (74 tracked files) | untrack + gitignore (B1) |
| `contracts/` | preserve-move to `~/workspace/_archive/hermes-launchpad-contracts-evm-pivot` (B2) |
| root test drivers `test-buy.mjs` `test-sell.mjs` `test-sell2.mjs` `test-integration.mjs` | track under `scripts/devnet-smoke/` (proof-cited drivers; sell2 = variant of proof flow, archived history value) |
| root strays `check-balance.mjs` `check-balance2.mjs` `screenshot.cjs` | archive (B3) |
| `scripts/check-*` `scripts/smoke-*` `scripts/live-trade-*` `scripts/create-*ata*` `scripts/debug-*` `scripts/find-curve-ata.js` `scripts/initialize-config.mjs` `scripts/test-ata.js` `scripts/test-ata-create.ts` `scripts/wu04-probe.mjs` + remaining one-off `verify-*` | archive (B3) |
| `scripts/restore-keypair.sh` | KEEP (package.json#program:restore) |
| `scripts/{estimate-cost,external-tools-verify,pr-comments-check,pr-comments-filter}.sh` | KEEP (metaswarm tooling per CLAUDE.md) |
| e2e `devnet-banner-badges.test.ts` `index-api-calls.test.ts` | TRACK (real regression specs) |
| e2e `debug-index/debug-page/debug-page2/debug3.test.ts` | archive to `scripts/archive/devnet-debugging-2026-08/` (one-off diagnostics; keeps Playwright inventory deterministic) |
| `docs/plans/2026-08-21-final-closure.md` | TRACK (this plan; WU-E commit) |
| `.beads/plans/active-plan.md` | replace + TRACK in WU-E |
| `.omh/specs/protocol-architecture-spec.md` | inspect first 30 lines: EVM/foundry content → `~/workspace/_archive`; else TRACK via WU-E docs commit |
| `tests/visual/baseline.test.ts` (orphaned — in no vitest project) | inspect: if dead/duplicate → archive with note in gate notes; else wire into client project. Either way: explained, not silent. |

**B1:** append `coverage/` to `.gitignore`; `git rm -r --cached coverage -q`.

**B2:** `mkdir -p ~/workspace/_archive && mv contracts ~/workspace/_archive/hermes-launchpad-contracts-evm-pivot` (never tracked; NOT deleted).

**B3:** `mkdir -p scripts/devnet-smoke scripts/archive/devnet-debugging-2026-08`; execute table moves; append `scripts/archive/` to `.gitignore`.

**B4 — port:** canonical is 4173 → `git checkout -- playwright.config.ts`. During WU-D, if 4173 is occupied: kill the process (`lsof -ti:4173 | xargs kill -9`) — never edit the port.

**B5 — Commit(s):** `chore: stop tracking vitest coverage output` + `chore: repo hygiene — archive one-off devnet scripts, track proof drivers`

## WU-B6 — CI workflow truth pass (new; resolves DoD/continue-on-error conflict)

**Objective:** no job may pass-by-masking. **Rule: every `continue-on-error` flag AND every in-job exit-0 skip/fallback branch is removed — the only permitted exceptions get an explicit written justification in this plan.**

Exhaustive masking inventory (verified against ci.yml/deploy.yml at HEAD):

| Job | Masking element | Action |
|---|---|---|
| ci.yml worker-check (:28) | `continue-on-error: true` | DELETE |
| ci.yml worker-check (:40–43) | shell-guard skip when `CF_API_TOKEN` empty | DELETE (secret verified present, WU-0.7) |
| ci.yml worker-check (:44–47) | second exit-0 fallback `npx wrangler@4 deploy --dry-run \|\| { echo WORKER_CHECK_WARNING…; exit 0; }` | REMOVE fallback → bare dry-run (failure must fail job) |
| ci.yml test-program (:108) | `continue-on-error: true` | DELETE |
| ci.yml test-program (:124–127) | non-secret-gated exit-0 fallback `anchor build … \|\| { echo TEST_PROGRAM_SKIPPED…; exit 0; }` | REMOVE fallback → bare anchor build+test |
| ci.yml test-program (:128–138) | DEVNET_WALLET secret-gated skip branch | REMOVE gating — secret exists since 2026-08-08 (WU-0.7); keep wallet-file setup unconditioned |
| ci.yml test-e2e (:144) | `continue-on-error: true` | DELETE |
| ci.yml test-e2e (:153–161) | DEVNET_WALLET secret-gated skip | REMOVE gating — dead code vs reality (WU-0.7) |
| ci.yml test-e2e (:162–165) | second exit-0 skip "no e2e specs" + `*.spec.ts` glob that NEVER matches (`*.test.ts` is this repo's naming) — job currently exits 0 having run nothing | DELETE entire branch — post-B0 there are provably ≥5 spec files; if glob guard desired, use `*.test.ts`, but simplest truth: run Playwright unconditionally |
| ci.yml test-program (:123) | optional toolchain pre-install `cargo install cargo-build-sbf --locked 2>/dev/null \|\| true` | KEEP with written justification: this is a redundant best-effort pre-install; the immediately following bare `anchor build` (:124, post-remediation, fallback removed) enforces the real outcome — missing toolchain fails the job. No pass-by-masking possible. |
| ci.yml blocked-checks (:171) | echo claims "Program and E2E require DEVNET_WALLET secret" — factually false now | UPDATE text or delete job |
| deploy.yml deploy-worker (:47) | `continue-on-error: true` | DELETE |
| deploy.yml deploy-worker (:62) | exits-0 `failure()` notify step | REPLACE with real failure propagation (remove step or make it non-masking) |

1. Execute the table. No new flags/branches introduced.
2. Verify locally: no actionlint installed → `python3 -c "import yaml,glob;[yaml.safe_load(open(f)) for f in glob.glob('.github/workflows/*.yml')]"`; plus `grep -nE "continue-on-error\|exit 0\|\|\| true" .github/workflows/*.yml` → every hit maps to a table row (flag/skip/fallback = gone; sole survivor = the justified :123 `|| true`).
3. **Commit:** `ci: remove continue-on-error masking — all jobs enforce real pass`

## WU-C — Coverage gate (measured)

`npm run test:coverage` → parse terminal table → assert ≥ lines 27 / branches 46 / functions 26 / statements 27; record actuals in gate notes. Short on any metric → STOP, add minimal targeted tests for uncovered branches, re-run. No threshold edits.

## WU-D — Full local Playwright (post-disposition inventory)

After WU-B moves: `npx playwright test --list` → **this count is the contract** (expect the 5 retained files' tests; archived debug specs contribute zero; record actual N in gate notes). Then `lsof -ti:4173 | xargs kill -9 2>/dev/null; npm run test:e2e` → **N/N passed, 100%**. Triage: fix app or test within the WU-A boundary rule; no skips, no grep-filtering.

## WU-E — Docs truth pass (draft claims only; no green/deployed assertions)

- Rewrite `HANDOFF.md`: date 2026-08-21, verified-state actuals, identifiers kept, "CI verification: pending post-push evidence", graduation/Raydium pending fact, §16 KPI window noted as waived-post-launch.
- README status block: replace stale narrative with current truth; explorer proofs stay (valid history).
- New `docs/handoffs/handoff-2026-08-21-closure.md`: outcome record.
- `.beads/plans/active-plan.md`: replace with THIS plan (gate metadata: approved timestamp, gate-iterations 2, user-approved, status in-progress).
- Commit `docs: truth pass — verified state, pending CI evidence` (+ B0 doc dispositions if separate).

## Final release gate (pre-push, blocking)

1. `npm run lint && npm run build` → 0 errors / exit 0.
2. vitest unit+worker+client+integration → all pass.
3. WU-C coverage actuals + WU-D N/N recorded in gate notes.
4. `git diff --check` clean; staged diff secret sweep (gitleaks protect --staged if present, else pattern sweep: private keys/seed phrases/API tokens) → clean.
5. `git status --short` → staged set EXACTLY equals the WU-B disposition table + WU-A/E file lists + `.github/workflows/ci.yml` & `deploy.yml` (WU-B6); nothing unexpected.

## WU-F — Push + provider evidence

1. Push `main`; `gh run list --limit 2` → capture BOTH run ids for this SHA.
2. `gh run watch <ci-id> --exit-status` AND `gh run watch <deploy-id> --exit-status`; THEN belt-and-braces per completeness finding: `gh run view <id> --json jobs --jq '.jobs[] | "\(.name): \(.conclusion)"'` for both runs — **every job must print `success`** (no skipped/no masked failures; possible only because WU-B6 removed the flags).
3. Probes: Worker `/api/health` → `ok:true`; Pages HTTP 200; negative probe `/api/tokens/definitely-not-a-token-zz` → structured 404 JSON (not HTML/500).
4. `git rev-parse origin/main` == local HEAD; `git status --short` EMPTY.
5. Evidence touch-up commit: paste exact run URLs + SHA into HANDOFF/README — claims NOW evidenced. Push; re-watch both new runs incl. per-job conclusions.
6. **Red-post-push rollback rule:** any red job → `git revert <sha>` + push restores green main while debugging continues offline; report names the exact failing job + log excerpt.
7. Report DONE with evidence table — or the exact blocker.

## Risks / Rollback
- Hook refactor risk → bounded by A1 regression tests + full client suite; single-file diff, trivially revertible.
- Archive moves reversible (`mv` back); contracts/ preserved under `~/workspace/_archive`.
- WU-B6 risk: removing flags can surface latent red jobs → that is the point; rollback rule above applies. test-e2e-only fallback (restore its flag + DoD rewrite) permitted solely if WU-F reveals a runtime auth failure with the DEVNET_WALLET flow.
- No dependency, schema, API, or infra changes anywhere in this plan.
