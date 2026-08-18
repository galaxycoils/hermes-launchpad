# Spec: Ship-Ready Hermes Launchpad

**Goal**: Finish remaining P0/P1 blockers and ship production-ready UI with clean UX.

**Scope**: 10 work units covering loading states, error states, mobile wallet UX, trade confirmations, and polish.

## Definition of Done

- [ ] Loading skeletons on all async components
- [ ] Error states with retry on all API calls
- [ ] Mobile wallet deep link with retry + fallback
- [ ] Wallet selector modal (Phantom/Solflare) with install links
- [ ] Empty state illustrations
- [ ] Trade confirmation modal
- [ ] Live/offline indicator wired to health check
- [ ] Pull-to-refresh on mobile
- [ ] Referral share modal with QR
- [ ] Slippage settings in TradePanel

## Non-Goals

- API versioning (P2)
- PWA manifest (P2)
- Analytics (P2)
- Terms/privacy pages (P2)

## Success Criteria

- All tests pass (33+)
- Build exits 0
- Lint 0 errors
- Manual QA: load app, connect wallet, trade, view receipt, disconnect — all on mobile + desktop
