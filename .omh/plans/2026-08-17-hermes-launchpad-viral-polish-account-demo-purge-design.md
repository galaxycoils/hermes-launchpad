---
title: "Hermes Launchpad — Viral Polish + Account Page + Demo Purge (REVISED, iteration 2)"
date: "2026-08-17"
slug: "hermes-launchpad-viral-polish-account-demo-purge-design"
status: "draft-revised"
tags: [ui-polish, viral-growth, account-page, demo-cleanup, pump.fun-parity, design]
---

# Hermes Launchpad — Viral Polish, Account Page, Demo Purge: Design Spec (REVISED for Plan Review Gate, iteration 2)

> **Goal:** Take the shipped Phase 1-3 foundation and push it to **measurably better than pump.fun** on: engagement, viral loops, professional polish, and zero demo fluff.
>
> **REVISION NOTE:** This iteration corrects the "Current Ground Truth" section, which in iteration 1 was authored against a stale/imagined codebase. The backend account routes, the PWA infrastructure, the viral share/graduation components, the coverage gate, and the account client API are **already implemented** (mostly as uncommitted working-tree changes). The plan is reframed from "build from scratch" to "verify, complete, and enhance the partially-built implementation," and drops the layered backend refactor and the false 100% coverage precondition. All 19 blocking issues from the iteration-1 gate are addressed below.

---

## 1. Design Philosophy: "Ruthless Degen-Native"

1. **Zero demo data** — production read paths ship no fake/fixture/mock/lorem data (verified: none exists in `src/`).
2. **Viral by default** — share card on every trade, referral in header, graduation = spectacle.
3. **Account as command center** — wallets, security, API keys, notifications, referral analytics.
4. **Pump.fun parity + AI honesty** — same speed/density, but AI never lies: the `demo`/`simulated` provenance badge is an **honest capability-state label** (meaning "not yet on-chain verified"), NOT "demo fluff" to be purged.
5. **PWA-first** — already installable (manifest + SW + offline shell shipped).

---

## 2. Current Ground Truth (VERIFIED against the real repo, iteration 2)

| Aspect | State (verified) |
|---|---|
| **Stack** | Vite 7, React 19, TypeScript, Tailwind 3.4, Radix UI, Recharts, `@solana/web3.js`, Vitest |
| **Deploy** | Cloudflare Pages (FE) + Workers (API) + D1 — live at `hermes-launchpad.pages.dev` / `hermes-api.tahamtandariush.workers.dev` |
| **Theme** | True black (`#000`), pump green `#00FF00`, pump red `#FF0000`, Hermes purple `#A855F7` |
| **Components (exist)** | TokenCard, TokenModal, CreateTokenModal, Ticker, KingOfHill, WalletButton, TopNav, BottomTabBar, Avatar, Badge, Button, ConfettiBurst, Hero, Surface, Progress, Skeleton, Stat, **TradeReceiptCard** (top-level), **GraduationModal** (top-level) |
| **Components (DO NOT exist)** | `Sparkline` (removed from spec — not referenced), **ReferralBanner** (Phase 2 creates it), `src/components/viral/*` (do NOT create — enhance the top-level components instead) |
| **Pages** | `Home.tsx` (single feed + Profile & Account as TABS via `initialTab`); **NO `Profile.tsx`** — Profile UI lives in `Home.tsx` (`/profile` → `<Home initialTab="profile" />`); **`Account.tsx` does NOT exist** (Phase 1 creates it) |
| **Wallet integration** | Custom shim `@/lib/wallet` (`connectWallet`, `getProvider`) — **NOT `@solana/wallet-adapter`** (not installed) |
| **Account backend (DONE, uncommitted)** | `workers/worker.js` already implements: `GET/POST /api/account/wallets` (wallets + session register), `GET/POST /api/account/security` (+ `/2fa` stub), `GET/POST /api/account/notifications`, `GET/POST /api/account/api-keys`, `GET /api/account/referrals`, `DELETE /api/account` (cascade). Auth via `verifyAuth(request)` (Wallet-Signature/Wallet-Nonce single-use challenge). Sessions inserted on `POST /api/account/wallets`. |
| **Account client (DONE, uncommitted)** | `src/lib/api.ts` already exports `fetchWallets`, `registerWalletSession`, `fetchNotificationPrefs`, `updateNotificationPrefs`, `fetchApiKeys`, `createApiKey`, `fetchAccountReferrals`, `deleteAccount` + interfaces `WalletSession`/`NotificationPrefs`/`ApiKey`/`CreateApiKeyResult`/`AccountReferrals` |
| **D1 tables (DONE, migrated)** | `workers/migrations/001_account_tables.sql` already creates `sessions`, `api_keys`, `notification_prefs` |
| **PWA (DONE, uncommitted)** | `public/manifest.webmanifest` (incl. `/account` shortcut), `src/service-worker.ts` (Workbox), `vite.config.ts` `VitePWA` plugin, `src/main.tsx` registers `/sw.js` + `beforeinstallprompt`, `public/icons/icon-192.png` + `icon-512.png`, `public/og-launchpad.png` |
| **Viral (PARTIAL, uncommitted)** | `TradeReceiptCard.tsx` + `GraduationModal.tsx` exist; `Home.tsx` has graduation detection (`checkGraduations`, localStorage `graduation_seen_` guard); **ReferralBanner missing** |
| **A11y** | Skip link **already exists** in `src/App.tsx` (`<a href="#main-content" className="skip-link">`) |
| **Test/Build** | `npm run build`, `npm run lint` wired; `npm run test:coverage` EXISTS; `vitest.config.ts` HAS a `coverage` block (provider `v8`); `@vitest/coverage-v8` IS a devDep |
| **Coverage thresholds (source of truth)** | `.coverage-thresholds.json` enforces **33/47/26/33** (lines/branches/functions/statements). 100% is a stated *campaign target*, NOT the current enforced gate. Plan uses the real 33/47/26/33 thresholds. |
| **Wrangler configs** | TWO — root `wrangler.jsonc` (Pages) + `workers/wrangler.toml` (hermes-api, D1). Worker/D1 changes target `workers/wrangler.toml`. |
| **Demo data** | `grep -rniE 'fixture|\bmock\b|lorem|\bfake\b' src/` returns **nothing**. The only `demo` references are the honest `provenance: 'demo'` / `Badge variant="demo"` capability-state labels in `TokenCard.tsx`, `TokenModal.tsx`, `lib/tokens.ts`, `lib/token-truth.ts`; Phase 0 Step 3 renames these to `simulated`/`unverified` so NO `demo` string remains. `placeholder=` occurrences are legitimate HTML input attributes, NOT demo copy. |
| **FIXTURES_ENABLED** | Does NOT exist in code (only referenced in `docs/`). The plan does NOT depend on it. |

---

## 3. Approaches Considered

### Approach A: Finish + enhance the partially-built implementation across all 6 phases (SELECTED)
- Build the still-missing pieces (Account page UI, ReferralBanner, retention loops, a11y/Lighthouse polish, accurate demo-capability copy) and verify/align the already-shipped backend, PWA, and viral components.
- Pros: matches reality; avoids re-implementing working code; single coherent delta.
- Cons: must verify the uncommitted working-tree changes actually pass gates before building on them.

### Approach B: Re-implement backend with a layered service/repository refactor (REJECTED)
- The user asked for "new D1 tables + Worker routes," which already exist as flat handlers in `workers/worker.js`. A `accountService.js`/`accountRepository.js` rewrite is scope creep and risks breaking shipped routes. Reuse the existing flat handlers.

---

## 4. Architecture

### 4.1 Backend — REUSE existing flat `workers/worker.js` routes (no layered refactor)
The account backend is already implemented. Phase 1 adds **frontend only**:
- Use existing route names exactly: `/api/account/wallets` (list + register session), `/api/account/security`, `/api/account/notifications`, `/api/account/api-keys`, `/api/account/referrals`, `DELETE /api/account`.
- Auth: every account route already calls `verifyAuth(request)` to resolve the wallet/`user_id` from `Wallet-Signature`/`Wallet-Nonce`. No new auth middleware needed.
- Sessions are created by `POST /api/account/wallets` (`registerWalletSession`) — the Security tab's "active sessions" list is sourced from `GET /api/account/wallets`. No separate `POST /api/sessions` route is needed.
- If a per-id API-key revoke is desired later, extend the existing `api-keys` handler; the plan does NOT introduce `/api/sessions` or `/api/account/notification-prefs` (those names do not match the shipped worker).

### 4.2 Frontend Architecture
```
src/pages/Account.tsx            (CREATE — 6 tabs, lazy via React.lazy + Suspense in App.tsx)
  → src/components/account/AccountTabs.tsx (mobile sheet / desktop sidebar)
    → WalletManager / SecurityPanel / NotificationPrefs / ApiKeys / ReferralAnalytics / DangerZone (.tsx)
src/components/
  → ReferralBanner.tsx           (CREATE — the only missing viral component, at top level like existing viral components)
  → TradeReceiptCard.tsx         (ENHANCE existing src/components/TradeReceiptCard.tsx in place)
  → GraduationModal.tsx          (ENHANCE existing src/components/GraduationModal.tsx in place)
src/hooks/
  → useAccount.ts  (CREATE or EXTEND — wraps existing lib/api.ts account methods)
  → useViral.ts    (CREATE — share/confetti/graduation triggers; reuse existing components)
  → useRetention.ts(CREATE — Phase 4)
```
- **Do NOT create `src/components/viral/TradeReceiptCard.tsx` or `GraduationModal.tsx`** — enhance the existing top-level files and keep their current import paths (`@/components/TradeReceiptCard`, `@/components/GraduationModal`) so `TokenModal.tsx`/`Home.tsx` keep working.
- **Composition over inheritance:** viral components compose `ConfettiBurst`, existing `Button`, existing `Surface`.
- **Lazy loading:** `Account.tsx` lazy-loaded via `React.lazy` + `Suspense` in `src/App.tsx` (add `<Route path="/account" .../>`).

### 4.3 Data Flow (uses existing routes/client)
```
Account.tsx (lazy) → useAccount → lib/api.ts GET /api/account/wallets|notifications|api-keys|referrals
  → Worker verifyAuth → existing account handlers → D1 (already built)
Write (revoke session): AccountTabs → SecurityPanel → useAccount.revokeSession(id)
  → lib/api.ts DELETE is not a separate route; revoke via re-register or extend worker's wallets handler (specify in WU)
Graduation: Home.tsx checkGraduations (every 30s) → GraduationModal (existing) → confetti → auto-close 8s → localStorage graduation_seen_<id>
```

### 4.4 Error Handling
- Backend: existing structured errors `{ error: { code, message, retryable } }`.
- Frontend: trade sheet disabled when offline (new `useOffline()` context from `navigator.onLine` + SW messages) / degraded / unverified (existing pattern); viral hooks degrade gracefully (Native Share unavailable → copy link fallback, already in `TradeReceiptCard.tsx`).
- Service worker: never caches `/api/trades/*`, `/api/tokens/index` (mutable trade state) — verify the existing Workbox `runtimeCaching` excludes these.
- Feature flags: if needed, gate the Account page behind an `ACCOUNT_PAGE_ENABLED` flag (default false until Phase 1 UI complete) — but NO `FIXTURES_ENABLED` dependency.

---

## 5. Phase-by-Phase Design (REVISED)

### Phase 0: Demo Capability Copy (Day 0)
**Purpose:** Guarantee production read paths carry no fake/fixture/mock/lorem data and use honest capability-state strings for unverified data. (The `demo`/`simulated` provenance badge is kept as an honest label — it is NOT demo fluff.)

**Files:**
- Modify: `src/pages/Home.tsx` (profile/demo copy in the Profile tab), `src/components/TokenModal.tsx`, `src/components/TokenCard.tsx`
- Create: `tests/unit/demo-purge.test.ts` (accurate source-truth check — includePattern: `/fixture|mock|placeholder|lorem|fake|demo/i`)

**Steps:**
1. `grep -rniE 'fixture|\bmock\b|lorem|\bfake\b' src/ --include='*.tsx' --include='*.ts'` → confirm it returns NOTHING (verified: it does). No demo data to remove.
2. Ensure unverified/on-chain-not-yet-verified data uses honest capability-state copy, e.g.:
   - `"Live · verified on-chain at slot {slot}"`
   - `"Stale · last verified {time} — reconnecting"`
   - `"Unavailable · AI disabled"` / `"Unavailable · wallet not connected"` / `"Unavailable · feature degraded"` / `"Unavailable · feature planned"`
3. Rename ALL `demo` tokens — both the visible badge strings AND the internal `provenance: 'demo'` enum, `BadgeVariant "demo"`, `TokenCurveStatus 'demo'`, `isDemo`, `status === "demo"` — to honest capability-state values (`simulated` / `unverified`). The visible badge becomes `"Simulated"` / `"Not on-chain"` instead of `"Demo"` / `"AI simulated"`. This keeps provenance labeling (AI-honesty philosophy) while removing every `demo` string from `src/`. (Decision: keep provenance labels as honest capability states, not fluff.)
4. Source-truth CI check — enforces the user's explicit "remove all demo copy" requirement (includes `demo`; excludes only legitimate `placeholder=` HTML attributes):
   `grep -rniE 'fixture|\bmock\b|lorem|\bfake\b|demo' src/ --include='*.tsx' --include='*.ts' | grep -viE 'placeholder=' ` → must be empty. Because Step 3 renames every `demo` token to an honest value, this grep passes empty after the rename and would catch any regression (a stray `demo` / `Demo` / `AI simulated` string).
5. **No `FIXTURES_ENABLED` env var** (it does not exist). Reliance is on the absence of demo data in code, verified by step 4.

**Rollback:** Revert capability-state string edits; the CI grep is non-destructive.

### Phase 0.5: PWA Verify & Align (Day 0.5)
**Purpose:** Confirm the already-shipped PWA meets the spec; fill any gaps. (Nothing to "create" — all infra exists.)

**Files (VERIFY, do not blindly recreate):**
- Verify: `public/manifest.webmanifest`, `src/service-worker.ts`, `vite.config.ts` (VitePWA), `src/main.tsx` (SW register + beforeinstallprompt), `public/icons/*`, `public/og-launchpad.png`
- Modify only if a gap is found: `vite.config.ts` (runtimeCaching exclusions), `src/main.tsx` (offline banner trigger), `src/service-worker.ts`

**Steps:**
1. Verify `manifest.webmanifest` has `name`, `short_name`, `description`, `theme_color #000000`, `background_color #000000`, `display standalone`, `orientation portrait-primary`, `icons` 192/512, `shortcuts` (Create/Account/Leaderboard).
2. Verify `vite.config.ts` `VitePWA` `registerType: autoUpdate`, `cleanupOutdatedCaches: true`, and `runtimeCaching` never caches `/api/trades/*`, `/api/tokens/index`, `/api/profile`, `/api/account/*`.
3. Verify `src/main.tsx` registers `/sw.js` and handles `beforeinstallprompt`/`appinstalled`.
4. Add offline banner that disables the trade sheet when the SW reports offline — CREATE the offline/disabled detection logic (no existing pattern): wire `navigator.onLine` + SW `message` event (`offline`/`online` state) → React context `useOffline()` → `TradePanel` reads context and disables submit when offline; show non-intrusive banner at top of feed.
5. Icons: 192/512 PNGs exist; `og-launchpad.png` exists (icon source available).

**Rollback:** Revert only the specific edits made in step 2–4.

### Phase 1: Account Page — `/account` (Day 1)
**Purpose:** Full 6-tab account page UI. **Backend + client already done** — this phase is frontend only.

**Files:**
- Create: `src/pages/Account.tsx` (lazy), `src/components/account/{AccountTabs, WalletManager, SecurityPanel, NotificationPrefs, ApiKeys, ReferralAnalytics, DangerZone}.tsx`, `src/hooks/useAccount.ts`
- Modify: `src/App.tsx` (**ADD** `/account` route + `React.lazy` import — required, was missing in iteration 1), `src/lib/api.ts` (extend only if a client method is missing, e.g. `fetchSecurity`)
- Backend (DONE, verify only): `workers/worker.js` routes, `workers/schema.sql`/`migrations/001_account_tables.sql` tables

**Small backend extensions (Phase 1, additive to existing flat routes):**
- Add `DELETE /api/account/wallets/:id` (revoke a single session) and `DELETE /api/account/api-keys/:id` (revoke a single API key) to `workers/worker.js`, reusing `verifyAuth` + the existing `sessions`/`api_keys` tables. (The shipped worker only had `GET/POST /api/account/wallets` and `GET/POST /api/account/api-keys`; per-id revoke was missing. "Revoke all" maps to `DELETE /api/account` cascade or a batch variant.)
- `lib/api.ts`: add `revokeWalletSession(id, auth)` and `revokeApiKey(id, auth)` client methods if not already present.

**Frontend tabs (consume EXISTING routes/client):**
1. **Wallets** — connected wallets + active sessions via `fetchWallets`/`registerWalletSession`; disconnect/revoke; "primary" badge.
2. **Security** — 2FA status (future stub), active sessions list (`fetchWallets`), revoke all.
3. **Notifications** — `fetchNotificationPrefs`/`updateNotificationPrefs` toggles.
4. **API / Keys** — `fetchApiKeys`/`createApiKey`; (per-id revoke: extend worker's api-keys handler if required).
5. **Referral Analytics** — `fetchAccountReferrals`/`fetchReferrals`: code, clicks, signups, trades, XP, share card.
6. **Danger Zone** — `deleteAccount` (cascade: revoke sessions/keys, anonymize social, keep trades).

**Deleted-account re-login edge case (iteration-1 gap, now specified):** After `DELETE /api/account`, if the same wallet reconnects, the worker creates a **fresh profile** (new `user_id`); previously anonymized social comments/likes stay anonymized and are NOT re-associated; historical trades remain attributed to the original wallet address (not the new profile). Document this in the Danger Zone UI copy.

**Rollback:** Delete `Account.tsx` + `src/components/account/*` + `useAccount.ts`; remove `/account` route from `App.tsx`. (Backend tables/routes are already shipped and stay.)

### Phase 2: Viral Hooks (Day 2)
**Purpose:** Referral in header + ensure trade receipt & graduation are wired. (TradeReceiptCard + GraduationModal already exist.)

**Files:**
- Create: `src/components/ReferralBanner.tsx` (only missing viral component, at top level)
- Enhance (in place, keep import paths): `src/components/TradeReceiptCard.tsx`, `src/components/GraduationModal.tsx`, `src/hooks/useViral.ts` (create)
- Modify: `src/components/TopNav.tsx` (integrate ReferralBanner), `src/components/TokenModal.tsx` (ensure TradeReceiptCard trigger on confirm), `src/components/Ticker.tsx`, `src/components/TokenCard.tsx`, `src/pages/Home.tsx`

**Trade Receipt Share Card:** already in `TradeReceiptCard.tsx` — verify trigger on `POST /api/trades/index` confirm; content (emoji+name, SOL, USD, impact, fee, referral, gradient); actions (Native Share → Twitter/X intent → copy link → save image); `confettiBurst('trade')`.
**Referral Banner:** create `ReferralBanner.tsx`; place in `TopNav.tsx` right of wallet button; copy + share icon; click copies link + toast.
**Graduation Ceremony:** already in `GraduationModal.tsx` + `Home.tsx checkGraduations`; verify localStorage `graduation_seen_<id>` guard, 8s auto-close, reduced-motion respect.
**Enhanced Ticker/TokenCard:** add holder delta, volume sparkline micro (build inline — `Sparkline` component does NOT exist), color-coded buy/sell, green/red pulse rings.

**Rollback:** Delete `ReferralBanner.tsx` + `useViral.ts`; revert enhancements in TokenModal/TopNav/TokenCard/Ticker/Home.

### Phase 3: Professional Polish (Day 3)
**Purpose:** Lighthouse PWA ≥90, axe-core 0 AA, a11y, visual regression. (Skip link already exists.)

**Files:**
- Modify: `src/App.tsx` (verify skip link), `src/index.css` (focus rings, reduced-motion, `color-scheme: dark`), `tailwind.config.js`, `vite.config.ts` (Lighthouse CI)
- Create: `tests/e2e/polish.test.ts`, `tests/visual/baseline/` (Playwright auto-creates `tests/visual/` on first run; CI script runs `mkdir -p tests/visual` before test)

**Steps:**
1. Lighthouse PWA audit ≥90 (manifest, SW, offline, installability).
2. axe-core 0 AA: skip link (`#main-content`) verified present; `:focus-visible` rings; ARIA live region for ticker (`polite`); `prefers-reduced-motion` disables `animate-*` (global CSS + any GSAP); touch targets ≥44px (audit Button/TradeSheet/BottomTabBar/AccountTabs); `color-scheme: dark` on `:root`.
3. Visual regression baseline (Playwright): Home, TokenModal, CreateTokenModal, Account.
4. Polish: consistent density, tabular-nums metrics, truncated wallet addresses, loading skeletons, per-route error boundaries.

**Rollback:** Revert CSS/config; remove visual baseline screenshots.

### Phase 4: Retention Loops (Day 4)
**Purpose:** Daily streak badge, quest progress toast, leaderboard snippet, push stub, re-engagement toasts.

**Files:**
- Modify: `src/pages/Home.tsx`, `src/components/TopNav.tsx`, `src/components/TokenModal.tsx`, `src/pages/Home.tsx` (profile tab)
- Create: `src/hooks/useRetention.ts`

**Steps:**
1. Daily streak badge in feed header (🔥 + count) — source from existing `checkin` endpoint.
2. Quest progress micro-toast on trade (`fetchQuests` live flag).
3. Leaderboard snippet in feed (top 3, expandable) — existing `/api/leaderboard`.
4. Push notification permission prompt (post-core, after first trade; stub UI only).
5. Re-engagement: "Token you liked just graduated" toast (Worker → DO → client; post-core).

**Rollback:** Remove streak/quest/leaderboard/toast logic.

---

## 6. Testing Strategy (REVISED — real coverage thresholds)

### Per-phase TDD (RED → GREEN → REFACTOR)
Same verification checklist as iteration 1, applied to the revised phases.

### Phase-specific coverage
| Phase | Unit tests | Worker tests | Client/E2E tests | CI gate |
|---|---|---|---|---|
| 0 (Demo Copy) | `demo-purge.test.ts` (accurate grep — includePattern includes `demo`) | — | — | `npm run test:coverage` (real 33/47/26/33) |
| 0.5 (PWA) | — | — | `pwa.test.ts` (manifest, SW register, offline banner) | Lighthouse PWA ≥90 |
| 1 (Account) | `account.test.ts` (useAccount) | (backend already tested — verify existing) | `account.test.tsx` (tabs render, disconnect, revoke, delete+re-login) | `npm run test:coverage` (real 33/47/26/33) |
| 2 (Viral) | `useViral.test.ts` | — | `viral-hooks.test.tsx` (receipt, graduation, referral copy) | `npm run test:coverage` (real 33/47/26/33) |
| 3 (Polish) | — | — | `polish.test.ts` (axe-core, Lighthouse, touch targets) | Lighthouse PWA ≥90, axe 0 AA |
| 4 (Retention) | `useRetention.test.ts` | — | `retention-loops.test.tsx` | `npm run test:coverage` (real 33/47/26/33) |

> **Coverage gate uses the source-of-truth `.coverage-thresholds.json` (33/47/26/33).** A future campaign MAY raise thresholds toward 100% per-WU, but this plan does NOT assume 100% and does NOT modify the thresholds file.

### Full gate
- `npm run build` exit 0; `npm run lint` 0 errors; `npm run test:coverage` passes real thresholds.
- Playwright E2E: create→buy→sell→share; Account tabs; Referral copy; Graduation; mobile viewport.
- Lighthouse CI: PWA ≥90, Performance ≥90, Accessibility ≥95.
- Source truth: `grep -rniE 'fixture|\bmock\b|lorem|\bfake\b|demo' src/ --include='*.tsx' --include='*.ts' | grep -viE 'placeholder='` → empty.

---

## 7. External Prerequisites (REVISED)
| Prerequisite | Needed for | If absent |
|---|---|---|
| Cloudflare Pages env access | deploy | standard |
| PWA icons (192/512 PNG) | manifest | **EXIST** (`public/icons/icon-192.png`, `icon-512.png`); `og-launchpad.png` exists as source |
| `vite-plugin-pwa` | Phase 0.5 | **ALREADY installed** (devDep) |
| `@vitest/coverage-v8` | coverage | **ALREADY installed** (devDep) |
| Lighthouse CI | Phase 3 | `npm i -D @lhci/cli`; if unavailable, axe-core only |
| axe-core | Phase 3 | `@axe-core/playwright`; if unavailable, skip axe gate |

---

## 8. Risks, Tradeoffs, Open Questions (REVISED)
| Risk | Mitigation |
|---|---|
| Uncommitted working-tree changes may not pass gates yet | Run build/lint/coverage on the current tree BEFORE building Phase 1–4 UI; fix regressions first |
| Account page scope creep | Hard 6-tab spec; danger zone last |
| Viral features feel spammy | User-controlled toggles; referral banner dismissible |
| Graduation ceremony perf | Canvas-confetti lazy; reduced-motion; 8s auto-close |
| PWA offline trade disable | SW never caches `/api/trades/*`/`/api/tokens/index`; offline banner |
| Dual wrangler config | Worker/D1 edits target `workers/wrangler.toml`; secrets on `hermes-api` only |
| Coverage gate | Uses real 33/47/26/33 thresholds; no false 100% precondition |

**Open Questions (unchanged):** push now or post-core (post-core); email (future); 2FA/passkeys (future); token SEO page (P2); WebSocket (polling only).

---

## 9. Success Metrics (unchanged from iteration 1)
| Metric | Baseline | Target |
|---|---|---|
| LCP | ~2.0s | < 1.8s |
| Time to First Trade | ~4s | < 3s |
| Mobile Conversion (create token) | ~25% | > 35% |
| Session Duration | ~6min | > 10min |
| Referral Link Shares | ~200/day | > 500/day |
| Graduation Ceremony Completion | N/A | > 90% |
| Account Page Visit Rate | 0% | > 15% |
| Trade Receipt Share Rate | 0% | > 20% |
| PWA Install Rate | N/A | > 5% |

---

## 10. Execution Order (REVISED — reflects partial-done state)
| Iteration | WU | Phase | Dependencies | CI gate after |
|---|---|---|---|---|
| 1 | WU-00 | Phase 0 — Demo Capability Copy | None | `npm run test:coverage` (real thresholds) |
| 2 | WU-01 | Phase 0.5 — PWA Verify & Align | WU-00 | Lighthouse PWA ≥90, build pass |
| 3 | WU-02 | Phase 1 — Account Page UI | WU-01 (verify existing backend/client) | `npm run test:coverage`, account E2E |
| 4 | WU-03 | Phase 2 — Viral Hooks (ReferralBanner + wire existing) | WU-02 | `npm run test:coverage`, viral E2E |
| 5 | WU-04 | Phase 3 — Professional Polish | WU-03 | Lighthouse PWA ≥90, axe 0 AA |
| 6 | WU-05 | Phase 4 — Retention Loops | WU-04 | `npm run test:coverage`, retention E2E |
| 7 | WU-06 | Phase 5 — Validation & Deploy | WU-05 | Full gate |

**Note:** Coverage infra is already wired (step removed from Phase 0). Backend account routes + client API are already implemented; Phase 1 WU builds only the UI.

---

## 11. NOT In Scope (unchanged)
Raydium graduation claim changes; new on-chain instructions/fee changes; WebSocket realtime; push delivery (post-core stub only); email notifications; 2FA/passkeys (future stub); token detail SEO page (P2); GO custody, Mayhem, PumpSwap, `$PUMP`, native app.

---

*Design revised for Plan Review Gate iteration 2. All iteration-1 blocking issues addressed: (1) Profile.tsx→Home.tsx tab; (2) Account.tsx create (artifact removed); (3) Sparkline dropped; (4) coverage claims corrected + real 33/47/26/33 thresholds; (5) Phase 0.5/PWA marked already-shipped; (6) Phase 1 backend/client marked already-shipped, layered refactor dropped, existing route names used, App.tsx added, re-login edge case specified; (7) FIXTURES_ENABLED removed; (8) wallet shim (not @solana/wallet-adapter) used; (9) viral components enhanced in place, ReferralBanner created; (10) accurate CI grep excluding placeholder=; (11) og-launchpad.png exists; (12) demo badge kept as honest label.*
