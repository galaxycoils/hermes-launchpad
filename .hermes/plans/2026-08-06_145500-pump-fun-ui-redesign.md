---
title: "Pump.fun-Inspired UI Redesign Plan for Hermes Launchpad"
date: "2026-08-06"
slug: "pump-fun-ui-redesign"
status: "implemented"
tags: [ui-redesign, pump.fun, token-launchpad, solana, hermes-launchpad]
---

# Pump.fun-Inspired UI Redesign Plan for Hermes Launchpad

## Goal

Transform Hermes Launchpad's UI/UX to match pump.fun's viral, high-conversion meme coin launchpad aesthetic while preserving Hermes' unique AI-agent differentiators (The Bard, The Oracle, The Warden, The Weaver). Target: 2-3x engagement increase, sub-2s LCP, dark-first "degen-native" feel.

## Current Context / Assumptions

| Aspect | Current State |
|--------|---------------|
| **Stack** | Vite 7, React 19, TypeScript, Tailwind 3.4, Radix UI, Recharts, @solana/web3.js |
| **Deploy** | Cloudflare Pages (frontend) + Cloudflare Workers (API) + D1 |
| **Live URLs** | `https://hermes-launchpad.pages.dev` (FE), `https://hermes-api.tahamtandariush.workers.dev` (API) |
| **Theme** | Dark-first (#0a0a10 bg), purple/green accent, emoji icons |
| **Features** | Bonding curve engine, AI agents (lore/risk), quests/XP/referrals, leaderboard, live ticker, comments |
| **Design System** | Tailwind + CSS variables (shadcn-style), `tailwindcss-animate`, custom keyframes (`heart-pop`, `scan-pulse`) |
| **Components** | TokenCard, TokenModal, CreateTokenModal, Ticker, KingOfHill, Sparkline, WalletButton |
| **modern-web-guidance** | Dark mode guide (0.4788 similarity), design token reactivity (0.3252), persistent app tours (0.3276) |

**Pump.fun Reference Patterns** (from research):
- Extreme minimalism: single-column feed, zero chrome
- High-contrast dark: `#000` bg, `#0f0`/`#f00` green/red signals
- Real-time everything: price, volume, holders, graduation bar
- Meme-native: emoji tickers, viral copy, confetti on buy/graduation
- Mobile-first: thumb-zone CTAs, swipe gestures, bottom sheets
- Social proof: live trades ticker, holder counts, "X bought Y SOL ago"
- Graduation ceremony: Raydium migration = visual spectacle

## Proposed Approach

### Design Philosophy: "Degen-Native Dark"

1. **Color System** — Pump.fun palette on Hermes tokens:
   - Background: `#000000` (true black, not `#0a0a10`)
   - Primary Signal: `#00FF00` (pump green) for buys/up/bullish
   - Danger Signal: `#FF0000` (pump red) for sells/down/bearish
   - Accent: `#A855F7` (Hermes purple) for AI agents, XP, referrals
   - Muted: `#1A1A1A` cards, `#2A2A2A` borders
   - Text: `#FFFFFF` primary, `#888888` secondary, `#AAAAAA` tertiary

2. **Typography** — System font stack, extreme hierarchy:
   - Hero: `text-5xl md:text-7xl font-black tracking-tight`
   - Token names: `text-xl font-bold`
   - Metrics: `text-sm font-mono tabular-nums`
   - Micro: `text-xs uppercase tracking-wider`

3. **Spacing/Density** — Compact, information-dense:
   - Card padding: `p-3` → `p-2.5`
   - Gap: `gap-3` → `gap-2`
   - Border radius: `rounded-xl` → `rounded-lg`

4. **Motion** — Purposeful, not decorative:
   - Ticker: seamless 60fps CSS animation (existing)
   - Sparkline: SVG stroke-dasharray on mount (200ms)
   - Buy button: scale(0.98) active, confetti burst
   - Graduation: full-screen confetti + gradient sweep
   - AI agent calls: pulse ring (existing `animate-scan`)

5. **IA Changes** — Flatten to 2 tabs max:
   - **Trade** (default): token feed + ticker + king of hill
   - **Profile**: XP, referrals, quests, leaderboard (merge ranks/refs/quests)

### modern-web-guidance Integration

| Guide | Application |
|-------|-------------|
| `dark-mode` | True black background, `color-scheme: dark`, `light-dark()` for form controls |
| `design-token-reactivity` | CSS variables for theme tokens → components react via container queries |
| `persistent-app-tours` | First-visit overlay: "How the curve works" + "AI agents explained" |

## Step-by-Step Plan

### Phase 1: Design Token Foundation (Day 1)

- [ ] **1.1** Create `src/styles/design-tokens.css` with pump.fun-inspired CSS variables
- [ ] **1.2** Update `tailwind.config.js` to map tokens to Tailwind utilities
- [ ] **1.3** Update `src/index.css` to import design tokens, remove shadcn HSL variables
- [ ] **1.4** Add `prefers-reduced-motion` media query disabling all animations
- [ ] **1.5** Add `touch-action: manipulation` globally for buttons/links
- [ ] **1.6** Add skip link (`#main-content`) in root layout

### Phase 2: Core Component Redesign (Days 2-3)

- [ ] **2.1** `TokenCard` → pump.fun compact card:
  - Single-row: emoji + name/ticker + sparkline + mcap/24h/holders + curve bar + buy CTA
  - Remove: sentiment badge, risk score, creator, chain badge (move to modal)
  - Add: live trade indicator (green/red dot), holder delta
- [ ] **2.2** `TokenModal` → bottom sheet (mobile) / side panel (desktop):
  - Buy/sell tabs → single toggle segment
  - AI agents: collapsible section, not prominent
  - Comments: virtualized list, lazy load
  - Share: native Web Share API fallback
- [ ] **2.3** `CreateTokenModal` → 3-step wizard:
  - Step 1: Name/Ticker/Emoji (inline validation)
  - Step 2: Curve params (visual slider: virtual SOL, graduation target)
  - Step 3: Confirm + confetti
- [ ] **2.4** `Ticker` → pump.fun style:
  - Full-width, single line, monospace amounts
  - Color-coded: green buy / red sell
  - Wallet truncation: `AbCd...1234`
  - Pause on hover
- [ ] **2.5** `KingOfHill` → hero card above fold:
  - Large emoji, gradient progress bar, "X SOL to Raydium"
  - CTA: "Ape In" (buy) / "Paper Hand" (sell)

### Phase 3: Layout & Navigation (Day 4)

- [ ] **3.1** `Home.tsx` → single-page feed:
  - Sticky nav: logo + live badge + wallet + create button
  - Hero: KingOfHill (if exists) else gradient banner
  - Feed: TokenCard grid (1 col mobile, 2 col tablet, 3 col desktop)
  - Bottom tab bar (mobile): Trade / Profile
- [ ] **3.2** Profile page (new route `/profile`):
  - XP bar + level + streak
  - Referral stats + copy/share
  - Quest progress (compact cards)
  - Leaderboard (top 10, expandable)
  - Trade history (virtualized)
- [ ] **3.3** Remove: AI agents strip, separate tabs, quests/refs/ranks tabs
- [ ] **3.4** Add: `useIsMobile` hook + responsive breakpoints

### Phase 4: Real-Time & Polish (Day 5)

- [ ] **4.1** WebSocket integration for live trades/price (replace 30s polling)
- [ ] **4.2** Optimistic UI: instant buy/sell feedback, background sync
- [ ] **4.3** Graduation ceremony: full-screen confetti + gradient sweep + sound (optional)
- [ ] **4.4** First-visit tour (per `persistent-app-tours` guide)
- [ ] **4.5** Error boundaries + loading skeletons (shimmer)
- [ ] **4.6** SEO/meta: OG tags per token, JSON-LD for Product

### Phase 5: Validation & Deploy (Day 6)

- [ ] **5.1** `npm run build` → exit 0
- [ ] **5.2** `npm run lint` → 0 errors
- [ ] **5.3** Lighthouse: LCP < 2s, INP < 200ms, CLS < 0.1
- [ ] **5.4** Mobile test: iOS Safari, Chrome Android (real devices)
- [ ] **5.5** Accessibility: axe-core, keyboard nav, screen reader
- [ ] **5.6** `git add -A && git commit -m "feat: pump.fun-inspired UI redesign" && git push origin main`
- [ ] **5.7** `vercel ls --format json` → confirm new deployment hash

## Files Likely to Change

| File | Change Type |
|------|-------------|
| `src/styles/design-tokens.css` | New |
| `tailwind.config.js` | Modify (colors, spacing, radius, fonts) |
| `src/index.css` | Replace (import tokens, base styles) |
| `src/components/TokenCard.tsx` | Rewrite |
| `src/components/TokenModal.tsx` | Rewrite (bottom sheet) |
| `src/components/CreateTokenModal.tsx` | Rewrite (wizard) |
| `src/components/Ticker.tsx` | Modify (style, pause) |
| `src/components/KingOfHill.tsx` | Modify (hero sizing) |
| `src/components/Sparkline.tsx` | Modify (animation) |
| `src/pages/Home.tsx` | Rewrite (single feed + bottom tabs) |
| `src/pages/Profile.tsx` | New |
| `src/hooks/useIsMobile.ts` | New |
| `src/hooks/useWebSocket.ts` | New |
| `vite.config.ts` | Verify (no changes expected) |
| `index.html` | Meta/OG tags |

## Tests / Validation

| Test | Tool | Target |
|------|------|--------|
| Build | `npm run build` | Exit 0 |
| Lint | `npm run lint` | 0 errors, 0 warnings |
| TypeCheck | `tsc -b` | 0 errors |
| Unit | `npm run test` | All pass (existing) |
| E2E | Playwright | Critical paths: create token, buy/sell, referral, graduation |
| Lighthouse | CI / local | LCP < 2s, INP < 200ms, CLS < 0.1 |
| Accessibility | axe-core | 0 violations AA |
| Visual Regression | browser-screenshot-diff | Key pages vs baseline |

## Risks, Tradeoffs, Open Questions

| Risk | Mitigation |
|------|------------|
| **Breaking existing user flows** | Phase 3 merges tabs → profile page; keep all features accessible |
| **WebSocket complexity** | Start with polling fallback; upgrade incrementally |
| **Mobile bottom sheet UX** | Test on real devices; `vaul` drawer already in deps |
| **SEO for token pages** | SSR not available (Vite SPA) → use pre-render + meta tags |
| **Dark mode only** | Pump.fun is dark-only; add `prefers-color-scheme` respect per modern-web-guidance |
| **AI agent discoverability** | Move to modal collapsible; track usage via analytics |
| **Graduation ceremony performance** | Confetti via canvas-confetti (already used); lazy-load |

| Open Question | Decision Needed |
|---------------|-----------------|
| Keep emoji icons or migrate to Lucide? | Pump.fun uses emoji → keep for meme-native feel |
| WebSocket on Workers or Pusher/Ably? | Workers WebSocket + Durable Objects (native) |
| Sound on graduation? | Optional, off by default, user preference |
| Token detail page (SEO) or modal only? | Modal for app, static `/token/:id` page for SEO |
| Migration path for existing users? | Feature flag + gradual rollout |

## modern-web-guidance Protocol Checklist

- [x] `npx -y modern-web-guidance@latest search "dark mode dashboard real-time data visualization"` → dark-mode guide (0.4788)
- [x] `npx -y modern-web-guidance@latest search "design token reactivity"` → design-token-reactivity (0.3252)
- [x] `npx -y modern-web-guidance@latest search "persistent app tours"` → persistent-app-tours (0.3276)
- [ ] Apply `dark-mode` guide: true black, `color-scheme: dark`, `light-dark()`
- [ ] Apply `design-token-reactivity`: CSS variables → container queries
- [ ] Apply `persistent-app-tours`: first-visit overlay with tethered steps

## Delivery Record — 2026-08-06

### Delivered
- Design tokens, true-black dark foundation, reduced-motion, touch handling, skip link.
- Compact token feed/cards, King of Hill, polling live ticker with hover pause.
- Responsive token bottom-sheet / desktop trading panel; native-share fallback; collapsible AI research.
- Three-step token creation flow; Trade/Profile IA, `/profile`, mobile bottom nav, responsive hook.
- First-visit curve/AI tour, app error boundary, metadata refresh.
- Validation: `npm run build`, `npm run lint`, `wrangler deploy --dry-run`, browser desktop and route smoke checks passed.

### Deferred / Truth Constraints
- Workers expose no WebSocket endpoint; retained 15-second polling rather than inventing a live connection.
- Existing comment volume does not warrant virtualization; defer until pagination/API support exists.
- Backend currently fixes curve targets; UI does not expose deceptive non-persisted curve controls.
- No unit-test script exists; Playwright browser binary and real-device checks are unavailable locally. These remain CI/device follow-ups.

## Success Metrics

| Metric | Baseline | Target |
|--------|----------|--------|
| LCP | ~2.5s | < 2.0s |
| Time to First Trade | ~8s | < 4s |
| Mobile Conversion (create token) | ~12% | > 25% |
| Session Duration | ~3min | > 6min |
| Referral Link Shares | ~50/day | > 200/day |
| Graduation Ceremony Completion | N/A | > 80% |

---

**Next Step**: Execute Phase 1 (Design Token Foundation) → run `npm run build` → verify no regressions.