# Hermes Launchpad — Ship-Ready Assessment

**Commit**: `84d97c4` (pushed, deployed)
**Audit**: `docs/handoffs/ship-audit-2026-08-16.md`
**OMH Spec**: `.omh/specs/ship-ready-hermes-launchpad-spec.md`
**OMH State**: `.omh/state/ship-ready-hermes-launchpad/autopilot-state.json`

## Current State: Deployed but Not Ship-Ready

The app is live at `https://my-app.tahamtandariush.workers.dev` with:
- ✅ On-chain trading, Web3 auth, focus traps, quest toasts
- ✅ 33/33 tests, 0 lint errors, production build
- ✅ Worker + Pages CI/CD green

**What's missing**: P0 blockers prevent a clean user experience. P1 items are polish that separate "works" from "works beautifully."

---

## P0 — Must Fix (6 items, ~3-4 hours)

| # | Issue | User Impact |
|---|-------|-------------|
| P0-1 | **No loading states** | User stares at empty UI while data loads — thinks app is broken |
| P0-2 | **No error states** | Failed API calls show nothing — user can't retry or understand what happened |
| P0-3 | **Mobile wallet return broken** | After Phantom deep-link, `window.solana` may not inject; no retry logic |
| P0-4 | **No wallet install UX** | If Phantom not installed, deep link fails silently — dead end |
| P0-5 | **No empty state illustrations** | "No trades yet" is just text — feels unfinished |
| P0-6 | **No trade confirmation** | Click buy/sell executes immediately — dangerous, no review step |

## P1 — Ship Quality (10 items, ~5-7 hours)

| # | Issue | User Impact |
|---|-------|-------------|
| P1-1 | **Hardcoded "INDEX LIVE"** | Not connected to actual API health — misleading |
| P1-2 | **No pull-to-refresh (mobile)** | Stale data, no way to update |
| P1-3 | **No dedicated referral share** | Only in banner; no QR code, no mobile share sheet |
| P1-4 | **No trade history** | Users can't see their own past trades |
| P1-5 | **No slippage settings** | Hardcoded 1% — power users can't adjust |
| P1-6 | **No wallet balance display** | Connected wallet SOL balance hidden |
| P1-7 | **No leaderboard refresh** | Stale rankings, no manual refresh |
| P1-8 | **No "View on Explorer"** | Receipt has no link to Solscan |
| P1-9 | **No auth rate limiting** | `/api/auth/challenge` accepts unlimited requests |
| P1-10 | **No favicon / OG image** | Browser tab looks broken; social shares have no preview |

## P2 — Post-Ship (Nice, ~4 hours)

API versioning, PWA manifest, analytics, terms/privacy, DB migrations, CSP headers, comment sanitization, profile customization.

---

## Recommended Path

**Option A**: I start executing P0 right now (one task per invocation, autonomous until done).

**Option B**: You pick which P0/P1 items matter most to you; I prioritize those.

**Option C**: Run the OMH autopilot — it will drive the full list via ralph iterations through to QA + validation.

Total remaining: ~12-15 hours of work for P0+P1 combined. All build on the same 40-file `src/` tree.
