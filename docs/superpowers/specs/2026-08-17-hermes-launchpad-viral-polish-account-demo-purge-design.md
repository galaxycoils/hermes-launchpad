---
title: "Hermes Launchpad — Viral Polish + Account Page + Demo Purge Design"
date: "2026-08-17"
slug: "hermes-launchpad-viral-polish-account-demo-purge-design"
status: "draft"
tags: [ui-polish, viral-growth, account-page, demo-cleanup, pump.fun-parity, design]
---

# Hermes Launchpad — Viral Polish, Account Page, Demo Purge: Design Spec

> **Goal:** Take the shipped Phase 1-3 foundation (true-black dark, compact cards, King of Hill, polling ticker, bottom-sheet modal, 3-step wizard, Trade/Profile IA) and push it to **measurably better than pump.fun** on: engagement, viral loops, professional polish, and zero demo fluff.
>
> **Execution model:** Metaswarm autopilot — Ralph iteration loop, one WU per delegate_task subagent, state files in `.omh/state/`, CI gates verified after each WU.

---

## 1. Design Philosophy: "Ruthless Degen-Native"

1. **Zero demo copy** — every string in production is either live-verified or explicitly `unavailable`
2. **Viral by default** — share card on every trade, referral in header, graduation = spectacle
3. **Account as command center** — wallets, security, API keys, notifications, referral analytics
4. **Pump.fun parity + AI honesty** — same speed/density, but AI never lies (provenance labels)
5. **PWA-first** — install prompt, offline shell, service worker, push (post-core)

---

## 2. Current Ground Truth (Verified)

| Aspect | State (verified) |
|---|---|
| **Stack** | Vite 7, React 19, TypeScript, Tailwind 3.4, Radix UI, Recharts, @solana/web3.js, Vitest |
| **Deploy** | Cloudflare Pages (FE) + Workers (API) + D1 — **live at `hermes-launchpad.pages.dev` / `hermes-api.tahamtandariush.workers.dev`** |
| **Theme** | True black (`#000`), pump green `#00FF00`, pump red `#FF0000`, Hermes purple `#A855F7` |
| **Components** | TokenCard, TokenModal (bottom sheet), CreateTokenModal (wizard), Ticker, KingOfHill, Sparkline, WalletButton, TopNav, BottomTabBar, Avatar, Badge, Button, ConfettiBurst, Hero, Surface, Progress, Skeleton, Stat |
| **Pages** | `Home.tsx` (single feed), `Profile.tsx` (XP/referrals/quests/leaderboard) — **NO Account page** |
| **Test/Build** | `npm run build` ✅, `npm run lint` ✅, `vitest` 27/27 ✅ |
| **Pump.fun baseline** | Single-col feed, true black, green/red signals, confetti on buy, graduation spectacle, thumb-zone CTAs, live trades ticker, holder counts, social proof |
| **Coverage** | `.coverage-thresholds.json` enforces 100% lines/branches/functions/statements via `npm run test:coverage` — **MUST FIX: `test:coverage` script missing from package.json, vitest config has no coverage block, no `@vitest/coverage-v8` devDep** |
| **Wrangler configs** | TWO — root `wrangler.jsonc` (my-app, Pages) + `workers/wrangler.toml` (hermes-api, D1). **MUST address dual-config trap in every phase that touches Worker/D1.** |

---

## 3. Approaches Considered

### Approach A: All 6 phases this cycle (selected)

- **Scope:** Phases 0, 0.5, 1, 2, 3, 4 — full viral polish + account page + PWA + polish + retention
- **Pros:** Single coherent delta vs. shipped; delivers complete "better than pump.fun" story across all 6 gap dimensions; one CI gate pass at the end
- **Cons:** Phase 1 (account page) introduces new D1 tables + 8+ Worker routes + DELETE /api/account cascade — largest backend surface; Phase 0.5 (PWA) adds service worker lifecycle; 6 phases = 6 Ralph iterations
- **Risk:** Dual-wrangler-config trap must be addressed in Phases 0.5, 1, 2; coverage infrastructure must be fixed in Phase 0 before any WU can pass the coverage gate

### Approach B: Defer account page (rejected per user choice)

- Would run Phases 0, 0.5, 2, 3, 4, defer Phase 1
- Rejected because user chose full scope (Option A)

### Approach C: Thin account page (rejected)

- Would ship a 2-tab account (wallets + danger zone) and defer the rest
- Rejected — user wants the full 6-tab account page now

---

## 4. Architecture

### 4.1 Layered Architecture (Backend-Dev-Guidelines compliance)

The Worker already uses a flat structure (`workers/worker.js`). For the new account routes, we apply the layered pattern:

```
workers/worker.js (router/dispatcher)
  → workers/src/account/accountService.js (business logic)
  → workers/src/account/accountRepository.js (D1 access)
  → workers/schema.sql (new tables: sessions, api_keys, notification_prefs)
```

- **Routes** only route — no business logic in route handlers
- **Service** contains business rules, framework-agnostic, unit-testable
- **Repository** encapsulates D1 queries, handles transactions, exposes intent-based methods
- **No layer skipping**, no cross-layer leakage
- **All errors captured** — no silent failures

### 4.2 Frontend Architecture (Frontend-Architecture compliance)

```
src/pages/Account.tsx (lazy via React.lazy + Suspense)
  → src/components/account/AccountTabs.tsx (mobile sheet / desktop sidebar)
    → src/components/account/WalletManager.tsx
    → src/components/account/SecurityPanel.tsx
    → src/components/account/NotificationPrefs.tsx
    → src/components/account/ApiKeys.tsx
    → src/components/account/ReferralAnalytics.tsx
    → src/components/account/DangerZone.tsx

src/components/viral/
  → TradeReceiptCard.tsx (post-trade share card + confetti)
  → GraduationModal.tsx (full-screen graduation spectacle)
  → ReferralBanner.tsx (persistent top-nav referral CTA)

src/hooks/
  → useAccount.ts (account data fetching + mutations)
  → useViral.ts (share, confetti, graduation triggers)
```

- **Container vs presentational separation** — Account tabs coordinate; sub-components are presentational where possible
- **Lazy loading** — Account page lazy-loaded via React.lazy + Suspense
- **Composition over inheritance** — viral components compose ConfettiBurst, existing Button, existing Surface
- **Unidirectional data flow** — account mutations go through useAccount hook → service call → state update

### 4.3 Data Flow

**Account page reads:**
```
Account.tsx (lazy)
  → useAccount hook
    → lib/api.ts GET /api/account/sessions | /api/account/api-keys | /api/account/notification-prefs
      → Worker router → accountService → accountRepository → D1
```

**Account page writes (e.g., revoke session):**
```
AccountTabs → SecurityPanel → useAccount.revokeSession(id)
  → lib/api.ts DELETE /api/account/sessions/:id
    → Worker router → accountService.revokeSession(id)
      → accountRepository.deleteSession(id) → D1
```

**Viral hooks data flow:**
```
TokenModal → trade confirmed → useViral.triggerTradeReceipt(token, trade)
  → TradeReceiptCard mounts → confettiBurst('trade') → Native Share API → Twitter/X intent
```

**Graduation detection:**
```
Home.tsx token refresh cycle (every 30s) → token.complete === true && token.migrationReady === true && !graduationSeen
  → GraduationModal mounts → confetti → "GRADUATED TO RAYDIUM" → pool link → "Ape In" CTA → auto-close 8s
  → localStorage.setItem('graduation_seen_<tokenId>', '1')
```

### 4.4 Error Handling

- **Backend:** All account routes return structured errors `{ error: { code, message, retryable } }` — consistent with existing API response shape (L496-497 of viral polish plan)
- **Frontend:** Trade sheet disabled when offline/degraded/unverified (existing pattern from shipped Phase 1-3); viral hooks degrade gracefully (e.g., Native Share API unavailable → copy link fallback)
- **Service worker:** Never caches mutable trade state as fresh; offline banner disables trade sheet
- **Feature flags:** Account page behind `ACCOUNT_PAGE_ENABLED` flag (default false until Phase 1 complete); viral hooks behind `VIRAL_HOOKS_ENABLED` (default false until Phase 2 complete)

---

## 5. Phase-by-Phase Design

### Phase 0: Demo Purge (Day 0 — do first)

**Purpose:** Remove all demo/fixture/placeholder fallbacks from production read paths. Every string in production is either live-verified or explicitly `unavailable`.

**Files:**
- Modify: `src/pages/Home.tsx`, `src/components/TokenModal.tsx`, `src/components/TokenCard.tsx`, `src/pages/Profile.tsx`, `src/components/CreateTokenModal.tsx`, `src/lib/api.ts`
- Create: `tests/unit/demo-purge.test.ts` (source-truth CI check)

**Steps:**
1. Search `src/` for `fixture`, `mock`, `placeholder`, `lorem`, `fake` — list every occurrence (EXCLUDE legitimate `provenance: 'demo'` enum and `demo` badge variant)
2. Remove all demo fallbacks from production read paths
3. Replace with `unavailable` capability state copy (inline strings):
   - `"Live · verified on-chain at slot {slot}"`
   - `"Stale · last verified {time} — reconnecting"`
   - `"Unavailable · AI disabled"` (for Bard/Oracle)
   - `"Unavailable · wallet not connected"` (for social writes)
   - `"Unavailable · feature degraded"` (for degraded state)
   - `"Unavailable · feature planned"` (for planned state)
4. Ensure `FIXTURES_ENABLED=false` in production env (Cloudflare Pages env vars)
5. Add source-truth CI check: `grep -r "fixture\|mock\|placeholder\|lorem\|fake" src/ --include="*.tsx" | grep -v "provenance\|variant\|demo.*badge\|live.*false"` → must return empty
6. Document capability state strings inline (no external doc dependency)

**Rollback for Phase 0:** Restore original fallback arrays in `api.ts`; revert capability state strings to previous copy.

### Phase 0.5: PWA Infrastructure Setup (Day 0.5 — before Phase 1)

**Purpose:** Make Hermes installable as a PWA with offline shell, install prompt, and proper cache rules.

**Files:**
- Create: `public/manifest.webmanifest`, `src/service-worker.ts`, `public/icons/icon-192.png`, `public/icons/icon-512.png`
- Modify: `vite.config.ts` (add Vite PWA plugin), `src/main.tsx` (register SW), `package.json` (add `@vite-pwa/vite-plugin-pwa` devDep)

**Steps:**
1. Install `@vite-pwa/vite-plugin-pwa` as devDependency
2. Create `public/manifest.webmanifest`:
   - `name: "Hermes Launchpad"`, `short_name: "Hermes"`, `description: "Fair-launch token curves with live market data"`
   - `theme_color: "#000000"`, `background_color: "#000000"`, `display: "standalone"`, `orientation: "portrait-primary"`
   - `icons`: 192x192 and 512x512 PNG
   - `shortcuts`: [Create Token, Account, Leaderboard]
3. Configure `vite.config.ts` with Vite PWA plugin:
   - `registerType: "autoUpdate"`, `manifest: true`, `workbox: { cleanupOutdatedCaches: true, runtimeCaching: [...] }`
   - **Never cache** `/api/trades/*`, `/api/tokens/index`, `/api/profile` (mutable trade state)
4. Create `src/service-worker.ts` (minimal — Workbox generates SW; this file registers update prompt)
5. Register SW in `src/main.tsx`: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js') }`
6. Offline shell strategy: cache `index.html`, static assets, manifest; show offline banner on trade sheet
7. Add PWA icons to `public/` (192x192, 512x512 PNG) — generate from `og-launchpad.png`

**Rollback for Phase 0.5:** Revert `vite.config.ts` PWA plugin, `manifest.webmanifest`, `service-worker.ts`, `main.tsx` SW registration.

### Phase 1: Account Page — `/account` (Day 1)

**Purpose:** Full 6-tab account page: wallets, security, notifications, API keys, referral analytics, danger zone.

**Files:**
- Create: `src/pages/Account.tsx` (lazy via React.lazy + Suspense), `src/components/account/{AccountTabs, WalletManager, SecurityPanel, NotificationPrefs, ApiKeys, ReferralAnalytics, DangerZone}.tsx`, `src/hooks/useAccount.ts`
- Modify: `src/lib/api.ts` (new endpoints), `workers/worker.js` (new route handlers), `workers/schema.sql` (new tables)
- Create: `tests/unit/account.test.ts`, `tests/worker/account.test.js`, `tests/client/account.test.tsx`

**Backend schema additions (workers/schema.sql):**
```sql
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  wallet TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  name TEXT,
  scopes TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  revoked INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);

CREATE TABLE IF NOT EXISTS notification_prefs (
  user_id TEXT PRIMARY KEY,
  push_enabled INTEGER DEFAULT 0,
  email_enabled INTEGER DEFAULT 0,
  in_app_enabled INTEGER DEFAULT 1,
  trade_confirmed INTEGER DEFAULT 1,
  quest_complete INTEGER DEFAULT 1,
  graduation INTEGER DEFAULT 1,
  referral_signup INTEGER DEFAULT 1,
  updated_at INTEGER NOT NULL
);
```

**Worker routes:**
- `GET /api/sessions` → list active sessions for current user
- `DELETE /api/sessions/:id` → revoke session
- `DELETE /api/sessions` → revoke all sessions
- `GET /api/account/api-keys` → list user's API keys (hashed)
- `POST /api/account/api-keys` → create new API key (return plaintext once)
- `DELETE /api/account/api-keys/:id` → revoke API key
- `GET /api/account/notification-prefs` → get preferences
- `PATCH /api/account/notification-prefs` → update preferences
- `DELETE /api/account` → delete account (cascade: revoke sessions/keys, anonymize social, keep trades)

**Frontend tabs (TopNav-style, mobile bottom-sheet):**
1. **Wallets** — connected wallets, disconnect, add wallet (Wallet Standard via `@solana/wallet-adapter`), primary badge
2. **Security** — 2FA status (future), signed-message sessions, active sessions list, revoke all
3. **Notifications** — push preferences (post-core), email (future), in-app toast toggles
4. **API / Keys** — RPC endpoint config (Helius/QuickNode), read-only API key for bots
5. **Referral Analytics** — code, clicks, signups, trades attributed, XP earned, share card
6. **Danger Zone** — delete account (revoke sessions, anonymize social, keep trade history)

**Rollback for Phase 1:** Drop `sessions`, `api_keys`, `notification_prefs` tables; remove route handlers from `worker.js`; delete account UI components; remove `/account` route from `App.tsx`.

### Phase 2: Viral Hooks (Day 2)

**Purpose:** Share card on every trade, referral in header, graduation = spectacle, enhanced ticker.

**Files:**
- Create: `src/components/viral/{TradeReceiptCard, GraduationModal, ReferralBanner}.tsx`, `src/hooks/useViral.ts`
- Modify: `src/components/TopNav.tsx` (integrate ReferralBanner), `src/components/TokenModal.tsx` (trigger TradeReceiptCard on index confirmation), `src/components/Ticker.tsx`, `src/components/TokenCard.tsx`, `src/pages/Home.tsx`, `src/lib/api.ts`

**Trade Receipt Share Card:**
- Trigger: After `POST /api/trades/index` confirms (buy/sell)
- Component: `src/components/viral/TradeReceiptCard.tsx`
- Content: Token emoji + name, SOL amount, USD value, price impact, fee, referral code, gradient background matching token emoji
- Actions: Native Share API → Twitter/X intent → copy link → save image
- Confetti: `confettiBurst('trade')` on receipt mount

**Referral Banner (Persistent, TopNav):**
- Location: `TopNav.tsx` — right of wallet button
- Content: `"Invite friends → earn 10% of their fees forever"` + copy button + share icon
- State: Shows referral code; click → copies + toast `"Copied! Share your link"`

**Graduation Ceremony:**
- Trigger: Polling-based detection in `Home.tsx` token refresh cycle (every 30s) — when `token.complete === true` && `token.migrationReady === true` && not yet shown
- Component: `src/components/viral/GraduationModal.tsx` (full-screen, portal)
- Sequence: Confetti burst → gradient sweep → "GRADUATED TO RAYDIUM" → pool link → "Ape In" CTA → auto-close 8s
- Sound: Optional `audioCtx` chime (respects `prefers-reduced-motion`)
- State tracking: `localStorage.setItem('graduation_seen_<tokenId>', '1')` to prevent repeat shows

**Enhanced Ticker + Token Card Live Indicators:**
- Ticker: Add holder delta `+12 holders`, volume sparkline micro, color-coded buy/sell
- TokenCard: Green pulse ring on buy, red on sell; holder count live badge

**Rollback for Phase 2:** Delete `TradeReceiptCard.tsx`, `GraduationModal.tsx`, `ReferralBanner.tsx`; remove viral hooks from `TokenModal.tsx`, `TopNav.tsx`, `TokenCard.tsx`, `Ticker.tsx`, `Home.tsx`.

### Phase 3: Professional Polish (Day 3)

**Purpose:** Lighthouse PWA ≥90, axe-core 0 AA violations, skip link, focus rings, reduced-motion, visual regression baselines, touch targets.

**Files:**
- Modify: `src/App.tsx` (skip link), `src/index.css` (focus rings, reduced-motion, skip link styles, color-scheme dark), `tailwind.config.js`, `vite.config.ts` (Lighthouse CI config)
- Create: `tests/e2e/polish.test.ts` (Lighthouse + axe-core), `tests/visual/baseline/` (Playwright screenshots)

**Steps:**
1. Lighthouse PWA audit — target ≥90 (manifest, SW, offline, installability)
2. Accessibility audit — axe-core 0 violations AA:
   - Skip link (`#main-content`) in root layout (`src/App.tsx`)
   - Focus rings on all interactive (`:focus-visible` via Tailwind `focus-visible:ring-2 focus-visible:ring-pump`)
   - ARIA live region for ticker (`polite`) in `Ticker.tsx`
   - `prefers-reduced-motion` disables all `animate-*` (global CSS + GSAP config)
   - Touch targets ≥44px (audit `Button`, `TradeSheet`, `BottomTabBar`, `AccountTabs`)
   - `color-scheme: dark` in `src/index.css` on `:root`
3. Visual regression baseline — capture `Home`, `TokenModal`, `CreateTokenModal`, `Account` (Playwright)
4. Polish pass:
   - Consistent `gap-2` / `p-2.5` / `rounded-lg` density
   - Tabular nums on all metrics (`font-mono tabular-nums`)
   - Truncated wallet addresses `AbCd...1234` everywhere
   - Loading skeletons (shimmer) for all async sections
   - Error boundaries per route section

**Rollback for Phase 3:** Revert `vite.config.ts` PWA plugin, `manifest.webmanifest`, `service-worker.ts`, `main.tsx` SW registration; revert a11y CSS changes; restore original focus rings.

### Phase 4: Retention Loops (Day 4)

**Purpose:** Daily streak badge, quest progress toast, leaderboard snippet, push notification prompt (post-core stub), re-engagement toasts.

**Files:**
- Modify: `src/pages/Home.tsx` (streak badge, leaderboard snippet, quest toasts), `src/components/TopNav.tsx`, `src/components/TokenModal.tsx`, `src/pages/Profile.tsx`
- Create: `src/hooks/useRetention.ts`

**Steps:**
1. Daily streak badge in feed header (shows 🔥 + count)
2. Quest progress micro-toast on trade (`"Quest: First Trade ✅ +50 XP"`)
3. Leaderboard snippet in feed (top 3, expandable)
4. Push notification permission prompt (post-core, after first trade)
5. Re-engagement: `"Token you liked just graduated"` toast (Worker → DO → client)

**Rollback for Phase 4:** Remove streak badge from Home.tsx, remove quest toast logic, remove leaderboard snippet; revert push prompt stub.

---

## 6. Testing Strategy

### Per-phase TDD (RED → GREEN → REFACTOR)

Every phase follows the metaswarm-autopilot-execution verification checklist:
- [ ] Scope and every production/test consumer verified before edits
- [ ] TDD RED captured for each reported failure mode
- [ ] Focused GREEN tests pass
- [ ] Browser tests assert request payload **and** truthful response semantics where applicable
- [ ] Empty/no-match and infrastructure-unavailable paths are distinguishable
- [ ] Full configured test/coverage/typecheck/lint/build gates pass after the final edit
- [ ] Reviewer returns explicit PASS against the exact final filesystem

### Phase-specific test coverage

| Phase | Unit tests | Worker tests | Client/E2E tests | CI gate |
|---|---|---|---|---|
| 0 (Demo Purge) | `demo-purge.test.ts` (source-truth grep) | — | — | `npm run test:coverage` ≥100% |
| 0.5 (PWA) | — | — | `pwa.test.ts` (manifest, SW register, offline banner) | Lighthouse PWA ≥90 |
| 1 (Account) | `account.test.ts` (useAccount, API calls) | `account.test.js` (routes, D1 queries) | `account.test.tsx` (tabs render, disconnect, revoke) | `npm run test:coverage` ≥100% |
| 2 (Viral) | `useViral.test.ts` | — | `viral-hooks.test.tsx` (receipt, graduation, referral copy) | `npm run test:coverage` ≥100% |
| 3 (Polish) | — | — | `polish.test.ts` (axe-core, Lighthouse, touch targets) | Lighthouse PWA ≥90, axe 0 AA |
| 4 (Retention) | `useRetention.test.ts` | — | `retention-loops.test.tsx` (streak, quest toast, leaderboard) | `npm run test:coverage` ≥100% |

### Full gate after Phase 5

After Phase 5 validation:
- `npm run build` → exit 0
- `npm run lint` → 0 errors
- `npm run test:coverage` → 100% lines/branches/functions/statements
- Playwright E2E: create→buy→sell→share; Account tabs; Referral copy; Graduation; mobile viewport
- Lighthouse CI: PWA ≥90, Performance ≥90, Accessibility ≥95
- Source truth: `grep -r fixture\|mock\|placeholder\|lorem\|fake src/ --include="*.tsx"` → empty

---

## 7. External Prerequisites

| Prerequisite | Needed for | If absent |
|---|---|---|
| Cloudflare Pages env access | `FIXTURES_ENABLED=false` in production | Mark as test-only; CI fails if true outside test config |
| PWA icon generation (192x192, 512x512 PNG) | `manifest.webmanifest` icons | Generate from `og-launchpad.png`; if missing, use generated identicon |
| `@vite-pwa/vite-plugin-pwa` npm availability | Phase 0.5 | Standard npm install; no external dependency |
| Lighthouse CI availability | Phase 3 | `npm install -D @lhci/cli`; if unavailable, skip Lighthouse gate, run axe-core only |
| axe-core accessibility testing | Phase 3 | `@axe-core/playwright`; if unavailable, skip axe gate |

---

## 8. Risks, Tradeoffs, Open Questions

| Risk | Mitigation |
|---|---|
| **Account page scope creep** | Hard 6-tab spec; danger zone last; ship MVP, iterate |
| **Viral features feel spammy** | User-controlled toggles (NotificationPrefs); referral banner dismissible |
| **Graduation ceremony performance** | Canvas-confetti lazy-loaded; respects reduced-motion; 8s auto-close |
| **Worker schema migration** | Additive only; D1 migrations via `wrangler d1 execute --file`; backup before |
| **PWA offline trade disable** | SW never caches `/api/trades/*` or `/api/tokens/index`; offline banner disables trade sheet |
| **Demo purge breaks tests** | Test fixtures stay in `tests/fixtures/`; production code uses `FIXTURES_ENABLED` flag |
| **Dual wrangler config trap** | Every phase touching Worker/D1 explicitly specifies `workers/wrangler.toml` as the config; secrets on `hermes-api` worker only |
| **Coverage gate blocks mid-cycle** | Phase 0 fixes `test:coverage` script + vitest coverage config + `@vitest/coverage-v8` devDep BEFORE any feature WU; coverage enforced from WU-01 onward |

**Open Questions:**
- Push notifications now or post-core? → Post-core (requires DO + VAPID); stub UI toggles now
- Email notifications? → Future — skip for devnet
- 2FA / passkeys? → Future — SecurityPanel shows "Coming Soon"
- Token detail page (SEO) or modal only? → Modal for app; static `/token/:id` page for SEO (P2)
- WebSocket real-time or polling? → P0 = verified REST polling; DO post-core (per existing plan)

---

## 9. Success Metrics

| Metric | Baseline | Target |
|---|---|---|
| LCP | ~2.0s | < 1.8s |
| Time to First Trade | ~4s | < 3s |
| Mobile Conversion (create token) | ~25% | > 35% |
| Session Duration | ~6min | > 10min |
| Referral Link Shares | ~200/day | > 500/day |
| Graduation Ceremony Completion | N/A | > 90% |
| Account Page Visit Rate | 0% | > 15% of sessions |
| Trade Receipt Share Rate | 0% | > 20% of trades |
| PWA Install Rate | N/A | > 5% of mobile sessions |

---

## 10. Execution Order (Metaswarm Autopilot — Ralph Iterations)

| Iteration | WU | Phase | Dependencies | CI gate after |
|---|---|---|---|---|
| 1 | WU-00 | Phase 0 — Demo Purge | None | `npm run test:coverage` ≥100% (FIX coverage infra first) |
| 2 | WU-01 | Phase 0.5 — PWA Infrastructure | WU-00 | Lighthouse PWA ≥90, build pass |
| 3 | WU-02 | Phase 1 — Account Page | WU-01 (PWA manifest available for installable account page) | `npm run test:coverage` ≥100%, Worker tests pass |
| 4 | WU-03 | Phase 2 — Viral Hooks | WU-02 | `npm run test:coverage` ≥100%, E2E viral hooks pass |
| 5 | WU-04 | Phase 3 — Professional Polish | WU-03 | Lighthouse PWA ≥90, axe 0 AA, build pass |
| 6 | WU-05 | Phase 4 — Retention Loops | WU-04 | `npm run test:coverage` ≥100%, E2E retention pass |
| 7 | WU-06 | Phase 5 — Validation & Deploy | WU-05 | Full gate: build + lint + coverage + E2E + Lighthouse + source truth |

**State files:**
- `.omh/state/autopilot-state.json` — high-level session tracking
- `.omh/state/ralph-state.json` — current task index, completed tasks
- `.omh/state/ralph-tasks-state.json` — detailed task list with statuses

**CI gate verification per WU (metaswarm-autopilot-execution §5):**
```bash
npm run build        # Must pass
npm run lint         # Must pass
npm run test:coverage  # Must pass, coverage ≥100%
```

---

## 11. NOT In Scope (Explicit Exclusions)

- Raydium graduation claim changes (existing program boundary)
- New on-chain instructions or fee changes
- WebSocket real-time (post-core DO — polling only for now)
- Push notification delivery (post-core — stub UI toggles only)
- Email notifications (future)
- 2FA / passkeys (future — SecurityPanel shows "Coming Soon")
- Token detail SEO page (P2 — modal for app only)
- GO custody, Mayhem protocol, PumpSwap, `$PUMP`, native app (explicitly excluded per shipped plan)

---

*Design complete. Next step: spec self-review, then user reviews written spec, then invoke writing-plans to create implementation plan, then start metaswarm-autopilot-execution.*
