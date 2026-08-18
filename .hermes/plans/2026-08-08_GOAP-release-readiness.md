# Hermes Launchpad — GOAP Action Plan for Release Readiness

**Generated:** 2026-08-08 (post-HANDOFF)
**Methodology:** Goal-Oriented Action Planning (GOAP) with A* search over state space
**Context:** Devnet-complete fair-launch product, public preview live, CI release gate verified
**Scope:** Solana devnet only. No mainnet activity.

---

## 1. STATE ASSESSMENT

### Current World State (S₀)

| Fact | Value | Source |
|------|-------|--------|
| Frontend deployed | ✅ https://hermes-launchpad.pages.dev (HTTP 200) | HANDOFF §2 |
| API Worker deployed | ✅ https://hermes-api.tahamtandariush.workers.dev/api/health | HANDOFF §2 |
| On-chain program | ✅ `9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz` (devnet) | HANDOFF §2 |
| Config PDA initialized | ✅ `9Sv1kApQK428EUueU7dR9mTPqKqNR7dxkBmwtZuHDTkr` | HANDOFF §2 |
| Fee wallet funded | ✅ `GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a` | HANDOFF §2 |
| D1 database exists | ✅ `hermes-launchpad-db` (`afa984c4-...`) | HANDOFF §2 |
| Schema applied | ✅ `schema_v3.sql` (ALTER) on live; `schema.sql` canonical in repo | HANDOFF §2 |
| CI PR gate | ✅ Runs on every PR (9/10 pass, 2 skip cleanly) | HANDOFF §1 |
| Local tests | ✅ All 25 JS + 7 Rust tests pass | HANDOFF §1 |
| Security scan | ✅ No critical findings (solana-vulnerability-scanner) | HANDOFF §1 |
| Program upgrade scripts | ✅ `restore-keypair.sh`, `npm run program:restore/deploy` | HANDOFF §1 |
| Docs updated | ✅ README, DEPLOY, INVENTORY (WU-00..WU-05b merged) | HANDOFF §1 |

### Missing / Blocker State (Gaps from Goal)

| Gap | Blocker | Impact |
|-----|---------|--------|
| `DEVNET_WALLET` secret | Not set in GitHub repo | P0 — blocks `test-program` + `test:e2e` in CI |
| `CF_API_TOKEN` secret | Not set in GitHub repo | P0 — blocks `worker-check` dry-run + D1 query |
| D1 seed data verified | Cannot query remote D1 | P0 — unknown if demo tokens exist |
| Raydium migration | 0/50 `amm_config` on devnet (environmental) | P1 — "full pump.fun parity" blocked |
| Dependabot vulnerabilities | 6 vulns (2 high, 3 moderate, 1 low) | P2 — should triage before production |
| On-chain provenance | `mapToken` uses D1 seed, not live `fetchCurveState` for all tokens | P2 — "provenance: onchain" not fully real |
| Keypair backup confirmed | Operator responsibility, off-repo | P2 — upgrade path untested |
| Bundle size | 610 KB (185 KB gzip) | P3 — consider code-splitting |
| Lighthouse gate | Removed in PR #7 | P3 — perf monitoring gap |
| Workers AI rate limit | 10k neurons/day free tier | P3 — monitor in preview |

---

## 2. GOAL STATE (S*)

**Definition of "Fully Verified Release-Ready":**

```
G = {
  ✅ All CI jobs green (including test-program, test:e2e, worker-check)
  ✅ D1 schema + seed data confirmed via remote query
  ✅ Live end-to-end buy/sell executed on devnet through deployed worker
  ✅ Migration parity decision documented (accept / provision / swap)
  ✅ Dependabot vulnerabilities triaged (0 high, 0 critical)
  ✅ On-chain provenance shows real reserves for all onchain_mint tokens
  ✅ Program upgrade path tested (restore + deploy dry-run)
  ✅ Public preview announced with honest status (devnet demo, migration-ready)
}
```

---

## 3. ACTION INVENTORY

Each action has: **Preconditions**, **Effects**, **Cost** (time/effort), **Risk**, **Tools Required**

### P0 Actions (Credential-Gated — Must Do First)

| ID | Action | Preconditions | Effects | Cost | Risk |
|----|--------|---------------|---------|------|------|
| A1 | **Set `DEVNET_WALLET` GitHub secret** | User has funded devnet keypair JSON | Unlocks `test-program` + `test:e2e` in CI | 5 min | Low |
| A2 | **Set `CF_API_TOKEN` GitHub secret** | User has Cloudflare API token (Account: `a55a43856c7029505b79300ec82f1629`) | Unlocks `worker-check` dry-run + `wrangler d1 execute --remote` | 5 min | Low |
| A3 | **Query D1 remote: `SELECT count(*) FROM tokens`** | A2 done | Confirms schema + seed rows exist; reveals `onchain_mint` count | 2 min | Low |
| A4 | **Run `npm run test:program` locally** | A1 done (or local `DEVNET_WALLET` env) | Verifies 6/6 Anchor tests pass on live devnet | 3 min | Low |
| A5 | **Run `npm run test:e2e` locally** | A1 done + Playwright installed | Verifies smoke E2E passes (buy/sell flow) | 5 min | Medium (flaky) |
| A6 | **Trigger CI PR run** | A1 + A2 done | All 10 jobs green (worker-check passes, program/e2e run) | 10 min | Low |

### P1 Actions (Migration Parity Decision)

| ID | Action | Preconditions | Effects | Cost | Risk |
|----|--------|---------------|---------|------|------|
| B1 | **Decide migration strategy** | Team alignment | One of: (a) accept "migration-ready", (b) provision Raydium devnet, (c) swap to Meteora/OpenBook | 30 min | Medium (product decision) |
| B2 | **Update UI copy + docs per decision** | B1 done | Honest messaging: "migration-ready (Raydium pool creation pending devnet support)" or similar | 15 min | Low |
| B3 | **If (b): Provision Raydium devnet state** | B1=b, Raydium testnet faucet access | Creates `amm_config` PDAs; unblocks WU-04 CPI | 1-2 hr | High (external dependency) |
| B4 | **If (c): Implement Meteora/OpenBook migration** | B1=c, dev time | New CPI target; full parity achievable | 1-2 days | High (new code) |

### P2 Actions (Production Hardening)

| ID | Action | Preconditions | Effects | Cost | Risk |
|----|--------|---------------|---------|------|------|
| C1 | **Triage Dependabot vulnerabilities** | `npm audit` access | 0 high/critical; pin safe versions | 30 min | Low |
| C2 | **Wire on-chain provenance in token list** | A3 done (know `onchain_mint` tokens) | `mapToken` uses `fetchCurveState` for ALL tokens with `onchain_mint`; `provenance: 'onchain'` shows real reserves | 1 hr | Low (code change in `worker.js`) |
| C3 | **Test program upgrade path** | Keypair backup available off-repo | `npm run program:restore <backup>` → `npm run program:deploy` dry-run succeeds | 30 min | Medium (keypair handling) |
| C4 | **Verify worker deploy works** | A2 done | `wrangler deploy --dry-run` passes in CI; real deploy via Pages git-connect confirmed | 10 min | Low |

### P3 Actions (Nice-to-Have)

| ID | Action | Preconditions | Effects | Cost | Risk |
|----|--------|---------------|---------|------|------|
| D1 | **Code-split frontend bundle** | Perf profiling | Reduce 610 KB → <300 KB initial chunk | 2-4 hr | Low |
| D2 | **Re-add Lighthouse CI gate** | Lighthouse CI config | PR fails if perf regresses below 90 | 1 hr | Low |
| D3 | **Add Workers AI usage monitoring** | Cloudflare dashboard | Alert at 80% of 10k neurons/day | 30 min | Low |

---

## 4. DEPENDENCY GRAPH (Action DAG)

```
A1 (DEVNET_WALLET) ──┬──→ A4 (test:program local)
                     │
                     ├──→ A5 (test:e2e local)
                     │
                     └──→ A6 (CI all green) ←── A2 (CF_API_TOKEN)
                                                         │
A2 (CF_API_TOKEN) ──────────────────────────────────────┘
                     │
                     └──→ A3 (Query D1)
                                          │
C2 (Wire provenance) ←───────────────────┘
                     │
C1 (Dependabot) ─────┘ (independent)
                     │
C3 (Upgrade test) ───┘ (independent, needs keypair)
                     │
C4 (Worker deploy) ──┘ (needs A2)

B1 (Migration decision) ──→ B2 (UI/docs) ──→ B3/B4 (if not 'accept')
       │
       └── (independent of P0, but blocks "full parity" claim)
```

---

## 5. OPTIMAL PLAN (A* Search Result)

**Heuristic:** Minimize total calendar time + unblock critical path earliest

### Phase 1: Unblock CI & Verify Live State (Day 0 — ~30 min user time)

| Step | Action | Owner | Duration | Success Criteria |
|------|--------|-------|----------|------------------|
| 1.1 | A1: Set `DEVNET_WALLET` secret | User | 5 min | Secret exists in GitHub repo settings |
| 1.2 | A2: Set `CF_API_TOKEN` secret | User | 5 min | Secret exists in GitHub repo settings |
| 1.3 | A3: Query D1 (`wrangler d1 execute hermes-launchpad-db --remote --command="SELECT count(*) FROM tokens"`) | Agent | 2 min | Returns count > 0; shows `onchain_mint` rows |
| 1.4 | A4: Run `npm run test:program` locally | Agent | 3 min | 6/6 tests pass |
| 1.5 | A5: Run `npm run test:e2e` locally | Agent | 5 min | Playwright smoke passes |
| 1.6 | A6: Push to trigger CI (or `workflow_dispatch`) | Agent | 10 min | All 10 jobs green ✅ |

**Decision Gate after Phase 1:** If A3 shows 0 tokens or no `onchain_mint` → need seed script. If A4/A5 fail → debug on-chain.

### Phase 2: Migration Parity Decision (Day 0-1 — ~1 hr)

| Step | Action | Owner | Duration | Success Criteria |
|------|--------|-------|----------|------------------|
| 2.1 | B1: Decide strategy (recommend: **accept "migration-ready"**) | User + Agent | 30 min | Decision documented in DEPLOY.md |
| 2.2 | B2: Update UI copy + docs | Agent | 15 min | Frontend shows honest status; DEPLOY.md updated |
| 2.3 | *If not accept*: B3 or B4 | Agent | 1-2 days | Migration CPI works on devnet |

**Recommendation:** Accept "migration-ready" (curve locks at 85 SOL, no Raydium pool). Raydium devnet unprovisioned is environmental, not code. Document honestly. Saves 1-2 days.

### Phase 3: Production Hardening (Day 1 — ~2 hr)

| Step | Action | Owner | Duration | Success Criteria |
|------|--------|-------|----------|------------------|
| 3.1 | C1: `npm audit fix` / pin versions | Agent | 30 min | 0 high/critical vulns |
| 3.2 | C2: Wire on-chain provenance in `worker.js` `/api/tokens` | Agent | 1 hr | All `onchain_mint` tokens show `provenance: 'onchain'` with real `realSol` from `fetchCurveState` |
| 3.3 | C3: Test upgrade path (`npm run program:restore <backup> && npm run program:deploy --dry-run`) | User + Agent | 30 min | Keypair restores, deploy dry-run succeeds |
| 3.4 | C4: Verify `wrangler deploy --dry-run` passes in CI | Agent | 10 min | `worker-check` job green |

### Phase 4: Polish (Optional, Week 1)

| Step | Action | Owner | Duration |
|------|--------|-------|----------|
| 4.1 | D1: Code-split frontend (lazy-load heavy routes) | Agent | 2-4 hr |
| 4.2 | D2: Add Lighthouse CI gate | Agent | 1 hr |
| 4.3 | D3: Workers AI usage alert | Agent | 30 min |

---

## 6. EXECUTION MONITORING (OODA Loop)

### Observe
- CI job status (GitHub Actions)
- D1 query results
- Local test output
- Deployed worker health (`/api/health`, `/api/tokens`)

### Orient
- Are preconditions met for next action?
- Did any action produce unexpected state? (e.g., D1 empty, test flaky, keypair mismatch)
- Is migration decision aligned with stakeholder expectations?

### Decide
- **Replan triggers:**
  - A3 returns 0 tokens → Insert seed data before C2
  - A4/A5 fail → Debug on-chain (RPC, wallet balance, program state)
  - C3 fails → Keypair backup invalid → Recover from offline storage
  - B1 decision = "provision Raydium" → Insert B3/B4, extend timeline

### Act
- Execute next action in plan
- Record results in memory for future replanning
- Update HANDOFF.md with new state

---

## 7. RISK MITIGATION

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `DEVNET_WALLET` unfunded | Low | High (blocks P0) | Verify balance ≥ 2 SOL before setting secret |
| D1 has no seed data | Medium | Medium | Have `seed_v2.sql` ready; apply via `wrangler d1 execute --remote --file=workers/seed_v2.sql` |
| Raydium devnet never provisions | High | Medium (parity claim) | Accept "migration-ready" as stated; don't block release |
| Dependabot fix breaks build | Low | Medium | Run `npm test` after `npm audit fix`; pin if needed |
| Keypair backup corrupted | Low | High (upgrade path) | Verify `program:restore` works before needing it |
| E2E flaky on CI | Medium | Low | Keep `continue-on-error: true`; run locally for confidence |

---

## 8. SUCCESS METRICS (Definition of Done)

| Metric | Target | Measurement |
|--------|--------|-------------|
| CI jobs green | 10/10 | GitHub Actions PR run |
| D1 token count | > 0 (ideally ≥ 3 demo) | `wrangler d1 execute --remote` |
| Program tests | 6/6 pass | `npm run test:program` |
| E2E smoke | Pass | `npm run test:e2e` |
| On-chain provenance | 100% of `onchain_mint` tokens | `/api/tokens` → `provenance: 'onchain'` with real `realSol` |
| Vulnerabilities | 0 high, 0 critical | `npm audit` / GitHub Dependabot |
| Upgrade dry-run | Success | `npm run program:restore && npm run program:deploy --dry-run` |
| Bundle size | < 300 KB initial | `npm run build` → `dist` analysis |
| Lighthouse score | ≥ 90 | Lighthouse CI |

---

## 9. IMMEDIATE NEXT ACTIONS (User Required)

**Only the user can do these (secrets are not in repo/chat):**

1. **Go to GitHub repo → Settings → Secrets and variables → Actions → New repository secret**
   - Name: `DEVNET_WALLET`
   - Value: *Funded devnet keypair JSON* (e.g., `[12,34,56,...]` array from `solana-keygen new -o /tmp/devnet.json && cat /tmp/devnet.json`)

2. **Go to GitHub repo → Settings → Secrets and variables → Actions → New repository secret**
   - Name: `CF_API_TOKEN`
   - Value: *Cloudflare API Token* (Account: `a55a43856c7029505b79300ec82f1629`, permissions: Workers Scripts Read/Write, D1 Read/Write)

3. **Optional but recommended:** `CF_ACCOUNT_ID` = `a55a43856c7029505b79300ec82f1629`

**Once secrets are set, the agent can execute Phases 1-3 autonomously.**

---

## 10. PLAN FILE LOCATION

This plan is stored at: `.hermes/plans/2026-08-08_GOAP-release-readiness.md`

**To resume:** Read this file, check current state against S₀, continue from next uncompleted action.
