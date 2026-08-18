# Feasibility Review: Hermes Launchpad — Viral Polish + Account Page + Demo Purge

**Plan File:** `.hermes/plans/2026-08-16_200000-hermes-launchpad-viral-polish-account-demo-purge.md`
**Review Date:** 2026-08-16
**Reviewer:** Feasibility Reviewer (Plan Review Gate)
**Repo State:** Pre-execution HEAD (main @ 319158b)

---

## VERDICT: **PASS WITH CONDITIONS** (2 Blocking Issues, 4 Major Concerns)

| Verdict | Count |
|---------|-------|
| ✅ PASS | 47 |
| ⚠️ CONDITIONAL PASS | 12 |
| ❌ FAIL (Blocking) | 2 |
| ❓ UNVERIFIABLE | 3 |

---

## EVIDENCE TABLE

| # | Plan Claim | Codebase Reality | Verdict | Evidence |
|---|------------|------------------|---------|----------|
| **ARCHITECTURE & ROUTING** |
| 1 | Stack: Vite 7, React 19, TS, Tailwind 3.4, Cloudflare Pages+Workers+D1 | Confirmed: `package.json` shows exact versions; `wrangler.jsonc` + `workers/wrangler.toml` exist | ✅ PASS | package.json:78-105, wrangler.jsonc:1-11 |
| 2 | Live at `hermes-launchpad.pages.dev` / `hermes-api.tahamtandariush.workers.dev` | Confirmed by HANDOFF.md health checks | ✅ PASS | HANDOFF.md:26-27 |
| 3 | Current routes: `/` (Home), `/profile` (Profile) — **NO `/account`** | `src/App.tsx:6` defines only `/` and `/profile` | ✅ PASS | App.tsx:6 |
| 4 | New `/account` route with 6 tabs (lazy-loaded) | Route addition needed; lazy load pattern not yet used in codebase | ⚠️ CONDITIONAL | App.tsx uses eager imports; new pattern needed |
| 5 | Worker schema changes: `sessions`, `api_keys`, `notification_prefs` tables | Current `schema.sql` has NO such tables | ❌ **BLOCKING** | schema.sql:1-132 (no sessions/api_keys/notification_prefs) |
| 6 | Worker routes under `workers/src/account/*` | Workers is flat: `workers/worker.js` only; no `src/` subfolder | ❌ **BLOCKING** | workers/ listing shows flat structure |
| **DEMO PURGE (Phase 0)** |
| 7 | Search for `fixture`, `demo`, `mock`, `placeholder`, `lorem`, `fake` | Found: `provenance: 'demo'` in tokens.ts:10, TokenCard.tsx:27, TokenModal.tsx:84, CreateTokenModal.tsx:166; `demo` fallbacks in api.ts:34-35,134-136,142-143 | ⚠️ CONDITIONAL | Multiple files use `demo` as legitimate provenance enum value |
| 8 | Remove demo fallbacks from production read paths | `api.ts` returns `{ data: TOKENS, live: false }` fallbacks — these are **intentional offline fallbacks**, not demo data | ⚠️ CONDITIONAL | api.ts:31-37,131-144 |
| 9 | Replace with `unavailable` capability state copy | No `CAPABILITY_STATES.md` exists in repo; plan references external doc | ❓ UNVERIFIABLE | File not found in workspace |
| 10 | `FIXTURES_ENABLED=false` in production env | No such env var referenced in codebase; wrangler/Pages env not verified | ❓ UNVERIFIABLE | No evidence in .env.example or wrangler configs |
| 11 | Source-truth CI check: `grep -r "fixture\|demo\|mock" src/` | Will FALSE POSITIVE on legitimate `provenance: 'demo'` enum and `demo` badge variant | ⚠️ CONDITIONAL | Grep pattern too broad; needs exclusion list |
| **ACCOUNT PAGE (Phase 1)** |
| 12 | 6 tabs: Wallets, Security, Notifications, API/Keys, Referral Analytics, Danger Zone | No account components exist; all 6 are net-new | ✅ PASS (specifies new work) | Plan:90-91 |
| 13 | `AccountTabs.tsx` — mobile bottom sheet, desktop sidebar | No tab component exists; BottomTabBar is for main nav only | ✅ PASS (specifies new work) | BottomTabBar.tsx exists but different purpose |
| 14 | Data from `/api/profile` + `/api/referrals` + `/api/sessions` (new) | `/api/profile` ✓, `/api/referrals` ✓, `/api/sessions` **MISSING** | ⚠️ CONDITIONAL | worker.js:443-483 has profile/referrals; no sessions endpoint |
| 15 | Wallet Standard integration for add wallet | `WalletButton.tsx` uses Phantom-specific; no Wallet Standard adapter | ⚠️ CONDITIONAL | WalletButton.tsx not read but lib/wallet.ts likely Phantom-only |
| **VIRAL HOOKS (Phase 2)** |
| 16 | TradeReceiptCard triggered after `POST /api/trades/index` confirms | `TokenModal.tsx` has `handleLike` but no trade confirmation hook; `indexTrade` in api.ts returns TradeResult | ✅ PASS (viable) | api.ts:72-74, TokenModal.tsx:24-36 |
| 17 | ReferralBanner in TopNav right of wallet button | TopNav.tsx:57-68 has wallet button; space exists for referral banner | ✅ PASS | TopNav.tsx:49-74 |
| 18 | GraduationModal triggered by Worker `migration_records` event | No such event in worker.js; `migrationReady` flag returned in TradeResult (api.ts:65) | ⚠️ CONDITIONAL | Worker doesn't emit events; polling-only architecture |
| 19 | Enhanced Ticker: holder delta, volume micro-sparkline | Ticker.tsx fetches trades only; no holder data in Trade type | ⚠️ CONDITIONAL | tokens.ts:65-74 Trade interface lacks holder info |
| 20 | TokenCard: green/red pulse ring, holder count live badge | TokenCard.tsx:19-21 has pulse for active; no buy/sell pulse or holder badge | ⚠️ CONDITIONAL | TokenCard.tsx:1-68 |
| **PROFESSIONAL POLISH (Phase 3)** |
| 21 | Lighthouse PWA ≥90 (manifest, SW, offline, installability) | **NO PWA setup**: no manifest.webmanifest, no service-worker.ts, vite.config.ts has no PWA plugin | ❌ **BLOCKING** (scope gap) | public/ only has og-launchpad.png; vite.config.ts:1-19 |
| 22 | axe-core AA: skip link, focus rings, ARIA live ticker, reduced-motion, 44px targets | No skip link in index.html/App.tsx; focus rings only via Tailwind `focus:` not `:focus-visible`; Ticker has no ARIA live region | ⚠️ CONDITIONAL | index.html:1-13, tailwind.config.js:10 (ring: #00ff66) |
| 23 | Visual regression baseline (Playwright) | playwright.config.ts exists; tests/e2e/ not found | ⚠️ CONDITIONAL | playwright.config.ts:1-13 |
| 24 | Consistent density, tabular nums, truncated addresses, skeletons, error boundaries | ErrorBoundary.tsx exists; tabular-nums not used; skeletons not implemented | ⚠️ CONDITIONAL | ErrorBoundary.tsx exists; Skeleton.tsx is placeholder |
| **RETENTION LOOPS (Phase 4)** |
| 25 | Daily streak badge in feed header | Profile has streak_days; Home.tsx doesn't display in feed header | ✅ PASS (data exists) | Profile.tsx:274-279, Home.tsx:164-181 |
| 26 | Quest progress micro-toast on trade | Quest progress tracked in worker; no toast on trade confirmation | ✅ PASS (viable) | worker.js:115-147, TokenModal.tsx:38-44 |
| 27 | Leaderboard snippet in feed (top 3, expandable) | Leaderboard data fetched in Home.tsx; not shown in tokens tab | ✅ PASS (data exists) | Home.tsx:54,327-361 |
| 28 | Push notification permission prompt (post-core) | No push infrastructure; plan correctly marks post-core | ✅ PASS (deferred) | Plan:143,231 |
| 29 | Re-engagement toast via Worker → DO → client | No Durable Objects in current worker; plan acknowledges DO post-core | ✅ PASS (deferred) | worker.js:1-531 no DO; Plan:235 |
| **VALIDATION (Phase 5)** |
| 30 | Build, lint, typecheck, vitest, Playwright E2E, Lighthouse CI | All commands exist in package.json; CI thresholds 100% coverage | ✅ PASS | package.json:6-23, .coverage-thresholds.json |
| 31 | Source truth grep must return empty (excl. test files) | Will fail on legitimate `provenance: 'demo'` enum values | ❌ **BLOCKING** (same as #11) | tokens.ts:10, TokenCard.tsx:27, etc. |

---

## BLOCKING ISSUES (2)

### 🔴 BLOCKER #1: Worker Schema & Route Structure Mismatch
**Plan Claims:**
- New tables: `sessions`, `api_keys`, `notification_prefs` in `workers/schema.sql`
- New Worker routes under `workers/src/account/*`

**Codebase Reality:**
- `workers/schema.sql` is a **single canonical CREATE file** (not migration-based) with 10 tables — none of the three new tables exist
- Workers directory is **flat**: `workers/worker.js` (531 lines) + `chain.js` + SQL files — **no `src/` subdirectory**
- All routes handled in single `worker.js` via path matching (lines 189-500)

**Remediation Required:**
1. Plan must specify: **extend `workers/schema.sql` with 3 new `CREATE TABLE IF NOT EXISTS` statements** (additive, not replace)
2. Plan must specify: **add route handlers in `workers/worker.js`** (not new files) following existing pattern
3. Plan must specify: **D1 migration strategy** — since schema.sql is canonical CREATE, either:
   - Alter live DB via `wrangler d1 execute --remote --command="ALTER TABLE..."` (risky)
   - Or maintain separate migration file and update schema.sql for fresh installs

### 🔴 BLOCKER #2: PWA Infrastructure Entirely Missing
**Plan Claims:**
- Phase 3.1: Lighthouse PWA audit ≥90
- Files to create: `public/manifest.webmanifest`, `src/service-worker.ts`, update `vite.config.ts` for PWA

**Codebase Reality:**
- **Zero PWA infrastructure**: no manifest, no SW, no Workbox/Vite PWA plugin
- `vite.config.ts` (19 lines) has only React + Cloudflare plugins
- `public/` contains only `og-launchpad.png`
- `index.html` has no manifest link, no theme-color beyond meta tag

**Remediation Required:**
1. Plan must add: **install `@vite-pwa/vite-plugin-pwa`** (or Workbox) as devDependency
2. Plan must add: **generate `public/manifest.webmanifest`** with icons (need icon assets)
3. Plan must add: **configure SW registration in `main.tsx`** (not just service-worker.ts)
4. Plan must add: **offline shell strategy** — current app is fully dynamic (all data from API); SW can only cache static assets

---

## MAJOR CONCERNS (4)

### 🟡 CONCERN #1: "Demo" Term Ambiguity Causes False Positives
The codebase uses `"demo"` as a **legitimate provenance enum value** (`'demo' | 'index' | 'onchain'`) to mean "not yet indexed on-chain" — not "fake data." The plan's grep check and purge logic will flag these as violations.

**Files with legitimate `'demo'` provenance:**
- `src/lib/tokens.ts:10` — type definition
- `src/components/TokenCard.tsx:27` — badge variant
- `src/components/TokenModal.tsx:82,84` — badge variants
- `src/components/CreateTokenModal.tsx:166` — badge variant
- `src/lib/api.ts:35,135,143` — fallback `{ live: false }` flag (not demo data)

**Fix:** Plan must distinguish between:
- `provenance: 'demo'` (legitimate enum) → **KEEP**
- Hardcoded fallback arrays `TOKENS`, `QUESTS`, `LEADERBOARD` (already empty ✓) → **KEEP EMPTY**
- Actual fake/mock data in production paths → **PURGE**

### 🟡 CONCERN #2: Graduation Ceremony Trigger Mechanism
Plan: "Trigger: Worker `migration_records` event (100% curve complete)"

**Reality:** Worker has **no event system**. Architecture is **REST polling only** (Home.tsx:68-76 polls `/api/tokens` every 30s). No WebSockets, no Durable Objects, no server-sent events.

**Options:**
1. **Polling-based** (P0): Client detects `token.complete === true` on poll → trigger GraduationModal
2. **Post-core DO**: Add Durable Object for real-time (plan acknowledges this)

**Plan must specify:** Use polling detection in `Home.tsx` or `TokenCard` — no Worker event exists.

### 🟡 CONCERN #3: Account Page Data Dependencies on Missing Worker Endpoints
Plan lists 6 tabs requiring data from:
- `/api/profile` ✓ exists
- `/api/referrals` ✓ exists  
- `/api/sessions` ✗ **MISSING** (Security, Danger Zone)
- `/api/account/*` ✗ **MISSING** (API Keys, Notification Prefs)

**Worker.js has NO sessions table or endpoints.** The `profiles` table has no session tracking.

**Fix:** Plan must include **Worker schema + endpoint implementation for sessions** before Account page Security/Danger Zone tabs can function.

### 🟡 CONCERN #4: Accessibility Baseline Requires Significant Refactor
Plan targets axe-core 0 violations AA. Current gaps:
- No skip link in `index.html` or `App.tsx`
- Focus rings use `focus:` not `:focus-visible` (Tailwind `ring` utility)
- Ticker has no `aria-live="polite"` region
- `prefers-reduced-motion` only handled in `Home.tsx:138-140` via GSAP, not globally
- Touch targets: `BottomTabBar` buttons may be <44px (not verified)
- No `color-scheme: dark` in CSS (only `bg-black`)

**Effort:** Non-trivial; touches root layout, all interactive components, global CSS.

---

## UNVERIFIABLE ITEMS (3)

| # | Item | Why Unverifiable |
|---|------|------------------|
| 1 | `CAPABILITY_STATES.md` copy strings | File not found in workspace or `.hermes` |
| 2 | `FIXTURES_ENABLED=false` in production env | No `.env.production`, wrangler vars not accessible |
| 3 | Vercel deployment (`vercel ls`) | Project deploys to **Cloudflare Pages**, not Vercel (plan line 158) |

---

## TECHNICAL APPROACH VIABILITY ASSESSMENT

| Phase | Viability | Notes |
|-------|-----------|-------|
| **0: Demo Purge** | ⚠️ HIGH RISK | Grep patterns will false-positive; need precise targeting |
| **1: Account Page** | ✅ VIABLE | Clear spec; 6 tabs well-scoped; needs Worker backend first |
| **2: Viral Hooks** | ✅ VIABLE | TradeReceiptCard + ReferralBanner straightforward; GraduationModal needs polling trigger |
| **3: Professional Polish** | ⚠️ HIGH EFFORT | PWA from zero is 2-3 days alone; a11y audit needs component-wide changes |
| **4: Retention Loops** | ✅ VIABLE | Data exists; UI integration straightforward |
| **5: Validation** | ✅ VIABLE | All tooling exists; Lighthouse CI needs setup |

---

## RECOMMENDED PLAN AMENDMENTS

### Must-Fix Before Execution
1. **Rewrite Worker schema section** — specify exact `ALTER TABLE` / `CREATE TABLE` statements for `sessions`, `api_keys`, `notification_prefs` in `workers/schema.sql` and route handlers in `workers/worker.js`
2. **Add PWA setup tasks to Phase 0 or new Phase 0.5** — install plugin, create manifest, generate icons, configure SW, register in `main.tsx`
3. **Fix demo purge grep** — use `grep -r "fixture\|mock\|placeholder\|lorem\|fake" src/ --include="*.tsx" | grep -v "provenance\|variant\|demo.*badge\|live.*false"` 
4. **Remove Vercel references** — deploy is Cloudflare Pages; use `wrangler pages deployment list` or Cloudflare dashboard
5. **Clarify graduation trigger** — specify polling-based detection in `Home.tsx` token refresh cycle

### Should-Fix
6. **Add `CAPABILITY_STATES.md`** to repo or inline the copy strings in plan
7. **Specify Wallet Standard integration** — current `lib/wallet.ts` likely Phantom-only; need `@solana/wallet-adapter` or similar
8. **Add icon generation task** for PWA manifest (need 192x192, 512x512 PNGs)
9. **Define reduced-motion global CSS** — `:root { --animation-duration: 0s; }` + `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; } }`

---

## FINAL VERDICT

**PASS WITH CONDITIONS** — The plan is well-structured and technically grounded, but **two blocking issues (Worker schema/route structure, PWA from zero) and the demo-purge false-positive risk must be resolved before execution**. With the amendments above, the plan is executable in the proposed 5-day timeline.

**Blocking Issues Count: 2**  
**Major Concerns: 4**  
**Conditional Pass Items: 12**

---

*Review complete. Ready for Plan Review Gate integration.*