## Hermes Launchpad — Agent Handoff File

**Generated:** 2026-08-21 (Friday)
**Branch:** main @ 72c2e55 + docs commit (closure sequence, post `efcb200`)
**Last build:** PASS (`tsc -b && vite build`, exit 0)
**Last lint:** PASS — **0 errors** (15 pre-existing warnings, non-blocking) after fixing the two react-hooks compiler errors that had CI red
**Last test:** PASS — vitest **186/186** across unit/worker/client/integration projects · Playwright **18/18** (5 spec files) · coverage **34.84% lines / 58.47% branches / 27.68% functions / 34.84% statements** ≥ thresholds 27/46/26/27
**Status:** CLOSURE SEQUENCE EXECUTED — CI/provider evidence PENDING POST-PUSH VERIFICATION
**CI verification:** pending — run IDs and per-job conclusions to be appended after push (see WU-F)

---

## WHAT CHANGED IN THE CLOSURE SEQUENCE (2026-08-21)

Plan: `docs/plans/2026-08-21-final-closure.md` (v3.1, gate-reviewed 3 iterations by independent adversarial reviewers; Feasibility PASS, Scope & Alignment PASS, Completeness residuals folded in verbatim).

- [x] **WU-A** — Fixed both react-hooks compiler errors in `src/pages/Home.tsx` (`set-state-in-effect` :123 via `refresh()` split; `preserve-manual-memoization` :158 via full-object deps). Guard suite added: `tests/client/home-data-loading.test.tsx` (3 tests). Commit `1397770`.
- [x] **WU-B** — Repo hygiene: `coverage/` untracked (74 files) + gitignored; abandoned EVM `contracts/` preserved at `~/workspace/_archive/hermes-launchpad-contracts-evm-pivot`; ~60 one-off devnet debug scripts archived (on disk under `scripts/archive/devnet-debugging-2026-08/`, ignored); proof drivers tracked at `scripts/devnet-smoke/` (test-buy/test-sell/test-sell2/test-integration); two stale e2e specs repaired and tracked; orphaned `tests/visual/baseline.test.ts` archived; playwright port reverted to canonical 4173. Commits `1dad4a1`, `2dbf94e`.
- [x] **WU-B6** — CI truth surgery: ALL `continue-on-error` flags removed (worker-check, test-program, test-e2e, deploy-worker); ALL exit-0 masking branches deleted (secret-gated skips are dead code — `DEVNET_WALLET` secret exists since 2026-08-08; the never-matching `*.spec.ts` glob that let e2e exit 0 having run nothing). Sole justified survivor: `cargo install … || true` best-effort pre-install (bare `anchor build` enforces the real outcome). Commits `72c2e55`. Every job must now report real success.
- [x] **WU-C** — Coverage measured above all four thresholds (table above).
- [x] **WU-D** — Full Playwright suite 18/18 after repairing stale selectors against the Oracle Terminal UI contract (provenance `data-testid`s, Token Details tab, `?create=1` deep-link).
- [x] **WU-E** — This docs truth pass. No green/deployed claims until provider evidence lands.
- [ ] **WU-F** — Push → watch BOTH workflows → verify every job conclusion == success individually → live probes (health/Pages/negative-path) → clean-tree proof → append evidence below.

## STILL TRUE / STILL PENDING (carried facts, not done)

- **Graduation → Raydium CPMM pool creation remains pending** an unprovisioned devnet `amm_config`. Curve-lock plumbing ready-but-unproven end-to-end.
- Design-spec §16 KPI evaluation (14-day LCP/FCP/bundle/crash-rate go/no-go) is a post-launch analytics window — waived inside closure scope.
- Devnet only. No mainnet claim.

---

## DEPLOYED ENDPOINTS & IDENTIFIERS (unchanged infrastructure)

- **Frontend:** `https://hermes-launchpad.pages.dev`
- **API Worker:** `https://hermes-api.tahamtandariush.workers.dev`
- **Health check:** `/api/health` -> `{"ok":true,"v":2}` (verified 2026-08-21 pre-push)
- **Solana Program ID (devnet):** `9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz`
- **Config PDA:** `9Sv1kApQK428EUueU7dR9mTPqKqNR7dxkBmwtZuHDTkr`
- **Fee / Creator Wallet:** `GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a`

## PROVIDER EVIDENCE (appended by WU-F step 5 — empty until then)

| Check | Run URL | Per-job conclusions |
|---|---|---|
| CI workflow @ final SHA | _pending_ | _pending_ |
| Deploy workflow @ final SHA | _pending_ | _pending_ |
| origin/main == local HEAD | _pending_ | — |
| Live probes (health / Pages 200 / negative 404) | _pending_ | — |
