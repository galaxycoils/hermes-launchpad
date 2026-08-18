# Plan: Ship-Ready Hermes Launchpad

**Instance**: `ship-ready-hermes-launchpad`
**Spec**: `.omh/specs/ship-ready-hermes-launchpad-spec.md`
**Created**: 2026-08-16T22:35:00Z

## Goal
Execute 6 P0 blocker tasks to achieve ship-ready UI quality.

## Work Units

### WU-01: Loading States
- **Scope**: Add `<Skeleton>` placeholders to TokenCard list, TradePanel, leaderboard, profile sections
- **Files**: `src/pages/Home.tsx`, `src/components/TokenCard.tsx`, `src/components/TradePanel.tsx`
- **Acceptance**: All async UI shows skeleton shimmer while loading

### WU-02: Error States
- **Scope**: Add error banners with retry buttons for failed API calls
- **Files**: `src/pages/Home.tsx`
- **Acceptance**: Failed fetch shows error message + "Try Again" button

### WU-03: Mobile Wallet Deep Link Retry
- **Scope**: Poll for `window.solana` injection after deep-link return
- **Files**: `src/lib/wallet.ts`
- **Acceptance**: After returning from Phantom, app detects provider within 3s or shows manual retry

### WU-04: Wallet Selector Modal
- **Scope**: Show Phantom/Solflare choice with install fallback
- **Files**: `src/lib/wallet.ts`, `src/components/TopNav.tsx`
- **Acceptance**: User picks wallet → deep link or install page if unavailable

### WU-05: Empty State Illustrations
- **Scope**: Replace text-only empty states with icon + message
- **Files**: `src/pages/Home.tsx`
- **Acceptance**: "No trades yet" has icon; "No tokens match" has illustration

### WU-06: Trade Confirmation Modal
- **Scope**: Show review step before executing trade
- **Files**: `src/components/TradePanel.tsx`
- **Acceptance**: Buy/Sell opens confirm modal with amount, slippage, expected output, fees

## Execution Order
WU-01 → WU-02 → WU-03 → WU-04 → WU-05 → WU-06

## QA
- `npm run build` exit 0
- `npm run lint` 0 errors
- `npm test` all pass
- Manual: load, connect wallet, trade, view receipt
