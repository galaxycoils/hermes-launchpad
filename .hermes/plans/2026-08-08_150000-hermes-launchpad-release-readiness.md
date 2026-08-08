# Hermes Launchpad — Release Readiness Plan

Goal: take project from "merged-to-main, devnet-complete" to fully deployed, verified, and functional for real use (devnet demo / public preview).

Context: WU-00..WU-05b merged. Frontend truth-remediated. Worker on-chain provenance decoder wired. CI gate fixed (PR #6 green: lint/build + unit/worker/client/integration/security; program/e2e skip without `DEVNET_WALLET`). On-chain program live on devnet (`9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz`), config PDA init, fee wallet funded. WU-04 Raydium migration blocked (0/50 `amm_config` on devnet — environmental).

Assumptions:
- Scope = devnet demo + public preview. NO mainnet. All on-chain = devnet only.
- `$0` stack: GitHub free, Cloudflare Pages/Workers/D1/AI free, Solana devnet.
- User has Cloudflare `CF_API_TOKEN` + account `a55a43856c7029505b79300ec82f1629`.
- Backup deploy keypair for program exists off-repo (restore to `programs/hermes-curve/target/deploy/hermes_curve-keypair.json` for upgrades only).

Findings from recon (gaps blocking release):
1. Worker deploy (`wrangler deploy`) never executed in CI — needs `CF_API_TOKEN`. Not verified live since WU-05b.
2. D1 schema: repo has `workers/schema_v3.sql`; must confirm applied to remote `hermes-launchpad-db` (id `afa984c4-30e5-4f47-afce-a401ee2df098`). Seed rows (demo tokens) presence unknown.
3. Frontend Pages env vars (`VITE_*`) only in dashboard per DEPLOY.md — not in repo (`pages/`? `.env.example`?). Repo has no `.env.example` — onboarding gap.
4. `public/_worker.js` RPC proxy referenced in DEPLOY.md — must confirm file exists & builds.
5. `worker-check` CI job fails (needs CF auth) — non-blocking but noisy; either inject `CF_API_TOKEN` secret into CI or convert to `wrangler deploy --dry-run` with `--var` and tolerate.
6. No security audit of on-chain program (trailofbits `solana-vulnerability-scanner` skill exists, 4.4k installs) — run before public preview.
7. No E2E run (needs `DEVNET_WALLET` secret in CI). Currently skipped.
8. Program upgrade path fragile: keypair off-repo, no restore script.

Skills used: `find-skills` (cloudflare-workers 150, cloudflare-nextjs 161, solana 615, trailofbits solana-vulnerability-scanner 4.4k). `context7-cli`: `/cloudflare/workers-sdk` (796 snippets), `/solana-foundation/solana-web3.js`. `modern-web-guidance` returned empty for this query — skipped (no UI/SEO change in this plan).

## Step-by-step (release path)

### Phase A — Verify live deploy state (no code change)
1. `curl https://hermes-api.tahamtandariush.workers.dev/api/health` — confirm worker live.
2. `curl https://hermes-launchpad.pages.dev` — confirm frontend live.
3. `npx wrangler d1 execute hermes-launchpad-db --remote --command="SELECT count(*) FROM tokens"` — confirm schema + seed.
4. If worker down: `cd workers && CF_API_TOKEN=... npx wrangler deploy` (deploy current main).
5. If D1 empty: apply `schema_v3.sql` + seed script (check `workers/seed*.sql` / `scripts/`).

### Phase B — Repo hygiene for repeatable deploy
6. Add `.env.example` with all `VITE_*` + worker `[vars]` (no secrets, placeholders only).
7. Add `workers/.dev.vars.example` (vars only, no secrets) — documents local dev.
8. Confirm `public/_worker.js` exists; if missing, create minimal `/rpc` devnet proxy (solana-web3.js, CORS).
9. `wrangler.toml`: add `vars` for `MIGRATION_TARGET`/`FEE_WALLET` if frontend needs; keep `REQUIRE_SIGNED_TRADES=true`.

### Phase C — CI hardening
10. Add `CF_API_TOKEN` + `CF_ACCOUNT_ID` as repo secrets; change `worker-check` to use them so dry-run passes (or `wrangler deploy --dry-run --var`).
11. Add `DEVNET_WALLET` secret (backed-up devnet keypair JSON) → unlocks `test-program` + `test-e2e` in CI.
12. Re-run PR # (new) → confirm all 10 jobs green (worker-check pass, program/e2e run).

### Phase D — Security + correctness audit
13. Install + run `trailofbits/skills@solana-vulnerability-scanner` on `programs/hermes-curve` — check CPI `invoke_signed`/PDA seeds, fee math, overflow (u64 `checked*`).
14. Run `npm run test:program` locally with `DEVNET_WALLET` — confirm 6/6 pass on live devnet.
15. Run `npm run test:e2e` (Playwright) with funded wallet — confirm smoke passes (or document skip reason).

### Phase E — Program upgrade safety (optional, pre-public)
16. Add `scripts/restore-keypair.sh` (operator restores from backup to `target/deploy/`) — documents upgrade path.
17. Add `npm run program:deploy` script wrapping `anchor build && anchor deploy --provider.cluster devnet` after keypair restore.

### Phase F — Docs + public preview
18. Update README/DEPLOY: mark WU-00..WU-05b done, WU-04 blocked (honest), CI gate active.
19. Add "How to run locally" (`.env.example` + `wrangler dev` + `vite`).
20. Open public preview (Pages already public `.pages.dev`). Announce devnet demo.

## Files likely to change
- `.env.example` (new), `workers/.dev.vars.example` (new)
- `public/_worker.js` (verify/create)
- `wrangler.toml` (vars)
- `.github/workflows/ci.yml` (worker-check auth, program/e2e unlock)
- `scripts/restore-keypair.sh` (new)
- `README.md`, `DEPLOY.md` (status + local-run)
- `INVENTORY.md` (release section)

## Tests / validation
- `npm run lint && npm run build` exit 0
- `npm run test:unit` (12) `test:worker` (6) `test:client` (1) `test:integration` (1) `test:security` (5) green
- `npm run test:program` (6) on devnet with `DEVNET_WALLET`
- `npm run test:e2e` (Playwright) with funded wallet
- Live: `curl /api/health`, `curl /api/tokens` returns array, `curl /api/tokens/:id` returns `provenance`
- Solana scanner: 0 high-sev findings (or documented + fixed)

## Risks / tradeoffs / open questions
- WU-04 migration: Raydium devnet `amm_config` unprovisioned → migration unproven. Options: (a) accept devnet "migration-ready" only, (b) provision Raydium devnet state (out-of-repo, needs Raydium testnet faucet / manual init), (c) swap to Meteora/OpenBook migration. Defer — not blocker for demo.
- `worker-check` CI needs CF auth — either inject secret (exposes account) or keep `continue-on-error`. Recommend inject `CF_API_TOKEN` (repo secret, masked).
- Keypair off-repo: upgrade requires manual restore. Acceptable for devnet demo; document.
- Workers AI free tier: 10k neurons/day — Bard/Oracle rate-limited. Demo fine.
- `public/_worker.js` may conflict with Pages Functions — verify routing (Pages `_worker.js` at root = catch-all; ensure `/api/*` proxied to `hermes-api` worker or handled).
- No mainnet intent — all plans devnet-only.

## Next action after plan approved
Execute Phase A (verify live state) → report findings → proceed B..F with user confirm at G (public preview).
