# Devnet Verification (r2)

> Per plan §6D. Skeleton — documents per-tx verification commands, failure modes, assertions, rollback. No wallet secrets or unverified claims.

## Per-transaction verification
1. **Create:** build + simulate + sign (user-approved) → `solana confirm -v <sig> -u devnet` → decode `Initialize`/`CreateToken` event via Worker `/api/trades/index` (signature-only) → assert mint/creator/name/symbol from on-chain event, not request body.
2. **Buy/Sell:** simulate → sign → confirm → Worker index → assert quote/fee/slippage floor/post-trade deltas reconcile to program event.
3. **Fee ledger:** assert creator fee_transfer events sum to indexed `fee_transfers` rows.
4. **Graduation (post-WU-02):** Raydium CPMM pool address + LP lock receipt on devnet Explorer before any "graduated" UI claim.

## Failure modes
- Simulation fails → disable confirm, show reason.
- Confirmed tx but Worker decode fails → `verification_failed` state, never `verified-live`.
- RPC equivocation/outage → capability `degraded`, trading disabled.
- Unknown/missing config PDA → fail closed.

## Assertions
- `custody == real token reserve` after every instruction (program test).
- No `postTrade` / `createTokenServer` / `POST /api/tokens` in production route graph (source scan).
- `/health` never leaks secrets; down RPC labeled `down`.

## Rollback
- See UPGRADE_AUTHORITY.md + RUNBOOK.md (WU-08). Program immutable; Worker/Pages/D1 revert to last verified artifact.

## Prerequisites (blocking)
- Disposable funded devnet wallet + explicit user approval → else `E2E_BLOCKED_WALLET_UNAVAILABLE`, no tx.
- Reliable approved RPC endpoints; fail closed degraded otherwise.
