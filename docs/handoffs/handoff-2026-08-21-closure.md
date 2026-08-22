# Closure Handoff — 2026-08-21

**Mission:** "completely make everything work and finish this project once and for all."
**Plan:** `docs/plans/2026-08-21-final-closure.md` (v3.1) — gate-reviewed across 3 iterations by independent adversarial reviewers (Feasibility / Completeness / Scope & Alignment); consultation from stack-engineer folded in verbatim.
**Executor:** @super-engineer (direct execution, per user choice).

## Outcome snapshot at docs-commit time

| Gate | Result | Evidence |
|---|---|---|
| Lint | 0 errors | `npm run lint` exit 0 (was: 2 react-hooks compiler errors → CI red) |
| Build | PASS | `tsc -b && vite build` exit 0 |
| Vitest | 186/186 | unit+worker+client+integration projects |
| Coverage | 34.84/58.47/27.68/34.84 | ≥ thresholds 27/46/26/27 (enforced) |
| Playwright | 18/18 | 5 spec files, post-disposition inventory |
| CI honesty | masking eliminated | 0 `continue-on-error`; only justified `\|\| true` survivor documented |
| Provider evidence | **PENDING WU-F** | appended to HANDOFF.md after push |

## Key decisions recorded

1. Two stale e2e specs (`devnet-banner-badges`, `index-api-calls`) were REPAIRED against the Oracle Terminal UI contract — not archived — because they encode real regression value (provenance badges, index-API payload shapes). Selectors updated: provenance `data-testid`s on TokenCard, Token Details tab for mint status, `?create=1` deep-link for the create flow (BottomNav create button renders mobile-viewport only).
2. `test-sell2.mjs` tracked with the other proof drivers (feasibility-review catch).
3. `.omh/specs/protocol-architecture-spec.md` TRACKED — inspected before disposition: it is the approved Solana bonding-curve protocol spec (1167 lines, constants match live program ID/PDA/fee wallet), not EVM junk.
4. `contracts/` (abandoned EVM pivot) preserved at `~/workspace/_archive/hermes-launchpad-contracts-evm-pivot`, never tracked.
5. `ci.yml test-e2e` was exiting 0 having run NOTHING (`*.spec.ts` glob never matched this repo's `*.test.ts` naming). Deleted; Playwright now runs unconditionally with the existing `DEVNET_WALLET` secret.

## Out of scope (carried facts)

- Graduation → Raydium pool creation: blocked upstream on unprovisioned devnet `amm_config`.
- Design-spec §16 KPI window: post-launch analytics, waived inside closure.
- Mainnet: permanently out until separately planned.
