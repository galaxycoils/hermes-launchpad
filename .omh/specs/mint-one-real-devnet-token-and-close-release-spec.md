---
status: confirmed
instance_id: mint-one-real-devnet-token-and-close-release
source_plan: .hermes/plans/2026-08-12_111414-mint-one-devnet-token.md
---

# Mint One Real Devnet Token and Close Release

## Objective
Create exactly one `Hermes Proof Token` (`HPT`) through Hermes Launchpad on Solana devnet, cryptographically verify create/index/provenance, then close release with tests, exact-CI evidence, and truthful docs.

## Constraints
- Devnet only; no mainnet and no Raydium migration.
- Exactly one fresh mint. No silent retry/new mint.
- Simulate before send.
- Before on-chain send, show transaction summary and obtain explicit user confirmation.
- Wallet/provider signs; never expose or persist private key/seed.
- Worker verified `/api/tokens/index` only; no direct D1 writes.
- Preserve unrelated/untracked files.

## Acceptance
- Confirmed devnet signature with mint, creator, slot, Explorer URL.
- Worker and D1 expose exactly one matching `provenance: onchain` token.
- Public list/detail expose real curve state.
- Full local gates and exact latest CI pass.
- README, DEPLOY, INVENTORY contain verified evidence without overclaim.
- Self-reflect complete.
