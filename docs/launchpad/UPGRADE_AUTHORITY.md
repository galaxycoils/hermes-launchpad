# Upgrade Authority (G2 Decision Record)

> Per plan §5 G2 + §6 step 6. Records upgrade authority, program-ID immutability decision, rollback procedure.

## Decision (G2 = plan default)
- **Program ID:** `9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz` (immutable for V2 lifecycle)
- **Upgrade authority:** local wallet `GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a` (verified 2026-08-07)
- **Program deployment:** devnet slot 481782747, 2.24 SOL rent-exempt (verified 2026-08-07)
- **Path:** preserve current layout + companion PDA for new lifecycle/pool metadata
- **Rollback:** deployed Solana program is immutable — no rollback possible without separately approved remediation. Document freeze + new-program migration path.

## Hard-stop rule
No program mutation (deploy/upgrade) until G2 explicitly resolved. G2 resolved by plan default above.

## Rollback procedure
- Worker rollback: `wrangler deploy --oldest` (or `wrangler rollback <version>`); verify `GET /health` returns `ok` post-rollback.
- Pages rollback: `wrangler pages deployment list` → promote last verified deployment.
- D1 repair: `wrangler d1 export` backup first, then `wrangler d1 execute hermes-launchpad-db --file=workers/migrations/<forward-repair>.sql` only after backup + equivalence proof.
- Program: immutable — freeze + new-program migration path (separate approval required).
