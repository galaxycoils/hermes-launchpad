# Hermes Launchpad — Ship-Ready Audit

**Date**: 2026-08-16 · **Commit**: `84d97c4` · **Status**: Deployed but not ship-ready

## Current State

| Area | Status | Notes |
|------|--------|-------|
| Core UI components | ✅ | Hero, TokenCard, Modal, TradePanel, TopNav, BottomTabBar |
| On-chain trading | ✅ | useTrade, buildTradeIx, sendTx, indexTrade |
| Web3 auth | ✅ | signMessage challenge/verify, mobile deep link |
| Worker API | ✅ | Full REST + D1 + AI agents |
| CI/CD | ✅ | Node 22, wrangler v4, deploy to Pages + Workers |
| Tests | ✅ | 33/33 passing |
| Lint/Build | ✅ | 0 errors |

---

## P0 — Must Fix Before Ship (Blockers)

| # | Issue | Why It Blocks | Effort |
|---|-------|---------------|--------|
| P0-1 | **No loading states** | Every API call shows raw UI with no feedback; user thinks app is broken | Add `<Skeleton>` to TokenCard, TradePanel, leaderboard |
| P0-2 | **No error states** | Failed API calls show nothing; user can't recover | ErrorBoundary exists but no per-component error UI |
| P0-3 | **No wallet disconnect on mobile** | After deep link returns, `window.solana` may not be injected; no retry handling | Add `useEffect` polling for provider on return |
| P0-4 | **No "install wallet" mobile UX** | Deep link to Phantom may fail silently if app not installed | Show wallet selector modal with install links |
| P0-5 | **No empty state illustrations** | Just text "No tokens match" / "No trades yet" | Add SVG illustrations or icon states |
| P0-6 | **No trade confirmation** | Click buy/sell executes immediately with no review step | Add confirm modal with slippage + fee breakdown |

## P1 — Ship Quality (Polish)

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| P1-1 | **No live/offline indicator** | "INDEX LIVE" is hardcoded, not connected to actual health check | Wire to `/api/health` |
| P1-2 | **No pull-to-refresh on mobile** | No way to refresh data on mobile | Add touch gesture or refresh button |
| P1-3 | **No share referral on mobile** | Referral link only in banner; no dedicated share sheet | Add share modal with QR + copy |
| P1-4 | **No trade history view** | Users can't see their past trades | Add "My Trades" section in Profile |
| P1-5 | **No slippage settings** | Hardcoded 1% slippage; power users can't adjust | Add slippage selector in TradePanel |
| P1-6 | **No wallet balance display** | Connected wallet SOL balance not shown | Show balance next to wallet button |
| P1-7 | **No refresh button on leaderboard** | Stale leaderboard has no manual refresh | Add refresh icon button |
| P1-8 | **No trade success details beyond confetti** | Receipt card has no "View on Explorer" link | Add Solscan link to receipt |
| P1-9 | **No rate limit on challenge endpoint** | `/api/auth/challenge` has no throttle | Add IP-based rate limit (10/min) |
| P1-10 | **No favicon / og-image** | Unprofessional in browser tab + social shares | Generate minimal favicon + og:image |

## P2 — Nice to Have (Post-Ship)

| # | Issue | Impact |
|---|-------|--------|
| P2-1 | **No API versioning** | `/api/` should be `/api/v1/` for future compatibility |
| P2-2 | **No PWA manifest** | Can't "install" as mobile app |
| P2-3 | **No analytics** | No way to track users/trades |
| P2-4 | **No terms/privacy links** | Legal exposure |
| P2-5 | **No database migration system** | Schema changes are manual |
| P2-6 | **No comments sanitization** | Potential XSS via comment text |
| P2-7 | **No CSP headers** | Security hardening |
| P2-8 | **No toast for "install wallet"** | Mobile users need guidance if deep link fails |
| P2-9 | **No profile customization** | No avatar/name editing |
| P2-10 | **No onboarding skip** | Tour has no "skip" button |

---

## Recommended Execution Order

```
P0-1 Loading states        ──┐
P0-2 Error states           ──┤
P0-3 Mobile wallet retry    ──┤  Sprint 1 (ship blockers)
P0-4 Wallet selector modal  ──┤
P0-5 Empty illustrations    ──┤
P0-6 Trade confirm modal    ──┘
                              │
P1-1 Live indicator          ──┐
P1-2 Pull-to-refresh         ──┤
P1-3 Share referral          ──┤
P1-4 Trade history           ──┤  Sprint 2 (quality)
P1-5 Slippage settings       ──┤
P1-6 Wallet balance          ──┤
P1-7 Leaderboard refresh     ──┤
P1-8 Explorer link           ──┤
P1-9 Rate limit              ──┤
P1-10 Favicon/og-image       ──┘
```

Total estimated effort: ~8-12 hours for P0+P1, ~4 hours for P2.
