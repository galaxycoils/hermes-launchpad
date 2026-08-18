# Hermes Launchpad — Autonomous CLI Mint One Real Devnet Token

> **Status:** Draft plan; no transaction executed.
> **Supersedes:** Browser-wallet-only execution assumptions in this file and `.omh/plans/ralplan-mint-one-real-devnet-token-and-close-release.md` for the mint transport only. All approved safety/provenance invariants remain binding.

## Goal

Use the existing local Solana CLI devnet signer to autonomously prepare, simulate, explicitly approve, sign, broadcast, verify, index, and document exactly one `Hermes Proof Token` (`HPT`, `🚀`) creation through the deployed Hermes Launchpad program. Close the release with exact-SHA evidence. No browser wallet dependency, mainnet action, direct D1 write, Raydium migration, trade, or secret exposure.

## Current context / assumptions

- Canonical repo: `/Users/cmd/workspace/hermes-launchpad`.
- Current observed HEAD: `b20f0a90c6c313514acaff9ad3addbc107ed4709` on `main`; unrelated dirty/untracked files exist and must remain untouched.
- Devnet program: `9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz`; config PDA: `9Sv1kApQK428EUueU7dR9mTPqKqNR7dxkBmwtZuHDTkr`.
- Devnet genesis lock: `EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG`.
- Local Solana CLI signer exists and is readable at the configured path. Public key: `GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a`; observed balance: `17.712710498 SOL` on devnet. Secret bytes must never be printed, copied, persisted, committed, or passed through chat.
- WU-0 live prerequisites already passed: Pages/Worker HTTP 200, authenticated Cloudflare access, D1 = 9 total / 0 on-chain rows, unique partial `onchain_mint` index present, GitHub deployment prerequisites valid, program executable, config initialized.
- Prior WU-0 browser-wallet blocker is superseded by the user's explicit authorization to use the existing local CLI devnet signer. This does not waive the immediate pre-sign approval gate.
- `src/lib/solana.ts` already builds the canonical `create_token` instruction and adds the required 256 KiB heap frame. Current browser `sendTx` signs before an explicit simulation and loses structured ambiguity evidence; do not reuse it blindly for CLI execution.
- `workers/chain.js` currently matches program/mint/creator positions but does not verify the `create_token` discriminator, exact full account topology, PDAs, cluster genesis, or decoded curve ownership/metadata. `workers/worker.js` can return `provenance: "onchain"` when curve decoding is unavailable. These are blocking truth defects.
- Obsidian continuity checked: `00.context/now.md` confirms the heap-frame fix and launchpad release context. Vault writes are deferred until verified closure.
- `/find-skills`: strongest relevant result was `agiprolabs/claude-trading-skills@solana-tx-building` (226 installs); no install is needed because local official `solana-dev` + `solana-transaction-integration` cover the task more authoritatively.
- Context7 resolved `/solana-foundation/solana-web3.js`; the exact legacy simulation query returned no matching excerpt. Implementation must therefore be validated against installed `@solana/web3.js@1.98.4` types/tests and live devnet simulation, not guessed API syntax.
- `modern-web-guidance` was run as required; results were unrelated to this non-UI transport change. Existing browser/UI behavior remains unchanged; browser lifecycle hardening is deferred to a separate follow-up plan.

## Binding invariants

1. **Devnet only:** compare RPC genesis before preparation and immediately before send. Any mismatch aborts.
2. **Exactly one operation:** one candidate mint keypair generated in one long-lived process, one approval event, one CLI-wallet signing event, one broadcast attempt, one successful top-level Hermes `create_token`, and D1 baseline `0 → 1` for that mint. This is not global name/symbol uniqueness.
3. **No candidate persistence:** candidate secret remains only in the live process memory. The process prints the mint public key only. If it exits before signing, the operation is aborted; a replacement is a new operation requiring a new summary and explicit approval.
4. **Immediate approval boundary:** prepare and unsigned-simulate first; print exact summary; wait. Only a later explicit user confirmation authorizes the live process to read the configured signer, add mint + payer signatures, and broadcast once.
5. **Transaction topology:** legacy transaction; exactly one top-level Hermes `create_token`; zero buy/sell/migrate instructions; zero extra top-level System transfer; only permitted Compute Budget instructions plus `create_token`.
6. **Fee/rent truth:** compute network fee with `getFeeForMessage`; compute current rent exemptions for mint, curve account, and curve ATA from RPC using exact account sizes; show conservative total bound and post-debit reserve. Do not infer rent from logs or use stale constants.
7. **Ambiguity is terminal:** once broadcast is attempted, never rebuild, re-sign, resend, or generate another mint automatically. Persist only public reconciliation evidence (`signature`, mint, creator, blockhash, last-valid block height, timestamps) with mode `reconcile_only`; query chain until classified.
8. **Indexer authority:** only `POST /api/tokens/index` may mutate D1 after Worker cryptographic verification. No direct D1 insert/update.
9. **No secrets:** never log signer path contents, seed phrase, private bytes, serialized keypairs, or signed raw transaction. Evidence contains public values only.
10. **No mainnet/Raydium/trades:** no migration or buy/sell transaction is part of this plan.
11. **Scope control:** path-scoped staging only; preserve existing untracked files and unrelated `skills-lock.json` modification.
12. **Module size:** new executable/helper modules stay ≤60 lines; split preparation, execution, and evidence handling rather than creating a monolith.

## Proposed approach

Create a narrow CLI mint harness that reuses the canonical instruction builder, but owns a strict state machine:

`baseline → prepared → simulated → awaiting_approval → signed → broadcast_attempted → confirmed | reconcile_only → indexed → verified`

The harness remains alive at `awaiting_approval`, preserving the single in-memory mint candidate. It emits a public JSON summary, waits for an approval token over stdin, and only then reads the configured local signer and signs. Production Worker verification is hardened and deployed before the harness may prepare the candidate. Browser lifecycle remediation is explicitly deferred to a separate follow-up plan.

## Dependency graph

`WU-0 → WU-1 → WU-2 → WU-3 → WU-4 → GATE-MINT → WU-5 → WU-6 → WU-7`

Independent tests within a WU may run in parallel. Work units do not run in parallel across this dependency chain.

## Step-by-step plan

### WU-0 — Import verified baseline and resolve transport blocker

**Mode:** read-only. **Status:** evidence already collected; re-check only volatile values once at execution start.

- Record HEAD/branch/dirty paths, endpoints, program/config, genesis, D1 counts/index, deploy prerequisites, signer public key, and balance.
- Resolve configured signer path internally and assert file permissions without displaying contents.
- Assert fee-payer reserve exceeds the conservative creation bound plus a fixed safety reserve.
- Mark browser-wallet blocker superseded by the explicitly authorized local CLI signer.

**Acceptance:** devnet genesis exact; program/config valid; D1 on-chain baseline exactly zero; Worker deploy prerequisites valid; signer public key exact; sufficient balance; no mutation.

### WU-1 — TDD: harden Worker provenance and atomic indexing

**RED tests first:** extend Worker tests to reject:

- wrong genesis/cluster, versioned transaction, failed transaction;
- wrong/missing `create_token` discriminator;
- extra Hermes instruction, trade/migration instruction, disallowed top-level System transfer;
- wrong account count/order/roles/program IDs;
- wrong config/curve/curve-ATA PDAs;
- curve account wrong owner/discriminator, missing decode, metadata mismatch;
- duplicate/concurrent index attempts that could create two rows or different payloads for one mint.

**GREEN implementation:**

- Lock Worker RPC to the expected devnet genesis and legacy transaction.
- Verify exact discriminator and transaction topology.
- Verify expected account keys, signer/writable roles, fixed program IDs, config PDA, curve PDA, curve ATA.
- Fetch curve account; require program owner, exact discriminator, valid bounds, mint/creator/name/symbol/URI equality.
- Return `provenance: "onchain"` only after complete decode.
- Derive collision-resistant ID from mint; rely on the unique `onchain_mint` index and atomic insert/conflict-read behavior. Same mint + same payload is idempotent; conflicting payload fails closed.

**Files likely:** `workers/chain.js`, `workers/worker.js`, `tests/worker/token-index.test.ts`, focused Worker security tests.

**Acceptance:** RED observed before code; GREEN focused tests; no direct DB mutation outside Worker endpoint.

### WU-2 — TDD: canonical instruction reuse without browser changes

- Extract or export only the canonical create-token instruction primitive strictly required by the CLI harness.
- Preserve `CreateTokenModal` and generic trade `sendTx` behavior; no browser approval UX, lifecycle copy, or index-failure remediation in this execution.
- Add RED/GREEN regression tests proving canonical instruction bytes/accounts remain identical and existing browser/trade callers remain unchanged.
- Track browser lifecycle hardening as a separate follow-up plan.

**Files likely:** `src/lib/solana.ts` only if export/extraction is required; one focused unit test. No `CreateTokenModal` or client-UX changes.

**Acceptance:** CLI can reuse the canonical builder; browser/trade behavior remains unchanged; no UI scope expansion.

### WU-3 — Deploy hardened code before candidate generation

- Run lint, build, unit, worker, client, integration, security, and Rust tests; enforce repository coverage thresholds.
- Run Worker dry-run and validate bindings without exposing values.
- Path-stage only WU-1/WU-2 files; commit/push.
- Explicitly dispatch/observe CI for exact SHA because `ci.yml` has no push trigger.
- Require both existing parallel deployment paths to converge on the same exact SHA; probe Pages, Worker health, genesis lock, and negative provenance cases.
- Stop on failed credentials, environment approval, CI, deploy, or live probe.

**Acceptance:** exact SHA green; hardened Worker live; D1 still baseline zero; no mint candidate generated yet.

### WU-4 — TDD: autonomous CLI harness, prepare, and hold

**New modules (each ≤60 lines):**

- `scripts/cli-mint.ts` — entry/state orchestration.
- `scripts/lib/mint-prepare.ts` — canonical instruction, heap, blockhash, unsigned simulation, fee/rent bound.
- `scripts/lib/mint-sign-send.ts` — reads configured signer only after approval, signs once, broadcasts once.
- `scripts/lib/mint-evidence.ts` — public repair record/reconciliation.
- focused tests under `tests/integration/` or `tests/unit/`.

The harness must:

1. lock exact devnet genesis and deployed program/config;
2. generate one mint keypair in memory;
3. build the same `create_token` instruction (`Hermes Proof Token`, `HPT`, empty URI) and exact account order as `buildCreateTokenIx`;
4. add only the allowed heap-frame Compute Budget instruction;
5. obtain blockhash + last-valid height;
6. unsigned-simulate with signature verification disabled and require `err: null` + expected program log;
7. calculate current fee/rent conservative total and reserve;
8. print a public transaction summary and enter `awaiting_approval` without reading signer secret material;
9. stay alive awaiting stdin approval; timeout exits safely without signing.

**Acceptance:** tests prove one candidate, canonical instruction bytes/accounts, no signer read before approval, no secret output, simulation failure abort, and no broadcast during preparation.

### GATE-MINT — Required explicit user approval

Present exactly:

- cluster + genesis;
- creator/fee payer;
- candidate mint;
- program/config/curve/curve ATA;
- token metadata;
- instruction topology;
- latest blockhash validity;
- simulation `err: null` and selected logs;
- network fee, rent components, conservative total debit, current balance, expected reserve;
- statement: one wallet signing event, one broadcast attempt, no transfer/trade/migration, real devnet mutation.

Wait for explicit confirmation in chat. A generic earlier “continue” does not approve an unseen candidate. Only confirmation after this exact summary unlocks the waiting process.

### WU-5 — Sign once, broadcast once, confirm or reconcile

After approval only:

- Re-check genesis and blockhash validity.
- Read local configured signer in process without logging it; assert its public key equals approved creator.
- Apply mint signature + CLI payer signature once to the already prepared transaction.
- Broadcast serialized transaction once with preflight enabled.
- Capture public signature immediately; persist public reconciliation evidence atomically.
- Confirm with `{signature, blockhash, lastValidBlockHeight}`.
- On timeout/transport ambiguity, enter `reconcile_only`: query signature status/transaction/account state. Never resend.
- Require confirmed transaction topology to match approved bytes and exactly one successful `create_token`.

**Acceptance:** one broadcast attempt; `meta.err = null`; public signature/slot/Explorer devnet URL captured; ambiguity never causes retry.

### WU-6 — Verify postconditions and index through Worker

- Verify mint owner = SPL Token; decimals/supply/mint authority/freeze authority match the program contract.
- Verify curve PDA owner/discriminator, creator, mint, reserves, metadata, and curve ATA mint/owner/balance.
- POST exact approved payload to `/api/tokens/index` once. Retry is allowed only for the exact captured mint/signature/creator/metadata after read-only reconciliation.
- Require `201` or same-payload idempotent response with `provenance: "onchain"` and non-null decoded curve state.
- Verify public list/detail and remote D1 read-only: total on-chain baseline `0 → 1`, exactly one row for mint, no conflicting duplicate.

**Acceptance:** chain + Worker + API + D1 agree; no direct D1 writes; index failure remains honestly `confirmed_onchain_index_pending` until repaired through the same endpoint.

### WU-7 — Documentation, exact-SHA closure, immutable evidence

- Update `README.md`, `DEPLOY.md`, `INVENTORY.md`, and handoff/release notes with only evidence already known before the docs commit: mint, signature, slot, Explorer link, Worker/D1 verification, explicit devnet/no-Raydium boundary.
- Commit path-scoped docs and push once.
- Trigger CI and both deployment paths for the docs commit; require exact final SHA.
- Store post-commit final-SHA deployment IDs, probes, and CI results in an immutable GitHub Actions run summary/artifact or release artifact. Do not create a follow-up docs commit, avoiding a SHA evidence cycle.
- Add a concise Obsidian closure note linking existing Hermes Launchpad notes only after all live verification passes.
- Run `/self-reflect`; preserve lessons without secrets.

**Acceptance:** final SHA green/deployed/probed; immutable external closure artifact exists; docs truthful; no subsequent commit required.

## Files likely to change

- `workers/chain.js`
- `workers/worker.js`
- `src/lib/solana.ts` only if canonical-builder export/extraction is required
- `scripts/cli-mint.ts`
- `scripts/lib/mint-prepare.ts`
- `scripts/lib/mint-sign-send.ts`
- `scripts/lib/mint-evidence.ts`
- focused tests under `tests/unit/`, `tests/worker/`, `tests/integration/`
- `README.md`, `DEPLOY.md`, `INVENTORY.md`, release/handoff docs
- immutable external closure evidence and one Obsidian closure note after verification

After approval, this reviewed plan revision is immutable: execution must not edit, stage, or commit it. Path-stage only explicitly enumerated implementation, test, evidence, and documentation files.

No program redeploy, SDK migration, schema redesign, direct D1 write script, trade, Raydium work, or unrelated cleanup.

## Tests / validation

### Local predeploy

- `npm run lint`
- `npm run build`
- `npm run test:unit`
- `npm run test:worker`
- `npm run test:client`
- `npm run test:integration`
- `npm run test:security`
- coverage command required by `.coverage-thresholds.json`
- `cd programs/hermes-curve && cargo test`
- Worker dry-run/binding validation

### Transaction

- exact devnet genesis twice (prepare + pre-send)
- canonical instruction byte/account parity test
- unsigned `simulateTransaction` success before approval
- fee/rent/reserve calculation from current RPC
- exactly one signature event + one broadcast attempt
- blockhash-aware confirmation or `reconcile_only`
- confirmed transaction `meta.err: null` and exact instruction topology

### Chain/index

- mint, curve, ATA owner/discriminator/metadata/authority/supply checks
- hardened Worker negative tests
- `POST /api/tokens/index` verified result
- list/detail `provenance: onchain`
- D1 baseline `0 → 1`, exactly one mint row

### Release

- exact-SHA CI green
- both deployments converge on final SHA
- live Pages/Worker/API probes
- immutable closure artifact
- no tracked secret/keypair/raw transaction material

## Risks / tradeoffs / open questions

- **Local key custody:** autonomous CLI execution necessarily reads the existing local signer after approval. Mitigation: process-local read only, public-key assertion, no output/persistence of secret bytes, devnet genesis lock.
- **Long-lived approval process:** preserving one in-memory mint requires the harness to remain alive. If it exits pre-sign, abort; never claim the candidate minted. A new candidate requires a new summary and approval.
- **RPC drift/rate limits:** a stale blockhash before approval requires re-preparation and a new summary; after broadcast, only reconcile—never resend.
- **Rent estimate:** account sizes must come from actual program/token layouts and current RPC rent exemptions. A conservative bound is shown; actual debit is verified post-confirmation.
- **Current 17.71 SOL balance:** likely sufficient for account rent/fees, but execution is blocked unless the calculated bound plus reserve passes.
- **Existing dirty tree:** explicit path staging is mandatory. Unrelated plugin/state files and `skills-lock.json` remain untouched.
- **CLI transport versus product UX:** CLI removes the browser-wallet blocker for this proof. Browser lifecycle hardening remains a separate follow-up and is not modified here.
- **No program redeploy:** expected path is client/Worker hardening only. If program contract validation contradicts assumptions, stop and amend; do not redeploy silently.

## Definition of done

- [ ] Hardened Worker provenance and canonical-builder regression changes pass TDD, CI, and exact-SHA deploy before mint preparation.
- [ ] One in-memory HPT candidate is unsigned-simulated successfully on exact devnet.
- [ ] User sees exact candidate/fee/rent/topology summary and explicitly approves immediately before signing.
- [ ] Existing local devnet signer signs once; transaction broadcasts once.
- [ ] One confirmed successful Hermes `create_token` exists for the approved mint.
- [ ] Mint/curve/ATA postconditions pass.
- [ ] Worker independently verifies and indexes via endpoint; D1 on-chain count changes `0 → 1` exactly once.
- [ ] Public API list/detail show `provenance: onchain`.
- [ ] Docs, exact-SHA CI/deploy, immutable closure artifact, Obsidian handoff, and self-reflect complete.
- [ ] No mainnet, trade, Raydium, direct D1 write, secret exposure, or unrelated file mutation occurred.

## Plan-review gate

Revision 2 incorporates SCOPE-1 and ALIGN-1: browser/UI remediation removed; the approved plan becomes immutable and excluded from execution staging. Fresh independent Feasibility, Completeness, and Scope & Alignment review is pending on this frozen revision.
