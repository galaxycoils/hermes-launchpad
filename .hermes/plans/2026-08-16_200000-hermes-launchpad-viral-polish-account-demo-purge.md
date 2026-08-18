---
title: "Hermes Launchpad — Viral Polish + Account Page + Demo Purge"
date: "2026-08-16"
slug: "hermes-launchpad-viral-polish-account-demo-purge"
status: "draft"
tags: [ui-polish, viral-growth, account-page, demo-cleanup, pump.fun-parity]
---

# Hermes Launchpad — Viral Polish, Account Page, Demo Purge

> **Goal:** Take the shipped Phase 1-3 foundation (true-black dark, compact cards, King of Hill, polling ticker, bottom-sheet modal, 3-step wizard, Trade/Profile IA) and push it to **measurably better than pump.fun** on: engagement, viral loops, professional polish, and zero demo fluff.

---

## Current Context / Assumptions

| Aspect | State (verified) |
|--------|------------------|
| **Stack** | Vite 7, React 19, TypeScript, Tailwind 3.4, Radix UI, Recharts, @solana/web3.js |
| **Deploy** | Cloudflare Pages (FE) + Workers (API) + D1 — **live at `hermes-launchpad.pages.dev` / `hermes-api.tahamtandariush.workers.dev`** |
| **Theme** | True black (`#000`), pump green `#00FF00`, pump red `#FF0000`, Hermes purple `#A855F7` |
| **Components** | TokenCard, TokenModal (bottom sheet), CreateTokenModal (wizard), Ticker, KingOfHill, Sparkline, WalletButton, TopNav, BottomTabBar, Avatar, Badge, Button, ConfettiBurst, Hero, Surface, Progress, Skeleton, Stat |
| **Pages** | `Home.tsx` (single feed), `Profile.tsx` (XP/referrals/quests/leaderboard) — **NO Account page** |
| **Test/Build** | `npm run build` ✅, `npm run lint` ✅, `vitest` 27/27 ✅ |
| **Pump.fun baseline** | Single-col feed, true black, green/red signals, confetti on buy, graduation spectacle, thumb-zone CTAs, live trades ticker, holder counts, social proof |

---

## Gaps to Close (from "better than pump.fun" bar)

| Gap | Pump.fun Has | Hermes Has | Fix |
|-----|--------------|------------|-----|
| **Account page** | Settings, security, notifications, API keys, connected wallets | **Missing** | Add `/account` route with tabs |
| **Viral hooks** | Share card on every trade, referral link in header, confetti on graduation | Basic share in modal | Trade receipt share card, referral banner, graduation ceremony |
| **Social proof** | "X bought Y SOL ago", live holder delta, trending badges | Basic ticker only | Enhanced ticker + token card live indicators |
| **Demo fluff** | None — all real | "Demo data" fallbacks, placeholder lore, fake AI scores | Purge all `fixture/demo` paths from production read; replace with `unavailable` copy |
| **Professional polish** | Consistent spacing, accessible focus, reduced-motion, PWA | Partial | Lighthouse PWA ≥90, a11y AA, skip link, focus rings, touch targets |
| **Retention loops** | Daily streak, quests, leaderboard | Profile has these but hidden | Surface in feed (streak badge), push notifications (post-core) |
| **Mobile trade sheet** | Bottom sheet, one-hand amounts, 44px targets | Modal (desktop) / sheet (mobile) | Harden: safe-area, keyboard dismiss, focus trap, screen-reader summary |

---

## Proposed Approach

### Design Philosophy: "Ruthless Degen-Native"

1. **Zero demo copy** — every string in production is either live-verified or explicitly `unavailable`
2. **Viral by default** — share card on every trade, referral in header, graduation = spectacle
3. **Account as command center** — wallets, security, API keys, notifications, referral analytics
4. **Pump.fun parity + AI honesty** — same speed/density, but AI never lies (provenance labels)
5. **PWA-first** — install prompt, offline shell, service worker, push (post-core)

### modern-web-guidance Integration

| Guide | Application |
|-------|-------------|
| `dark-mode` | Already true black; add `color-scheme: dark`, `light-dark()` for form controls |
| `persistent-app-tours` | First-visit: curve mechanic → AI agents → account setup → referral |
| `accessibility` | Skip link, focus rings, ARIA live regions for ticker, reduced-motion |
| `css` | Container queries for token density, CSS variables for design tokens |

---

## Step-by-Step Plan

### Phase 0: Demo Purge (Day 0 — do first)

- [ ] **0.1** Search `src/` for `fixture`, `mock`, `placeholder`, `lorem`, `fake` — list every occurrence (EXCLUDE legitimate `provenance: 'demo'` enum and `demo` badge variant)
- [ ] **0.2** Remove all demo fallbacks from production read paths (`Home.tsx`, `TokenModal.tsx`, `TokenCard.tsx`, `Profile.tsx`, `CreateTokenModal.tsx`)
- [ ] **0.3** Replace with `unavailable` capability state copy (inline strings — no external doc dependency):
  - `"Live · verified on-chain at slot {slot}"`
  - `"Stale · last verified {time} — reconnecting"`
  - `"Unavailable · AI disabled"` (for Bard/Oracle)
  - `"Unavailable · wallet not connected"` (for social writes)
  - `"Unavailable · feature degraded"` (for degraded state)
  - `"Unavailable · feature planned"` (for planned state)
- [ ] **0.4** Ensure `FIXTURES_ENABLED=false` in production env (Cloudflare Pages env vars; verify via `wrangler pages project env list`)
- [ ] **0.5** Add source-truth CI check: `grep -r "fixture\|mock\|placeholder\|lorem\|fake" src/ --include="*.tsx" | grep -v "provenance\|variant\|demo.*badge\|live.*false" ` → must return empty
- [ ] **0.6** Document capability state strings in plan (no external `CAPABILITY_STATES.md` needed)
- [ ] **0.7** **Rollback for Phase 0:** Restore original fallback arrays in `api.ts`; revert capability state strings to previous copy

### Phase 0.5: PWA Infrastructure Setup (Day 0.5 — before Phase 1)

- [ ] **0.5.1** Install `@vite-pwa/vite-plugin-pwa` as devDependency
- [ ] **0.5.2** Create `public/manifest.webmanifest` with:
  - `name: "Hermes Launchpad"`, `short_name: "Hermes"`, `description: "Fair-launch token curves with live market data"`
  - `theme_color: "#000000"`, `background_color: "#000000"`, `display: "standalone"`, `orientation: "portrait-primary"`
  - `icons`: 192x192 and 512x512 PNG (generate from og-launchpad.png or create)
  - `shortcuts`: [Create Token, Account, Leaderboard]
- [ ] **0.5.3** Configure `vite.config.ts` with Vite PWA plugin:
  - `registerType: "autoUpdate"`, `manifest: true`, `workbox: { cleanupOutdatedCaches: true, runtimeCaching: [...] }`
  - **Never cache** `/api/trades/*`, `/api/tokens/index`, `/api/profile` (mutable trade state)
- [ ] **0.5.4** Create `src/service-worker.ts` (minimal — Workbox generates SW; this file registers update prompt)
- [ ] **0.5.5** Register SW in `src/main.tsx`: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js') }`
- [ ] **0.5.6** Offline shell strategy: cache `index.html`, static assets, manifest; show offline banner on trade sheet
- [ ] **0.5.7** Add PWA icons to `public/` (192x192, 512x512 PNG) — generate from `og-launchpad.png`

### Phase 1: Account Page — `/account` (Day 1)

**New Route:** `src/pages/Account.tsx` (lazy-loaded via `React.lazy` + `Suspense`)

**Tabs (TopNav-style, mobile bottom-sheet):**
1. **Wallets** — connected wallets, disconnect, add wallet (Wallet Standard via `@solana/wallet-adapter`), primary badge
2. **Security** — 2FA status (future), signed-message sessions, active sessions list, revoke all
3. **Notifications** — push preferences (post-core), email (future), in-app toast toggles
4. **API / Keys** — RPC endpoint config (Helius/QuickNode), read-only API key for bots
5. **Referral Analytics** — code, clicks, signups, trades attributed, XP earned, share card
6. **Danger Zone** — delete account (revoke sessions, anonymize social, keep trade history)

**Components to create:**
- `src/components/account/{WalletManager,SecurityPanel,NotificationPrefs,ApiKeys,ReferralAnalytics,DangerZone}.tsx`
- `src/components/account/AccountTabs.tsx` (mobile: bottom sheet; desktop: sidebar)

**Worker Backend (PREREQUISITE — must complete before UI work):**
- **Schema:** Add to `workers/schema.sql` (single canonical CREATE file):
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
    scopes TEXT, -- JSON array: ["read:tokens", "read:trades"]
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
- **Routes:** Add handlers in `workers/worker.js` (flat structure — no `src/` subdirectory):
  - `GET /api/sessions` → list active sessions for current user
  - `DELETE /api/sessions/:id` → revoke session
  - `DELETE /api/sessions` → revoke all sessions
  - `GET /api/account/api-keys` → list user's API keys (hashed)
  - `POST /api/account/api-keys` → create new API key (return plaintext once)
  - `DELETE /api/account/api-keys/:id` → revoke API key
  - `GET /api/account/notification-prefs` → get preferences
  - `PATCH /api/account/notification-prefs` → update preferences
  - `DELETE /api/account` → delete account (cascade: revoke sessions/keys, anonymize social, keep trades)
- **D1 Migration Strategy:** Apply schema additions via `wrangler d1 execute hermes-launchpad-db --remote --file=workers/schema.sql` (canonical CREATE file — safe for fresh installs; for live DB, use `wrangler d1 execute --command="ALTER TABLE..."` for each new table)
- [ ] **1.7** **Rollback for Phase 1:** Drop `sessions`, `api_keys`, `notification_prefs` tables; remove route handlers from `worker.js`; delete account UI components; remove `/account` route from `App.tsx`

### Phase 2: Viral Hooks (Day 2)

- [ ] **2.1** Trade Receipt Share Card
- [ ] **2.2** Referral Banner (Persistent, TopNav)
- [ ] **2.3** Graduation Ceremony (polling-based)
- [ ] **2.4** Enhanced Ticker + Token Card Live Indicators
- [ ] **2.5** **Rollback for Phase 2:** Delete `TradeReceiptCard.tsx`, `GraduationModal.tsx`, `ReferralBanner.tsx`; remove viral hooks from `TokenModal.tsx`, `TopNav.tsx`, `TokenCard.tsx`, `Ticker.tsx`, `Home.tsx`

- **Trigger:** After `POST /api/trades/index` confirms (buy/sell)
- **Component:** `src/components/viral/TradeReceiptCard.tsx`
- **Content:** Token emoji + name, SOL amount, USD value, price impact, fee, your referral code, gradient background matching token emoji
- **Actions:** Native Share API → Twitter/X intent → copy link → save image
- **Confetti:** `confettiBurst('trade')` on receipt mount

#### 2.2 Referral Banner (Persistent, TopNav)
- **Location:** `TopNav.tsx` — right of wallet button
- **Content:** `"Invite friends → earn 10% of their fees forever"` + copy button + share icon
- **State:** Shows referral code; click → copies + toast `"Copied! Share your link"`

#### 2.3 Graduation Ceremony
- **Trigger:** Polling-based detection in `Home.tsx` token refresh cycle (every 30s) — when `token.complete === true` and `token.migrationReady === true` and not yet shown
- **Component:** `src/components/viral/GraduationModal.tsx` (full-screen, portal)
- **Sequence:** Confetti burst → gradient sweep → "GRADUATED TO RAYDIUM" → pool link → "Ape In" CTA → auto-close 8s
- **Sound:** Optional `audioCtx` chime (respects `prefers-reduced-motion`)
- **State tracking:** `localStorage.setItem('graduation_seen_<tokenId>', '1')` to prevent repeat shows

#### 2.4 Enhanced Ticker + Token Card Live Indicators
- **Ticker:** Add holder delta `+12 holders`, volume sparkline micro, color-coded buy/sell
- **TokenCard:** Green pulse ring on buy, red on sell; holder count live badge

### Phase 3: Professional Polish (Day 3)

- [ ] **3.1** Lighthouse PWA audit — target ≥90 (manifest, SW, offline, installability)
- [ ] **3.2** Accessibility audit — axe-core 0 violations AA:
  - Skip link (`#main-content`) in root layout (`src/App.tsx` or `src/index.html`)
  - Focus rings on all interactive (`:focus-visible` via Tailwind `focus-visible:ring-2 focus-visible:ring-pump`)
  - ARIA live region for ticker (`polite`) in `Ticker.tsx`
  - `prefers-reduced-motion` disables all `animate-*` (global CSS + GSAP config)
  - Touch targets ≥44px (audit `Button`, `TradeSheet`, `BottomTabBar`, `AccountTabs`)
  - `color-scheme: dark` in `src/index.css` on `:root`
- [ ] **3.3** Visual regression baseline — capture `Home`, `TokenModal`, `CreateTokenModal`, `Account` (Playwright)
- [ ] **3.4** Polish pass:
  - Consistent `gap-2` / `p-2.5` / `rounded-lg` density
  - Tabular nums on all metrics (`font-mono tabular-nums`)
  - Truncated wallet addresses `AbCd...1234` everywhere
  - Loading skeletons (shimmer) for all async sections
  - Error boundaries per route section
- [ ] **3.5** **Rollback for Phase 3:** Revert `vite.config.ts` PWA plugin, `manifest.webmanifest`, `service-worker.ts`, `main.tsx` SW registration; revert a11y CSS changes; restore original focus rings

### Phase 4: Retention Loops (Day 4)

- [ ] **4.1** Daily streak badge in feed header (shows 🔥 + count)
- [ ] **4.2** Quest progress micro-toast on trade ("Quest: First Trade ✅ +50 XP")
- [ ] **4.3** Leaderboard snippet in feed (top 3, expandable)
- [ ] **4.4** Push notification permission prompt (post-core, after first trade)
- [ ] **4.5** Re-engagement: "Token you liked just graduated" toast (Worker → DO → client)
- [ ] **4.6** **Rollback for Phase 4:** Remove streak badge from Home.tsx, remove quest toast logic, remove leaderboard snippet; revert push prompt stub

### Phase 5: Validation & Deploy (Day 5)

- [ ] **5.1** `npm run build` → exit 0
- [ ] **5.2** `npm run lint` → 0 errors
- [ ] **5.3** `npm run test` (vitest) → all pass
- [ ] **5.4** Playwright E2E:
  - Create token → buy → sell → verify receipt share card appears
  - Navigate to `/account` → all 6 tabs render → wallet disconnect works
  - Referral banner copies code → clipboard API success
  - Graduation ceremony triggers on mock migration event
  - Mobile viewport: bottom nav, trade sheet, account sheet all functional
- [ ] **5.5** Lighthouse CI: PWA ≥90, Performance ≥90, Accessibility ≥95
- [ ] **5.6** `git add -A && git commit -m "feat: viral polish + account page + demo purge" && git push origin main`
- [ ] **5.7** `wrangler pages deployment list` → confirm new deployment hash (Cloudflare Pages, not Vercel)

---

## Files Likely to Change

### New Files

| File | Purpose |
|------|---------|
| `src/pages/Account.tsx` | Account page route (lazy via React.lazy + Suspense) |
| `src/components/account/AccountTabs.tsx` | Tab navigation (mobile sheet / desktop sidebar) |
| `src/components/account/WalletManager.tsx` | Connected wallets, add/remove, primary |
| `src/components/account/SecurityPanel.tsx` | Sessions, signed-message auth, revoke |
| `src/components/account/NotificationPrefs.tsx` | Push/email/in-app toggles |
| `src/components/account/ApiKeys.tsx` | RPC config, read-only API keys |
| `src/components/account/ReferralAnalytics.tsx` | Code, clicks, signups, trades, XP, share |
| `src/components/account/DangerZone.tsx` | Delete account, data retention |
| `src/components/viral/TradeReceiptCard.tsx` | Post-trade share card with confetti |
| `src/components/viral/GraduationModal.tsx` | Full-screen graduation spectacle |
| `src/components/viral/ReferralBanner.tsx` | Persistent top-nav referral CTA |
| `src/hooks/useAccount.ts` | Account data fetching + mutations |
| `src/hooks/useViral.ts` | Share, confetti, graduation triggers |
| `public/manifest.webmanifest` | PWA icons, shortcuts, theme color |
| `src/service-worker.ts` | Offline shell, cache strategy (no mutable trade state) |

### Modified Files

| File | Change |
|------|--------|
| `src/pages/Home.tsx` | Add referral banner, streak badge, leaderboard snippet, quest toasts |
| `src/components/TopNav.tsx` | Integrate `ReferralBanner`, account link |
| `src/components/TokenCard.tsx` | Live buy/sell pulse, holder delta badge |
| `src/components/Ticker.tsx` | Holder delta, volume micro-sparkline |
| `src/components/TokenModal.tsx` | Trigger `TradeReceiptCard` on index confirmation |
| `src/components/CreateTokenModal.tsx` | Remove any demo copy |
| `src/pages/Profile.tsx` | Link to `/account` (supersedes some profile tabs) |
| `src/lib/api.ts` | New endpoints: `/api/sessions`, `/api/account/*` |
| `workers/worker.js` | Add route handlers for sessions, api-keys, notification-prefs, account delete |
| `workers/schema.sql` | Add `sessions`, `api_keys`, `notification_prefs` tables |
| `tailwind.config.js` | Verify design tokens, add viral gradients |
| `vite.config.ts` | PWA manifest config, SW registration |
| `src/index.css` | Focus rings, reduced-motion, skip link styles, color-scheme dark |

---

## Tests / Validation

| Test | Tool | Target |
|------|------|--------|
| Build | `npm run build` | Exit 0 |
| Lint | `npm run lint` | 0 errors, 0 warnings |
| TypeCheck | `tsc -b` | 0 errors |
| Unit | `vitest run` | All pass |
| E2E | Playwright | Create→buy→sell→share; Account tabs; Referral copy; Graduation |
| Lighthouse | CI/local | PWA ≥90, Perf ≥90, A11y ≥95 |
| Accessibility | axe-core | 0 AA violations |
| Visual Regression | browser-screenshot-diff | Key pages vs baseline |
| Source Truth | `grep -r fixture\|mock\|placeholder\|lorem\|fake src/ --include="*.tsx" | grep -v "provenance\|variant\|demo.*badge\|live.*false"` | Empty (excl. test files) |

---

## Risks, Tradeoffs, Open Questions

| Risk | Mitigation |
|------|------------|
| **Account page scope creep** | Hard 6-tab spec; danger zone last; ship MVP, iterate |
| **Viral features feel spammy** | User-controlled toggles (NotificationPrefs); referral banner dismissible |
| **Graduation ceremony performance** | Canvas-confetti lazy-loaded; respects reduced-motion; 8s auto-close |
| **Worker schema migration** | Additive only; D1 migrations via `wrangler d1 execute --file`; backup before |
| **PWA offline trade disable** | SW never caches `/api/trades/*` or `/api/tokens/index`; offline banner disables trade sheet |
| **Demo purge breaks tests** | Test fixtures stay in `tests/fixtures/`; production code uses `FIXTURES_ENABLED` flag |

| Open Question | Decision Needed |
|---------------|-----------------|
| Push notifications now or post-core? | Post-core (requires DO + VAPID); stub UI toggles now |
| Email notifications? | Future — skip for devnet |
| 2FA / passkeys? | Future — SecurityPanel shows "Coming Soon" |
| Token detail page (SEO) or modal only? | Modal for app; static `/token/:id` page for SEO (P2) |
| WebSocket real-time or polling? | P0 = verified REST polling; DO post-core (per existing plan) |

---

## modern-web-guidance Protocol Checklist

- [x] `npx -y modern-web-guidance@latest search "dark mode dashboard real-time data visualization"` → dark-mode guide (0.4669)
- [x] `npx -y modern-web-guidance@latest search "persistent app tours"` → persistent-app-tours (0.3437)
- [x] `npx -y modern-web-guidance@latest search "mobile trading app crypto dark mode"` → dark-mode, accessibility guides
- [ ] Apply `dark-mode`: true black, `color-scheme: dark`, `light-dark()` for inputs
- [ ] Apply `persistent-app-tours`: first-visit overlay (curve → AI → account → referral)
- [ ] Apply `accessibility`: skip link, focus rings, ARIA live ticker, reduced-motion
- [ ] Apply `css`: container queries for token density, CSS variables for tokens

---

## Success Metrics

| Metric | Baseline | Target |
|--------|----------|--------|
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

## Delivery Record (to fill during execution)

### Phase 0: Demo Purge
- [ ] 
- [ ] 

### Phase 1: Account Page
- [ ] 
- [ ] 

### Phase 2: Viral Hooks
- [ ] 
- [ ] 

### Phase 3: Professional Polish
- [ ] 
- [ ] 

### Phase 4: Retention Loops
- [ ] 
- [ ] 

### Phase 5: Validation & Deploy
- [ ] 
- [ ] 

---

## Plan Review Gate

**This plan is high-stakes (architecture + viral + account). Before execution:**

1. Load `plan-review-gate` skill
2. Spawn 3 reviewers: Architecture, UX/Site, Ops/Discovery
3. Integrate amendments
4. Save reviewed plan → then execute

---

*Next Step: User approves → run plan-review-gate → execute Phase 0 (Demo Purge) first.*