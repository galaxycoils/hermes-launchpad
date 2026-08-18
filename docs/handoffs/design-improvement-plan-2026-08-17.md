# Design Improvement: Hermes Launchpad — Polish Sprint

**Date**: 2026-08-17 · **Commit target**: `917bbcf+`
**Goal**: Elevate UI from "functional" to "delightful" — micro-interactions, visual hierarchy, motion.

## Current State Assessment

| Area | Grade | Issue |
|------|-------|-------|
| Hero | B+ | Strong animation, but status pill is disconnected from actual health |
| TokenCard | B- | Too dense; badges compete for attention; progress bar unclear |
| TradePanel | B | Works but lacks visual feedback during states |
| TopNav | B | Wallet menu is basic; no balance display |
| Empty states | C | Just text, no delight |
| Motion | B+ | GSAP hero good, but no micro-interactions elsewhere |

## Design Improvements (Implementation Order)

### D1: TokenCard Redesign — Information Hierarchy
**File**: `src/components/TokenCard.tsx`

**Current problems**: 4 badge variants stacked, progress bar small, lore competes with metrics.

**Design solution**:
- Primary: Token name + ticker (bold, single line)
- Secondary: Creator address (mono, 50% opacity)
- Tertiary: Metrics row with clear left/right separation
- Badge: Single status badge, right-aligned, color-coded
- Lore: Collapsible or behind "expand" tap (not inline)
- Progress: Full-width gradient bar with glow when >75%

**Visual spec**:
```
┌─────────────────────────────────────┐
│  🚀 Galactic Gecko  $GECKO     [🟢]│  ← row: emoji + name + badge
│  by 0x7a3b...9f2e                   │  ← row: creator (muted)
│  ─────────────────────────────────  │
│  SOL raised          Curve         │
│  ██░░░░░░░ 12.5     14.7%         │  ← metrics + mini progress
│  ─────────────────────────────────  │
│  "Lore text italic..."         [+]  │  ← expandable lore
└─────────────────────────────────────┘
```

### D2: TradePanel — Visual Feedback During States
**File**: `src/components/TradePanel.tsx`

**Current problems**: Amount input is plain; no visual confirmation of side; quote section appears abruptly.

**Design solution**:
- Buy/Sell toggle: Pill-style with icon (arrow up/down) + color fill animation
- Amount input: Large display showing "0.00" placeholder, real-time quote below
- Quote card: Slide-down animation when quote appears, not abrupt show
- Execute button: Color transitions (green→buy, red→sell) with subtle pulse
- Price impact: Color gradient (green <3%, yellow 3-5%, red >5%)

**Motion spec**: Quote card uses `gsap.from()` slideDown 200ms; button uses `scale(1.02)` on hover.

### D3: Hero — Status Pill Wired to Real Health
**File**: `src/components/Hero.tsx`

**Current problem**: Hardcoded "INDEX API REACHABLE".

**Design solution**:
- Accept `live` prop from parent
- Color-coded: green (live), yellow (degraded), red (offline)
- Pulse dot animation when live
- Text: "Live — Indexed" / "Degraded — Catching up" / "Offline"

### D4: Empty State — Delightful Illustrations
**File**: `src/pages/Home.tsx`

**Current problem**: Just text "No tokens match".

**Design solution**:
- Large emoji/illustration (64px) with subtle float animation
- Clear message + secondary hint
- Optional: "Launch the first token" CTA button
- Skeleton shimmer for loading (already done, keep it)

### D5: TopNav — Wallet Balance + Network Indicator
**File**: `src/components/TopNav.tsx`

**Current problems**: No SOL balance, no network badge, wallet menu is plain.

**Design solution**:
- After wallet connected: Show truncated address + SOL balance inline
- Network badge: Devnet pill (purple) when on devnet
- Wallet menu: Add "View on Solscan" link, copy address, disconnect
- Avatar: Generate gradient from wallet address (already exists, keep)

### D6: Micro-interactions Throughout
**Files**: All components

**Design solution**:
- Button hover: `active:scale-[0.97]` (already present, standardize)
- Card hover: `hover:-translate-y-1` (already present, add shadow)
- Number changes: CountUp animation for SOL raised, XP gains
- Tab switch: Crossfade between tabs, not abrupt
- Modal open: Backdrop fade + content scale from 0.95
- Confetti on trade success (already exists, keep)

### D7: Responsive Polish
**Files**: All components

**Design solution**:
- Mobile: Trade panel becomes bottom sheet (like TokenModal)
- Mobile: TokenCard grid = 1 column on <640px, 2 on tablet
- Mobile: Hero text scales down (already responsive via `sm:`)
- Mobile: BottomTabBar already present, ensure safe-area inset

---

## Implementation Priority

```
D1 TokenCard redesign  ──┐
D3 Hero health status   ──┤  Sprint A (visual hierarchy)
D4 Empty state polish   ──┘

D2 TradePanel states    ──┐
D5 TopNav balance       ──┤  Sprint B (interaction)
D6 Micro-interactions   ──┘

D7 Responsive polish    ──┐  Sprint C (mobile)
```

Total estimated effort: 4-6 hours across 3 sprints.
