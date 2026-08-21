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

> **See Section 17** for the complete, updated file manifest (revised after Design Review Gate Round 1).

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
- Sound preference toggle in TopNav (1-tap mute icon)
- Cross-browser testing (Safari, Chrome, Firefox)
- Mobile device testing (iOS Safari, Android Chrome)
- CSS `@property` fallback verification
- 320px viewport (iPhone SE) ergonomics pass

---

## 10. User Personas & Use Cases

### 10.1 Personas

| Persona | Description | Primary Needs |
|---------|-------------|---------------|
| **Degen Sniper** | High-frequency mobile trader scanning for breakout momentum. Speed > everything. | Instant visual risk scoring, zero-latency prices, 1-tap quick buy, minimal friction |
| **Lore Explorer** | Drawn to viral narratives, AI lore, community gamification. Engagement-motivated. | Prominent Bard Lore, celebration feedback (XP, confetti, sound), clear leaderboard status |
| **Token Creator** | Launches tokens, drives traffic from Twitter/Telegram to their bonding curve. | Deep-linkable trade route, clear graduation progress, King of the Hill visibility |
| **Casual Mobile Trader** | Occasional trader, browses on phone, trades small amounts. Low crypto literacy. | Simple UI, clear risk signals, easy wallet connect, no overwhelming data density |

### 10.2 Structured Use Cases

**UC-01: Rapid Feed Discovery & Risk Filtering**
> AS A Degen Sniper, I WANT TO scan tokens in a 2-column mobile feed with colored Oracle risk rings SO THAT I can spot low-risk momentum tokens in under 3 seconds WHEN scrolling the live market feed.

**UC-02: Frictionless Modal Trade Execution**
> AS A Mobile Trader, I WANT TO tap a token card, see price impact, select a quick SOL amount, and execute a buy within a single drawer SO THAT I can enter a position with < 5 taps WHEN momentum is spiking.

**UC-03: Gamified Reward Feedback Loop**
> AS A Lore Explorer, I WANT TO receive multi-sensory feedback (XP fly-up, audio cue, confetti) upon trade confirmation SO THAT I feel rewarded and motivated to climb the leaderboard WHEN completing any trade.

**UC-04: Deep-Link Token Sharing**
> AS A Token Creator, I WANT TO share a direct link (`/trade?token=XYZ`) that opens the trade modal with Bard lore and live chart SO THAT my community lands directly in the purchase funnel WHEN clicking links from social channels.

### 10.3 Edge Cases & Error Handling

| Scenario | User Impact | Required UX |
|----------|-------------|-------------|
| Solana transaction revert / slippage exceeded | Trade fails on-chain after user confirms | Inline error banner in TradeModalContent with retry CTA and slippage adjuster. Error haptic. No confetti/XP. |
| Wallet disconnects during trade | BUY tapped without active wallet session | Wallet connection modal overlays immediately. Trade amount state preserved. |
| Oracle / Bard service timeout or 500 | AI data unavailable for token | Oracle ring: neutral iris shimmer (indeterminate). Panel: "Oracle calculating…" shimmer placeholder. Never breaks layout. |
| Newly minted token — no AI data yet | Oracle has not scored this token | Oracle ring: gray neutral ring. Score: "—". Text: "Awaiting Oracle analysis." Lore: "The Bard has not yet spoken." |
| Mobile audio autoplay blocked | Sound trigger fails silently | SoundManager ignores; no error thrown. Audio unlocks on next user gesture. |
| iOS Safari — no `navigator.vibrate` | Haptic call on unsupported platform | Silent no-op via feature detection. Never throws. |
| 0 tokens in feed (empty state) | No tokens match filter or API down | Centered illustration + "No tokens yet. Launch the first one." + Create CTA button. |
| External wallet prompt interrupts modal | Phantom/Solflare approval popup | Trade modal stays open underneath. On return, state resumes. Amount not cleared. |

---

## 11. Data Contract Updates

### 11.1 Token Interface Extension (`src/lib/tokens.ts`)

```typescript
// New fields added to Token interface
interface Token {
  // ... existing fields ...
  riskScore?: number;        // 0-100, from Oracle. undefined = not yet scored
  sparkline?: number[];      // Last ~24 price points (USD or SOL). Empty = no data
  change24h?: number;        // Percentage change, can be negative. undefined = no data
}
```

### 11.2 Bulk Feed Endpoint Update (`GET /api/tokens`)

The Worker must return `riskScore`, `sparkline`, and `change24h` in the bulk token response. These are computed/cached server-side:

- `riskScore`: Cached from last Oracle evaluation. `null` if not yet evaluated.
- `sparkline`: Last 24 indexed trade prices. Computed from `trades` table. Empty array if < 2 trades.
- `change24h`: Computed from earliest and latest trade prices within 24h window. `null` if < 2 trades in window.

**No per-card fetch requests.** All data comes in the bulk payload.

### 11.3 Provenance & Truth Invariant (WU-05 Compliance)

The redesigned TokenCard **must** surface provenance state visually and testably:

| State | Current Badge | New Design | Test Assertion |
|-------|---------------|------------|----------------|
| Demo | `<Badge variant="demo">` | Overlay text "DEMO" on card, white/30 opacity, mono 10px. Replaces oracle ring with gray dashed ring. | `getByText('DEMO')` or `getByTestId('provenance-demo')` |
| On-chain | `<Badge variant="onchain">` | Green dot indicator next to creator address + "on-chain" text (existing pattern, kept). | `getByText('on-chain')` or `getByTestId('provenance-onchain')` |
| Migration-ready | `<Badge variant="migration-ready">` | ✨ sparkle overlay on emoji + "Migration ready" text below progress bar | `getByText('Migration ready')` or `getByTestId('provenance-migration')` |

All three states remain testable via `data-testid` attributes.

---

## 12. Platform Compatibility

### 12.1 Web Audio Gesture Unlock

```typescript
// SoundManager initialization strategy
class SoundManager {
  private ctx: AudioContext | null = null;
  private unlocked = false;
  
  // Called lazily — NOT on module load
  private ensureContext(): AudioContext | null {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }
  
  // Must be called from a direct user gesture handler (click/pointerdown)
  unlock(): void {
    if (this.unlocked) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    // Play silent buffer to fully unlock on iOS
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    this.unlocked = true;
  }
  
  // Tab visibility lifecycle
  handleVisibility(): void {
    if (document.hidden) {
      this.ctx?.suspend();
    } else if (this.unlocked) {
      this.ctx?.resume();
    }
  }
}

// Unlock triggered by first user interaction:
// document.addEventListener('pointerdown', () => soundManager.unlock(), { once: true });
```

**Default sound preference: OFF.** User opts in via a toggle in the Trade Modal or TopNav sound icon (`🔊`/`🔇`). Stored in `localStorage('hermes-sound')`.

### 12.2 Haptic Feedback — iOS Fallback

```typescript
function haptic(style: 'light' | 'medium' | 'heavy'): void {
  if (!('vibrate' in navigator)) return;  // Silent no-op on iOS Safari
  try {
    const patterns = { light: [10], medium: [20], heavy: [30, 10, 30] };
    navigator.vibrate(patterns[style]);
  } catch {
    // Silent fallback — never throws
  }
}
```

### 12.3 CSS `@property` Fallback

```css
/* oracle-pulse.css */

/* Fallback for browsers without @property support */
.iris-gradient {
  background: linear-gradient(135deg, #7c6aff, #00e5ff, #7c6aff);
}

/* Enhanced version for supporting browsers */
@supports (background: paint(worklet)) {
  @property --iris-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: true;
  }
  
  :root {
    animation: iris-rotate 8s linear infinite;
  }
  
  .iris-gradient {
    background: conic-gradient(from var(--iris-angle), #7c6aff, #00e5ff, #7c6aff);
  }
}

@media (prefers-reduced-motion: reduce) {
  :root { animation: none; }
  .iris-gradient {
    background: linear-gradient(135deg, #7c6aff, #00e5ff, #7c6aff);
  }
}
```

### 12.4 Font Loading Strategy

Self-host via `@fontsource` packages instead of Google Fonts CDN:

```bash
npm install @fontsource-variable/space-grotesk @fontsource-variable/inter \
  @fontsource/jetbrains-mono @fontsource/instrument-serif
```

In `src/index.css`:
```css
@import '@fontsource-variable/space-grotesk';
@import '@fontsource-variable/inter';
@import '@fontsource/jetbrains-mono/500.css';
@import '@fontsource/jetbrains-mono/700.css';
@import '@fontsource/instrument-serif/400-italic.css';
```

All fonts use `font-display: swap`. No external CDN dependency. No render-blocking network requests.

### 12.5 Tailwind Palette Backward Compatibility

During migration, `tailwind.config.js` maintains legacy aliases:

```javascript
colors: {
  // New palette
  void: '#06060e',
  obsidian: '#0d0d1a',
  pulse: '#00ff66',
  bleed: '#ff3344',
  sol: '#ffb800',
  // Legacy aliases (kept until all components migrated)
  pump: '#00ff66',    // alias → pulse
  dump: '#ff3344',    // alias → bleed
  hermes: '#a855f7',  // kept as-is (iris is a gradient, not a flat color)
  gold: '#ffb800',    // alias → sol
  surface: '#0d0d1a', // alias → obsidian
  // ...
}
```

---

## 13. Testing Strategy

### 13.1 TDD Mock Infrastructure

Add to `tests/setup.ts`:

```typescript
// Web Audio API mock
class MockAudioContext {
  state = 'running';
  resume = vi.fn().mockResolvedValue(undefined);
  suspend = vi.fn().mockResolvedValue(undefined);
  createBuffer = vi.fn(() => ({ duration: 0, length: 1, sampleRate: 22050 }));
  createBufferSource = vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }));
  destination = {};
  decodeAudioData = vi.fn().mockResolvedValue({});
}
globalThis.AudioContext = MockAudioContext as any;

// navigator.vibrate mock
Object.defineProperty(navigator, 'vibrate', {
  value: vi.fn(() => true),
  writable: true,
});

// IntersectionObserver mock (for scroll animations)
globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// matchMedia mock (for GSAP matchMedia + reduced motion)
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});
```

### 13.2 Test Suite Migration Plan

| Phase | Deleted/Rewritten Component | Affected Tests | Migration Action |
|-------|----------------------------|----------------|------------------|
| Phase 1 | `Hero.tsx` deleted, `BottomTabBar.tsx` deleted, `BottomNav.tsx` rewritten | `tests/client/v2-components.test.tsx` | Delete Hero/BottomTabBar tests. Rewrite BottomNav tests for 3-item nav. |
| Phase 2 | `TokenCard.tsx` rewritten | `tests/unit/wu05-token-presentation.test.ts` | Rewrite card tests: assert oracle ring, sparkline, progress. Add `data-testid` provenance assertions. |
| Phase 2 | `KingOfHill.tsx`, `KingOfHill2.tsx` deleted | `tests/client/v2-components.test.tsx` | Replace with KOH strip tests. |
| Phase 2 | `LiveTradeFeed.tsx` deleted | `tests/client/v2-components.test.tsx` | Replace with LiveTicker tests. |
| Phase 3 | `TokenModal.tsx` refactored | `tests/client/v2-components.test.tsx` | Update modal tests for TradeModalContent structure. |
| Phase 5 | Profile extracted from Home | `tests/client/profile-tab.test.tsx`, `tests/client/retention-loops.test.tsx` | Move profile-specific assertions to Profile.tsx tests. Update Home tests to assert feed-only layout. |

**Rule:** Tests for deleted components are removed in the same phase as the component deletion. Tests for new components are written RED first, then implementation goes GREEN. Coverage thresholds from `.coverage-thresholds.json` must pass at the end of every phase.

---

## 14. Security Hardening

> **Note:** Blockers B10–B12 are pre-existing backend vulnerabilities not introduced by this redesign. However, they affect features the redesign surfaces prominently. They are scoped as **prerequisite work** or **parallel track** — not gated by the frontend redesign.

### 14.1 AI Prompt Injection Mitigation (Prerequisite)

**Worker-side fix** (not frontend):
- Sanitize token `name` and `ticker` within structured delimiters before AI prompt injection
- Enforce JSON schema on Oracle AI responses — reject free-form risk overrides
- Compute algorithmic risk metrics server-side (holder concentration, curve velocity, creator balance %) as a baseline; LLM analysis supplements but cannot override algorithmic floor
- Cache AI outputs per token — regenerate only when on-chain metrics shift significantly

### 14.2 Stateless Auth Challenge (Prerequisite)

**Worker-side fix:**
- Replace in-memory `Map()` challengeStore with HMAC-signed stateless tokens:
  ```
  challenge = HMAC-SHA256(secret, wallet + timestamp + nonce)
  ```
- Or persist nonces in D1 with 5-minute TTL
- Either approach eliminates cross-isolate desynchronization

### 14.3 Authenticated Mutations (Prerequisite)

**Worker-side fix:**
- Enforce `verifyAuth(request)` with Ed25519 wallet signature on:
  - `PUT /api/profile/:wallet`
  - `POST /api/checkin`
  - `POST /api/quests/:wallet/claim`
  - `POST /api/follow/:wallet`
- Frontend already generates signatures via `signAuthChallenge()` — backend must verify them

### 14.4 Avatar URL Sanitization (Prerequisite)

**Worker-side fix:**
- Validate `avatar_url` against strict `https://` protocol whitelist
- Reject `javascript:`, `data:`, `blob:` schemes
- Frontend renders avatar URLs only in `<img src>` tags with CSP `img-src` restrictions

### 14.5 Frontend Security (This Redesign)

- **SoundManager:** Load audio only from local `/public/sounds/` or synthesize via oscillators. Never accept dynamic/user-specified audio URLs.
- **Deep-link params:** Validate `/trade?token=...` and `?ref=...` against `^[a-zA-Z0-9_-]{1,64}$` regex before routing/state.
- **Trade inputs:** Clamp SOL amounts to `[0.001, MAX_BALANCE]`. Reject NaN, Infinity, negative values. Clamp slippage to `[0.1%, 50%]`.

---

## 15. Architecture Decisions (Answers to Open Questions)

### Q1: Oracle/Bard fallback for unscored tokens
Oracle ring renders as **gray neutral ring** (no color mapping). Score shows "—". Text: "Awaiting Oracle analysis." Bard section shows: "The Bard has not yet spoken." with a shimmer placeholder. No broken layout.

### Q2: Trade modal — chart pinned or tabbed?
**Price chart is pinned** above the trade panel. It is always visible when the modal is open (200px height). The content tabs below (`Lore | Chat | Info`) provide supplementary content that scrolls independently beneath the fixed trade area.

### Q3: LiveTicker data source
**Props from parent.** `Home.tsx` fetches trades via the existing polling mechanism (or WebSocket if available) and passes the latest N trades as props to `<LiveTicker trades={recentTrades} />`. No independent data fetching inside LiveTicker.

### Q4: KOH Strip data source
**Client-derived from `allTokens`.** Same logic as current: `filterVerifiedTokens(contenders, 'curve-progress')[0]`. No dedicated endpoint. The existing `/api/king-of-the-hill` endpoint (which returns 404) is not relied upon.

### Q5: `/trade` route architecture
**Auto-opened modal on feed.** `/trade?token=:id` renders `<Home />` with `TokenModal` automatically opened for the specified token ID. Same pattern as current `?token=` query param handling. No standalone trade page.

### Q6: PriceChart + InstantTradePanel fate
**Kept as sub-components** imported by `TradeModalContent`. Not inlined. `InstantTradePanel` is renamed/refactored into `TradeExecutionPanel` and becomes the single trade component. `TradePanel.tsx` (the older duplicate) is **deleted**. This eliminates the duplicate bonding curve logic.

### Q7: LiveTicker animation stability
**Dual-buffer track.** Two identical track elements. When new trades arrive, they are added to the off-screen buffer. On the next animation cycle boundary, buffers swap. No layout jumps.

---

## 16. Quantitative Success Metrics

### 16.1 Baseline Metrics (measure before redesign deploy)

| Metric | How to Measure | Baseline |
|--------|----------------|----------|
| Session duration | Cloudflare Analytics | Current average (TBD pre-deploy) |
| Trade completion rate | Trades / Token modal opens | Current ratio (TBD pre-deploy) |
| Bounce rate | Single-page sessions | Current % (TBD pre-deploy) |
| Feed scroll depth | IntersectionObserver on last card | Current avg cards viewed (TBD) |
| Return rate (7-day) | Unique wallets returning within 7 days | Current % (TBD) |

### 16.2 Post-Launch KPIs (14-day evaluation window)

| KPI | Target | Failure Threshold (rollback) |
|-----|--------|------------------------------|
| Trade completion rate | ≥ current baseline | Drop > 5% from baseline |
| Session duration | +20% vs baseline | Drop > 10% from baseline |
| Feed scroll depth | +30% (more tokens scanned) | Drop > 15% from baseline |
| LCP (4G throttled) | < 2.0s | > 3.0s |
| FCP | < 1.2s | > 2.0s |
| JS bundle size (gzip) | < 200KB total | > 300KB |
| Crash/error rate | < 0.1% of sessions | > 1% of sessions |

### 16.3 Evaluation Timeline

- **Day 0:** Deploy to Cloudflare Pages (devnet only)
- **Day 1–3:** Smoke test on iOS Safari, Android Chrome, Desktop Chrome/Firefox/Safari
- **Day 3–7:** Monitor KPIs vs baseline. Fix critical regressions.
- **Day 7–14:** Full evaluation window. Compare all KPIs against baseline.
- **Day 14:** Go/No-Go decision. If any failure threshold is breached, rollback to previous build.

---

## 17. Files Changed (Updated)

### New Files

| File | Purpose |
|------|---------|
| `src/styles/oracle-pulse.css` | `@property` animation, iris-gradient class, reduced-motion, `@supports` fallback |
| `src/lib/sound.ts` | SoundManager singleton (Web Audio API, gesture unlock, visibility lifecycle) |
| `src/lib/haptic.ts` | Haptic feedback utility with iOS feature detection |
| `src/lib/confetti-presets.ts` | Confetti configuration presets |
| `src/components/OracleRing.tsx` | SVG risk ring with iris gradient |
| `src/components/OracleSignal.tsx` | Full Oracle panel (score + analysis + fallback states) |
| `src/components/Sparkline.tsx` | Extracted from KingOfHill2, reusable |
| `src/components/IrisBorder.tsx` | Reusable iris-gradient border wrapper |
| `src/components/XPFlyUp.tsx` | XP gain animation component |
| `src/components/LiveTicker.tsx` | Horizontal auto-scrolling trade ticker (dual-buffer) |
| `src/components/TradeModalContent.tsx` | Refactored trade modal internals |
| `src/components/TradeExecutionPanel.tsx` | Consolidated trade panel (replaces both TradePanel + InstantTradePanel) |
| `src/components/FilterBar.tsx` | Filter pills + search toggle |
| `src/components/KOHStrip.tsx` | Compact King of the Hill strip |
| `src/pages/Profile.tsx` | Standalone profile page (extracted from Home.tsx tabs) |
| `src/hooks/useSoundEffect.ts` | Hook wrapping SoundManager |
| `src/hooks/useHaptic.ts` | Hook wrapping haptic utility |
| `tests/setup.ts` (updated) | Web Audio, vibrate, IntersectionObserver, matchMedia mocks |

### Modified Files

| File | Changes |
|------|---------|
| `tailwind.config.js` | New colors (void, obsidian, pulse, bleed, sol) + legacy aliases (pump, dump, hermes, gold, surface), fontFamily, keyframes |
| `src/index.css` | Import oracle-pulse.css, @fontsource imports, base styles |
| `src/lib/tokens.ts` | Add `riskScore?: number`, `sparkline?: number[]`, `change24h?: number` to Token interface |
| `src/App.tsx` | Add /profile route (Profile.tsx), update /trade to modal-on-feed pattern |
| `src/pages/Home.tsx` | Complete rewrite — feed-only layout with KOH strip + ticker + 2-col card grid |
| `src/pages/Trade.tsx` | Refactored to render Home with auto-opened modal |
| `src/components/TokenCard.tsx` | Complete rewrite — oracle ring + sparkline + progress + `data-testid` provenance |
| `src/components/TopNav.tsx` | Simplified 48px bar with rank badge + sound toggle icon |
| `src/components/BottomNav.tsx` | Rewritten as 3-item nav (Feed/Create/Profile) |
| `src/components/TokenModal.tsx` | Refactored to use TradeModalContent, GSAP entrance |
| `src/components/Skeleton.tsx` | Iris shimmer |
| `src/components/ConfettiBurst.tsx` | Preset system |
| `src/components/GraduationModal.tsx` | Graduation confetti + sound |
| `src/components/CreateTokenModal.tsx` | Visual refresh |
| `src/components/TraderProfile.tsx` | Visual refresh |
| `src/components/AchievementBadges.tsx` | Visual refresh |
| `src/components/StreakCounter.tsx` | Visual refresh + sound trigger |
| `src/components/QuestCard.tsx` | Visual refresh + sound trigger |
| `src/components/SocialFeed.tsx` | Moved to Profile page only |

### Deleted Files

| File | Reason |
|------|--------|
| `src/components/Hero.tsx` | Replaced by KOHStrip |
| `src/components/KingOfHill.tsx` | Merged into KOHStrip |
| `src/components/KingOfHill2.tsx` | Merged into KOHStrip |
| `src/components/LiveTradeFeed.tsx` | Replaced by LiveTicker |
| `src/components/BottomTabBar.tsx` | Merged into new BottomNav |
| `src/components/Ticker.tsx` | Replaced by LiveTicker |
| `src/components/TradePanel.tsx` | Replaced by TradeExecutionPanel (eliminates duplicate logic) |
| `src/components/InstantTradePanel.tsx` | Consolidated into TradeExecutionPanel |

