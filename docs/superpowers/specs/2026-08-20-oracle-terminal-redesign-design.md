# The Oracle Terminal — Complete Frontend Redesign

**Date:** 2026-08-20
**Status:** Draft — Pending Review
**Scope:** Full frontend redesign of Hermes Launchpad
**Stack:** Vite + React 19 + TypeScript + Tailwind CSS 3 + GSAP + Web Audio API

---

## 1. Vision

Transform Hermes Launchpad from a functional dark-mode launchpad into an **AI-powered oracle trading experience** — a unified loop of discovery, AI signals, trading, and gamification feedback that is more addictive and more distinctive than pump.fun.

**Core loop:** See token → Oracle risk pulse catches your eye → Tap → Full-screen trade view with chart + AI lore + social + instant trade → Complete trade → XP animation + confetti → Sound cue → Back to feed with updated leaderboard position.

**Differentiator:** pump.fun evolved into a pro-grade trading terminal. Hermes is the **mystical AI oracle alternative** — where The Bard writes lore, The Oracle scores risk, and every trade earns XP in a gamified progression system. The AI isn't bolted on — it's ambient, always present, breathing through the UI.

**Primary device:** Mobile-first. Thumb-zone ergonomics. Desktop is the adaptation.

**Navigation pattern:** Feed + modal drill-down. Scrollable feed of tokens, tap to open full-screen trade modal.

---

## 2. Design System

### 2.1 Palette

| Role | Name | Value | Usage |
|------|------|-------|-------|
| Base | Void | `#06060e` | Primary background. Deep indigo undertone for dimensional gradients. |
| Surface | Obsidian | `#0d0d1a` | Cards, panels, elevated surfaces. Distinguishable from void under glass. |
| Signal: Up | Pulse | `#00ff66` | Buy, positive change, success. Crypto muscle memory. |
| Signal: Down | Bleed | `#ff3344` | Sell, negative change, danger. |
| AI Accent | Iris | `#7c6aff` → `#00e5ff` | **Signature gradient.** Shifting violet-to-cyan iridescent for AI intelligence. Oracle signals, ambient pulse, accent borders. |
| Reward | Sol | `#ffb800` | XP, achievements, streaks, gold rewards. |

Supporting neutrals: `white/90`, `white/60`, `white/30`, `white/10`, `white/5`.

### 2.2 Typography

| Role | Typeface | Weight | Usage |
|------|----------|--------|-------|
| Display | Space Grotesk | 700–900 | Headlines, prices, token names. Geometric, technical, distinctive. |
| Body | Inter | 400–600 | Body text, descriptions, UI labels. |
| Data/Mono | JetBrains Mono | 500–700 | Prices, addresses, stats. Tabular nums. |
| Lore | Instrument Serif | 400 italic | AI-generated lore only. Serif contrast = "oracle speaking." |

### 2.3 Type Scale (mobile-first)

| Token | Size | Rem |
|-------|------|-----|
| xs | 11px | 0.6875rem |
| sm | 13px | 0.8125rem |
| base | 15px | 0.9375rem |
| lg | 18px | 1.125rem |
| xl | 24px | 1.5rem |
| 2xl | 32px | 2rem |
| 3xl | 48px | 3rem |

### 2.4 Spacing & Radius

- Spacing: Tailwind default (4px base)
- Card radius: `16px` (rounded-2xl)
- Button radius: `12px` (rounded-xl)
- Pill/badge radius: `9999px` (rounded-full)
- Glass effect: `backdrop-blur-xl bg-obsidian/60 border border-white/[0.06]`

### 2.5 The Oracle Pulse (Signature Animation)

A CSS `@property` animated gradient angle applied globally:

```css
@property --iris-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: true;
}

:root {
  animation: iris-rotate 8s linear infinite;
}

@keyframes iris-rotate {
  to { --iris-angle: 360deg; }
}

.iris-gradient {
  background: conic-gradient(
    from var(--iris-angle),
    #7c6aff, #00e5ff, #7c6aff
  );
}
```

Applied to: top 3px bar, token card hover borders, Oracle score arc, BUY button hover glow, active bottom nav indicator, progress bar fill, trade modal header border.

Reduced motion: `--iris-angle` set to static `180deg`.

---

## 3. Layout Architecture

### 3.1 Page Map

```
/           → Feed (discovery + trading entry point)
/trade      → Trade modal deep-link (token param)
/profile    → Profile + gamification (own route, not a tab)
/account    → Wallet management
```

### 3.2 Mobile Layout (primary)

```
┌─────────────────────────────┐
│ ░░░░ ORACLE PULSE BAR ░░░░ │  3px gradient bar, always breathing
├─────────────────────────────┤
│ 🛸 HERMES    ● Live   [👤] │  Top bar: 48px, glass blur, minimal
├─────────────────────────────┤
│ ┌─ KOH Strip ─────────────┐│  64px compact: emoji+name+price+change
│ └──────────────────────────┘│  Tap → opens KOH in trade modal
│                             │
│ ◄ SMOKE +12% │ HNQ -3% │ ► │  Live ticker: horizontal auto-scroll
│─────────────────────────────│
│ [All] [Rising] [New] [🔍]  │  Filter pills + search toggle
│                             │  Note: Rising/New are stretch filters.
│                             │  MVP ships with existing: All, Curve, Ready.
│                             │
│ ┌──────────┐ ┌──────────┐  │  Token cards: 2-column grid
│ │ 🐉 SMOKE │ │ 💎 HNQ   │  │  Compact, dense, sparkline+oracle ring
│ │ ██████░░ │ │ ████░░░░ │  │
│ │ 2.1 SOL  │ │ 0.8 SOL  │  │
│ └──────────┘ └──────────┘  │
│         ... scroll ...      │
├─────────────────────────────┤
│  📡 Feed    ＋Create   👤   │  Bottom nav: 3 items, 56px
└─────────────────────────────┘
```

### 3.3 Desktop Adaptation (md+ breakpoint)

- Feed becomes 3-column grid
- KOH strip expands to show sparkline + stats inline
- Top bar gets balance, streak badge, network indicator
- Trade modal: centered 640px-wide card with backdrop-blur overlay
- Bottom nav hidden; navigation via top bar

### 3.4 Key Changes from Current Layout

| Current | Redesigned | Rationale |
|---------|-----------|-----------|
| Large Hero section (title + subtitle + 2 CTAs) | Removed. KOH strip is the hero. | Users don't need marketing copy every visit. The feed IS the pitch. |
| KingOfHill2 (400px+ banner) | 64px compact strip | Mobile screen real estate is sacred. |
| Leaderboard snippet on home | Moved to Profile. Rank badge `🏆#4` in top nav. | One rank badge creates more FOMO than a snippet. |
| PriceChart + InstantTradePanel on home | Moved to trade modal | Feed = discovery. Trading = focused modal. |
| LiveTradeFeed + SocialFeed stacked below | 40px horizontal ticker | Vertical stacking = scroll fatigue. Ticker = constant motion, no scroll cost. |
| Two bottom bars (BottomTabBar + BottomNav) | Single 3-item bottom nav | Two navs is confusing. |
| Tab switching (tokens/profile) on home | Eliminated. Profile is own route. | Dedicated routes = cleaner mental model. |

---

## 4. Component Design

### 4.1 Token Card

The feed unit. Optimized for scanning density.

**Layout:**
```
┌──────────────────────────┐
│ ┌──┐  SMOKE  $SMOKE      │  Row 1: Identity
│ │🐉│  by 3x8f…a2c1       │  Emoji with Oracle risk ring
│ │◉ │                     │  (ring color = risk level)
│ └──┘         ▲ +12.3%    │  Change badge, right-aligned
│                          │
│  ▁▂▃▅▆▇▆▅▃▂▁▂▃▅▇        │  Row 2: Sparkline (32px, edge-to-edge)
│                          │  Color = change direction
│  2.1 SOL    ███████░░░   │  Row 3: Raised amount + progress bar
│             24.7%        │  Progress % right-aligned
└──────────────────────────┘
```

**Oracle Ring:** 3px ring around emoji. Color mapped:
- Pulse green: risk < 30 (low)
- Sol amber: risk 30–70 (medium)
- Bleed red: risk > 70 (high)
- Iris gradient rotation on hover

**Sparkline:** 32px tall, gradient fill underneath. No axes, no labels.

**Progress bar:** 4px tall, iris gradient fill. Glows when > 75%.

**Card surface:** `bg-obsidian/60 backdrop-blur-sm border border-white/[0.04]`. Hover: `border-iris/30`. Press: `scale-[0.98]`.

**Removed from current:** Lore preview (moved to modal), Badge component (replaced by Oracle ring), migration-ready callout (now ✨ overlay on emoji).

### 4.2 Top Nav (48px)

```
🛸 HERMES·    ● Live     🏆#4    [4x…c1]
```

- Left: Logo (🛸 + "HERMES" Space Grotesk 700 + iris dot that pulses)
- Center-left: Live indicator
- Center-right: Rank badge (tap → /profile leaderboard)
- Right: Wallet pill (truncated address or "Connect")
- Desktop additions: SOL balance, streak badge, devnet indicator

### 4.3 Bottom Nav (56px, mobile only)

Three items: Feed (📡), Create (＋), Profile (👤).

- Glass surface: `bg-void/80 backdrop-blur-xl border-t border-white/[0.06]`
- Active indicator: 3px iris gradient line above active icon
- Create icon slightly larger (28px vs 20px), always iris colored
- Profile shows notification dot when rewards unclaimed

### 4.4 KOH Strip (64px)

Single-row compact banner:
```
👑  🐉 SMOKE  $0.00042  ▲+12%  ▁▂▃▅▇  24.7%
```

- Gold `sol` left border (4px)
- Background: `bg-sol/[0.03]`
- Crown animates with slow float
- Tap anywhere → opens token in trade modal
- Hidden when no king (no empty state)

### 4.5 Live Ticker (40px)

Horizontal auto-scrolling trade feed:
```
◄ 🐉 SMOKE bought 0.5 SOL │ 💎 HNQ sold 0.2 SOL ►
```

- CSS marquee animation (not JS)
- Buy = pulse green, Sell = bleed red
- Pauses on hover/tap-hold
- Updates by prepending new trades

### 4.6 Trade Modal

Full-screen vaul drawer (mobile) or centered 640px overlay (desktop).

**Sections top-to-bottom:**

1. **Header:** Back button, token identity (emoji + name + ticker)
2. **Price chart:** Lightweight-charts, 200px height
3. **Price display:** Live price (Space Grotesk 700, 2xl) + change badge
4. **Bonding curve:** Inline progress — `2.1 / 85 SOL ████████░░ 24.7%`
5. **Oracle Signal Panel:**
   - Circular arc score (SVG, iris gradient stroke)
   - Risk level: LOW/MEDIUM/HIGH with color
   - Analysis text (Inter 400, white/60)
   - 3px iris left border
6. **Trade Panel:**
   - BUY/SELL tab toggle (active = iris underline)
   - Amount input with quick-amount pills (0.1, 0.5, 1.0, MAX)
   - Sell: percentage pills (25%, 50%, 100%)
   - Real-time estimate: tokens received, price impact, fee
   - Full-width execute button (56px tall)
   - BUY: `bg-pulse text-void font-black`
   - SELL: `bg-bleed/10 border-2 border-bleed text-bleed`
7. **Content tabs:** Chart | Lore | Chat | Info
8. **Bard Lore:** Instrument Serif italic, collapsible, iris/5 background
9. **Comments:** Chat thread, submit input

---

## 5. Motion & Sensory Layer

### 5.1 GSAP Orchestration

**Feed page load (800ms total):**
```
t=0.0s  Oracle Pulse bar fades in (opacity, 300ms)
t=0.1s  Top nav slides down (y: -10→0, 200ms)
t=0.2s  KOH strip slides in from left (x: -20→0, 300ms)
t=0.3s  Ticker starts scrolling
t=0.4s  Token cards stagger in (y: 16→0, stagger 60ms, 300ms each)
t=0.6s  Bottom nav slides up (y: 10→0, 200ms)
```

**Trade modal open:**
```
t=0.0s  Backdrop dims (opacity 0→0.6, 200ms)
t=0.0s  Drawer slides up (vaul native)
t=0.2s  Price header fades in (200ms)
t=0.3s  Chart reveals (clip-path wipe, 400ms)
t=0.4s  Oracle panel slides in (x: -10→0, 300ms)
t=0.5s  Trade panel fades in (200ms)
t=0.6s  Tab bar appears (150ms)
```

**Scroll entrance (IntersectionObserver):**
- Cards: `opacity: 0→1, y: 12→0, 250ms, ease: power2.out`
- Stagger: 40ms between row siblings
- Fires once per card

**Data update pulse:**
- Price change: `scale(1.03)→scale(1)` over 200ms + color flash
- Debounced: max once per 2 seconds per element

**Reduced motion:** All GSAP timelines check `gsap.matchMedia()` with `(prefers-reduced-motion: reduce)` and set `clearProps: 'all'`.

### 5.2 Sound System

Web Audio API singleton `SoundManager`:

```typescript
const SOUNDS = {
  trade:    'trade.mp3',      // 0.3s cha-ching
  levelUp:  'level-up.mp3',   // 0.8s ascending chime
  quest:    'quest.mp3',      // 0.4s achievement tone
  streak:   'streak.mp3',     // 0.2s whoosh
  king:     'king.mp3',       // 0.5s fanfare
  click:    'click.mp3',      // 0.05s subtle tap
};
```

- User opt-in: `localStorage 'hermes-sound'`, default `'on'`
- No autoplay on page load
- Master volume: 0.3 (30%)
- Max 3 concurrent sounds
- AudioContext suspended when tab not visible
- Total budget: < 60KB (all MP3s combined)

**Asset sourcing:** Generate 6 short sound effects using a free SFX library (e.g., freesound.org, mixkit.co) or synthesize via Web Audio API oscillators at build time. No licensed assets required.

### 5.3 Haptic Feedback

`navigator.vibrate()` with style presets:

| Trigger | Pattern |
|---------|---------|
| Token card tap | `[10]` light |
| BUY/SELL press | `[20]` medium |
| Trade confirmed | `[30, 10, 30]` heavy double-pulse |
| Quick-amount pill tap | `[10]` light |
| Bottom nav switch | `[10]` light |

### 5.4 Confetti Presets

Using existing `canvas-confetti`:

| Event | Particles | Colors | Origin |
|-------|-----------|--------|--------|
| Trade complete | 30, spread 50 | pulse, iris-start, iris-end | y: 0.8 (button area) |
| Level up | 100, spread 160 | sol, iris-start, iris-end, pulse | y: 0.3 (center) |
| Graduation | 200, spread 180, star shapes | sol, gold, white | y: 0.5 |

### 5.5 XP Fly-Up Animation

GSAP motion path:
- Start: trigger point (trade button `getBoundingClientRect`)
- End: top nav rank badge
- Path: cubic bezier arc
- Scale: 1 → 0.6
- Opacity: 1 → 0 at end
- Duration: 800ms
- On arrival: rank badge bounces `scale(1.2)→scale(1)`

### 5.6 Skeleton Loading

Shimmer in iris gradient colors (violet→cyan) instead of grey.
Each card skeleton staggers shimmer by 100ms for wave effect across grid.

---

## 6. Files Changed

### New Files

| File | Purpose |
|------|---------|
| `src/styles/oracle-pulse.css` | `@property` animation, iris-gradient class, reduced-motion |
| `src/lib/sound.ts` | SoundManager singleton (Web Audio API) |
| `src/lib/haptic.ts` | Haptic feedback utility |
| `src/lib/confetti-presets.ts` | Confetti configuration presets |
| `src/components/OracleRing.tsx` | SVG risk ring with iris gradient |
| `src/components/OracleSignal.tsx` | Full Oracle panel (score + analysis) |
| `src/components/Sparkline.tsx` | Extracted from KingOfHill2, reusable |
| `src/components/IrisBorder.tsx` | Reusable iris-gradient border wrapper |
| `src/components/XPFlyUp.tsx` | XP gain animation component |
| `src/components/LiveTicker.tsx` | Horizontal auto-scrolling trade ticker |
| `src/components/TradeModalContent.tsx` | Refactored trade modal internals |
| `src/components/FilterBar.tsx` | Filter pills + search toggle |
| `src/hooks/useSoundEffect.ts` | Hook wrapping SoundManager |
| `src/hooks/useHaptic.ts` | Hook wrapping haptic utility |
| `public/sounds/*.mp3` | 6 sound files (< 60KB total) |

### Modified Files

| File | Changes |
|------|---------|
| `tailwind.config.js` | New colors (void, obsidian, pulse, bleed, iris, sol), fontFamily (Space Grotesk, JetBrains Mono, Instrument Serif), keyframes |
| `src/index.css` | Import oracle-pulse.css, font-face declarations, base styles |
| `index.html` | Google Fonts preconnect + link tags for new typefaces |
| `src/App.tsx` | Add /profile route, remove /profile redirect |
| `src/pages/Home.tsx` | Complete rewrite — feed-only layout, remove hero/leaderboard/chart/trade panel/social feed, add KOH strip + ticker + 2-col card grid |
| `src/pages/Trade.tsx` | Refactored to use new TradeModalContent |
| `src/components/TokenCard.tsx` | Complete rewrite — new compact layout with oracle ring + sparkline + progress |
| `src/components/TopNav.tsx` | Simplified to 48px bar with rank badge |
| `src/components/BottomNav.tsx` | Rewritten as 3-item nav (Feed/Create/Profile) |
| `src/components/TokenModal.tsx` | Refactored to use TradeModalContent, add GSAP entrance |
| `src/components/Hero.tsx` | Deleted (replaced by KOH strip) |
| `src/components/KingOfHill.tsx` | Deleted (merged into KOH strip) |
| `src/components/KingOfHill2.tsx` | Deleted (replaced by compact KOH strip) |
| `src/components/LiveTradeFeed.tsx` | Deleted (replaced by LiveTicker) |
| `src/components/SocialFeed.tsx` | Moved to Profile page only |
| `src/components/BottomTabBar.tsx` | Deleted (merged into new BottomNav) |
| `src/components/InstantTradePanel.tsx` | Moved inside TradeModalContent |
| `src/components/PriceChart.tsx` | Moved inside TradeModalContent |
| `src/components/Skeleton.tsx` | Updated with iris shimmer |
| `src/components/ConfettiBurst.tsx` | Updated with preset system |
| `src/components/GraduationModal.tsx` | Updated with graduation confetti preset + sound |
| `src/components/CreateTokenModal.tsx` | Visual refresh with new design system |
| `src/components/TraderProfile.tsx` | Visual refresh |
| `src/components/AchievementBadges.tsx` | Visual refresh |
| `src/components/StreakCounter.tsx` | Visual refresh + sound trigger |
| `src/components/QuestCard.tsx` | Visual refresh + sound trigger |

### Deleted Files

| File | Reason |
|------|--------|
| `src/components/Hero.tsx` | Replaced by KOH strip |
| `src/components/KingOfHill.tsx` | Merged into compact KOH strip |
| `src/components/KingOfHill2.tsx` | Merged into compact KOH strip |
| `src/components/LiveTradeFeed.tsx` | Replaced by LiveTicker |
| `src/components/BottomTabBar.tsx` | Merged into new BottomNav |
| `src/components/Ticker.tsx` | Replaced by LiveTicker |

---

## 7. Performance Budget

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.2s |
| Largest Contentful Paint | < 2.0s |
| Motion JS overhead | < 40KB gzip (GSAP core ~24KB) |
| Sound assets | < 60KB total |
| CSS animations | Compositor-only (transform, opacity) |
| `content-visibility: auto` | All below-fold token cards |
| `will-change` | Applied only during animation, removed after |

---

## 8. Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Visual distinction from pump.fun | Side-by-side comparison — no one confuses the two |
| AI integration feels ambient, not bolted on | Oracle ring visible on every card; pulse bar always present |
| Mobile-first ergonomics | All primary actions reachable in thumb zone |
| Feed scanning speed | User can assess 6+ tokens without scrolling |
| Trade completion speed | Token tap → trade confirmed in < 5 taps |
| Sensory feedback completeness | Every user action has visual + optional audio + optional haptic response |
| Accessibility | `prefers-reduced-motion` respected; skip links; ARIA labels; keyboard navigation |
| Performance | LCP < 2.0s on 4G throttled connection |

---

## 9. Implementation Phases

### Phase 1: Foundation (design system + layout skeleton)
- Tailwind config update (colors, fonts, keyframes)
- Oracle Pulse CSS
- Font loading (Google Fonts)
- New base layout (top nav, bottom nav, feed grid shell)
- Remove Hero, consolidate bottom bars

### Phase 2: Core Components (feed + cards)
- Token Card rewrite (oracle ring, sparkline, progress)
- KOH compact strip
- Live Ticker
- Filter bar
- Skeleton loading with iris shimmer

### Phase 3: Trade Modal (the drill-down experience)
- TradeModalContent component
- Oracle Signal panel
- Trade panel (BUY/SELL with quick-amount pills)
- Bard Lore section
- Chart + comments integration

### Phase 4: Motion & Sensory (the addictive layer)
- GSAP page load orchestration
- Trade modal entrance sequence
- Scroll-triggered card entrances
- Data update pulses
- Sound system + haptic utility
- Confetti presets
- XP fly-up animation

### Phase 5: Profile & Gamification Refresh
- Profile page (own route)
- Leaderboard, quests, achievements, streaks — visual refresh
- Sound triggers on quest complete, level up, streak
- Referral section visual refresh

### Phase 6: Polish & Performance
- Performance audit (LCP, bundle size)
- Accessibility audit (a11y)
- Sound preference toggle in settings
- Cross-browser testing (Safari, Chrome, Firefox)
- Mobile device testing (iOS Safari, Android Chrome)
