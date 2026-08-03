# Deploying the Bonding Curve to Devnet

The program builds reproducibly with `cargo build-sbf` (compile-verified).
Deploy from any machine with Solana CLI installed (devnet SOL is free via airdrop).

## Program

- **Program ID:** `E99nGQh6iCAC43azp4zvpefCRmfY9bZHV7J6LL2yu93U`
- **Cluster:** devnet
- **Curve:** constant-product with virtual reserves (30 SOL / 1.073B tokens virtual)
- **Supply:** 1B tokens (6 decimals), fully minted to the curve PDA at creation
- **Fees:** 0.25% platform + 0.25% creator (on-chain); referral/burn in V2
- **Migration:** auto-locks at threshold (default 85 SOL raised); migration
  authority sweeps reserves via `migrate` — Raydium CPI lands in V2

## One-time setup

```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
solana config set --url devnet
solana-keygen new --no-bip39-passphrase   # if you don't have a wallet
solana airdrop 2
```

## Build & deploy

```bash
cd programs/hermes-curve
cargo build-sbf --manifest-path programs/hermes-curve/Cargo.toml

# The program keypair MUST match declare_id! in src/lib.rs.
# Generate one and update declare_id! + Anchor.toml to match, then:
solana-keygen new --no-bip39-passphrase -o deploy/hermes-curve-keypair.json
solana program deploy \
  target/deploy/hermes_curve.so \
  --program-id deploy/hermes-curve-keypair.json \
  --url devnet
```

## Test locally (no deploy needed)

```bash
yarn install
anchor test   # spins up a local validator, runs tests/hermes-curve.ts
```

Tests cover: config init, token creation, buy (reserve updates), sell,
and slippage enforcement.
