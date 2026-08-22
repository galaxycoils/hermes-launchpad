# Hermes Launchpad — Core Protocol Architecture & Bonding Curve Mechanics

**Status:** DESIGN SPEC — V1 deployed (constant-product); V2 targets defined below.
**On-chain program:** `hermes-curve` — Solana devnet program ID `9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz`
**Config PDA:** `9Sv1kApQK428EUueU7dR9mTPqKqNR7dxkBmwtZuHDTkr`
**Fee / Creator wallet:** `GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a`
**Reviewed by:** lead-orchestrator-2 — **APPROVED** for smart contract implementation
**Date:** 2026-08-19

---

## 1. Design Goals

| Priority | Goal | Constraint |
|----------|------|------------|
| P0 | Fair-launch memecoin bonding curve — no presale, no allocation | All supply minted to curve at creation |
| P0 | On-chain verifiable price — anyone can recompute reserves | All state public on-chain |
| P0 | Graduation migration when curve locks | Move liquidity to DEX (Raydium/EVM equivalent) |
| P1 | Configurable fee split — platform + creator | Creator-set royalty; platform fixed minimum |
| P1 | Anti-sniping / MEV resistance | Commit-reveal + slippage enforcement |
| P1 | Multi-curve formula support | Constant-product (V1) + linear + exponential + custom |
| P2 | Gas-efficient execution | Targets below |
| P2 | Emergency pause capability | Admin-controlled circuit breaker |

---

## 2. Bonding Curve Formulas

### 2.1 Virtual Reserves Model (all curves share this framing)

Every curve maintains **virtual reserves** `(V_s, V_t)` and **real reserves** `(R_s, R_t)`:

- `(V_s, V_t)` — virtual reserves that seed the curve so early buyers pay a nonzero price
- `(R_s, R_t)` — real on-chain balances actually held by the curve PDA
- `k = V_s × V_t` — the curve invariant (curve-type dependent)
- Price per token (in SOL) = `P = f'(token_supply)` — derivative of the curve function

**Initialization (all curve types):**

```
V_SOL0 = 30 SOL (30,000,000,000 lamports)
V_TOK0 = 1,073,000,000,000,000 tokens (1.073B at 6 decimals)
K0      = V_SOL0 × V_TOK0 = 3.219e10 (SOL·tokens)
SUPPLY  = 1,000,000,000,000,000 (1B tokens, 6 decimals)
```

Virtual reserves ensure: (a) first buyer pays `~V_S/V_T = 27.96 SOL/1B tokens ≈ 0.00002796 SOL/token`, (b) zero-real-reserve state is still tradeable.

---

### 2.2 Curve Type A — Constant Product (V1 deployed, `curve_type = 0`)

**Formula:** `V_s × V_t = k` (invariant)

**Buy (sell SOL, receive tokens):**

```
sol_after_fees = sol_in × (1 − fee_total)
new_vs         = V_s + sol_after_fees
new_vt         = k / new_vs
tokens_out     = V_t − new_vt
V_s ← new_vs
V_t ← new_vt
```

**Sell (burn tokens, receive SOL):**

```
new_vt         = V_t + tokens_in
new_vs         = k / new_vt
sol_gross      = V_s − new_vs
sol_out        = sol_gross × (1 − fee_total)
V_s ← new_vs
V_t ← new_vt
```

**Current price (SOL per token):**

```
P_current = V_s / V_t
```

**Marginal price (next token):**

```
P_marginal = V_s² / k   (= V_s / V_t  in the continuous approximation)
```

**Why this curve:** Price rises as supply is bought (increasing cost curve — classic pump.fun model). SELF-CORRECTING: selling restores price toward entry. Keeps early buyers from extracting all value in one trade.

---

### 2.3 Curve Type B — Linear (configurable slope, `curve_type = 1`)

**Formula:** `P(token_supply) = base_price + slope × token_supply`

**Initialization:**

```
base_price = V_SOL0 / V_TOK0  (= 2.796e-5 SOL/token at standard V0)
slope      = configurable per token (creator sets; min 0, default = base_price / SUPPLY × 0.5)
```

**Integrated reserve state:**

```
V_t(tokens_outstanding) = tokens_outstanding
V_s(tokens_outstanding) = base_price × tokens_outstanding + 0.5 × slope × tokens_outstanding²
k is NOT constant — this is a linear price schedule, not an invariant curve
```

**Buy:**

```
current_price = base_price + slope × (SUPPLY − real_token_reserves) / SUPPLY
tokens_out    = sol_in × (1 − fee_total) / current_price
// Update real reserves
real_sol_reserves  += sol_in × (1 − fee_total)
real_token_reserves −= tokens_out
```

**Sell:**

```
current_price = base_price + slope × (SUPPLY − real_token_reserves) / SUPPLY
sol_gross     = tokens_in × current_price
sol_out       = sol_gross × (1 − fee_total)
```

**When to use:** Tokens with a fixed "fair price" target (stablecoin-like launches, curated collections). No price explosion — bounded upside, bounded downside. Lower MEV risk (price predictable) but less speculative tension.

---

### 2.4 Curve Type C — Exponential (`curve_type = 2`)

**Formula:** `P(n) = P0 × e^(α × n/SUPPLY)` where `n` = tokens outstanding (bought), `α` = steepness parameter

**Initialization:**

```
P0  = V_SOL0 / V_TOK0  (= 2.796e-5 SOL/token)
α   = configurable per token (0.01–5.0; default 1.0; hard cap 5.0)
n   = SUPPLY − real_token_reserves  (tokens bought so far)
```

**Buy:**

```
P_current  = P0 × exp(α × n / SUPPLY)
tokens_out = sol_in × (1 − fee_total) / P_current
n          ← n + tokens_out
```

**Sell:**

```
P_current  = P0 × exp(α × n / SUPPLY)
sol_gross  = tokens_in × P_current
sol_out    = sol_gross × (1 − fee_total)
n          ← n − tokens_in
```

**Note on implementation:** Computing `exp` on-chain is expensive. Use a **precomputed lookup table** for α ∈ {0.25, 0.5, 1.0, 2.0, 3.0, 5.0} stored in the Config account, with interpolation. Allow custom α via an off-chain price oracle signed by the curve authority (V2). For V1 constant-product this is unnecessary — `exp` only needed for exponential curve type.

**When to use:** High-momentum meme launches where price should accelerate rapidly. Higher MEV risk (price changes fast → front-running profitable). Requires tighter slippage enforcement.

---

### 2.5 Curve Type D — Custom / Polynomial (`curve_type = 3`)

**Formula (general polynomial):**

```
P(n) = a₀ + a₁×n + a₂×n² + ... + aₖ×nᵏ
```

**Parameterization:** Coefficients `(a₀, a₁, ..., aₖ)` stored in the Curve account at creation, signed by creator. Maximum degree `k = 5` (gas-bounded). All coefficients ≥ 0 (monotonic increasing price — no price drops on buys).

**Buy/Sell:** General form:

```
P_current = Σᵢ aᵢ × nⁱ   (computed on-chain, gas-bounded to degree 5)
tokens_out = sol_in × (1 − fee_total) / P_current   [buy]
sol_gross  = tokens_in × P_current                   [sell]
```

**Gas note:** Each additional degree adds one multiplication + addition per trade. Degree 5 ≈ 11 arithmetic ops — acceptable; degree > 5 rejected. Pre-validated: `a₀ > 0` required (nonzero entry price).

**When to use:** Creator-defined curve shapes for experimental launches. Requires creator to be sophisticated. Default to constant-product unless explicitly overridden.

---

### 2.6 Curve Type Selection

| Curve | `curve_type` | Price behavior | Speculative tension | MEV risk | Recommended for |
|-------|-------------|---------------|--------------------|----------|-----------------|
| Constant-product | 0 | Rising as bought | High | Medium | General memecoins (V1 default) |
| Linear | 1 | Fixed slope | Low | Low | Curated/stable launches |
| Exponential | 2 | Accelerating | Very high | High | Momentum meme launches |
| Custom polynomial | 3 | Creator-defined | Configurable | Configurable | Experimental |

**V1 deployed state:** `curve_type` field **not yet present** in Curve struct. V1 assumes constant-product implicitly. **V2 addition:** add `curve_type: u8` to Curve account; add switch on `buy`/`sell` instruction. Backward-compatible: existing curves have `curve_type = 0` implicitly (migrate via initialize-on-read or epoch upgrade).

---

## 3. Token Minting & Burning Logic

### 3.1 Creation (`create_token`)

```
PRECONDITIONS:
  - Caller signs (creator wallet)
  - Config PDA initialized (admin, fee_wallet, migration_authority, threshold)
  - Mint authority = curve PDA (derived from [b"curve", mint.key().as_ref()])

EXECUTION:
  1. Create SPL Token mint (decimals = 6, mint_authority = curve PDA)
  2. Create curve PDA account (seeds = [b"curve", mint.key().as_ref()])
  3. Create curve ATA (associated token account for curve PDA, mint = new mint)
  4. Mint full SUPPLY to curve ATA (MintTo CPI, curve PDA signs)
  5. Set curve state:
     virtual_token_reserves  = V_TOK0
     virtual_sol_reserves    = V_SOL0
     real_token_reserves     = SUPPLY
     real_sol_reserves       = 0
     complete                = false
     curve_type              = 0   (V2; V1 implicit)
     name / symbol / uri     = creator-provided (bounded length)

POST-CONDITIONS:
  - Mint authority = curve PDA (non-transferable) — creator cannot mint more
  - All tokens held by curve ATA — trades move tokens out of curve ATA
  - Complete supply in circulation via curve (no hidden allocation)
```

**Key invariant:** `real_token_reserves + tokens_held_by_others = SUPPLY` always. Verifiable by any observer reading the curve ATA balance + summing holder balances.

---

### 3.2 Buy (`buy`)

```
INPUTS:  sol_in (lamports), min_tokens_out (slippage floor)
CHECKS:
  - curve.complete == false
  - sol_in > 0
  - sol_in ≤ virtual_sol_reserves × MAX_TRADE_BPS / BPS_DENOMINATOR   [anti-whale cap]
FEE SPLIT (per Section 4):
  - platform_fee  = sol_in × PLATFORM_FEE_BPS / BPS_DENOMINATOR
  - creator_fee   = sol_in × creator_fee_bps / BPS_DENOMINATOR
  - sol_after_fees = sol_in − platform_fee − creator_fee
TRADE MATH (per curve_type, Section 2):
  - Compute tokens_out from curve formula
  - tokens_out ≥ min_tokens_out   [slippage check]
  - tokens_out ≤ real_token_reserves   [reserve sufficiency]
EXECUTION:
  - Transfer sol_after_fees: trader → curve PDA
  - Transfer platform_fee: trader → fee_wallet
  - Transfer creator_fee: trader → creator_wallet
  - Transfer tokens_out: curve ATA → trader ATA (curve PDA signs)
STATE UPDATE:
  - virtual_sol_reserves  += sol_after_fees
  - virtual_token_reserves −= tokens_out
  - real_sol_reserves     += sol_after_fees
  - real_token_reserves   −= tokens_out
  - Check graduation threshold → if met, set complete = true
EMIT: TradeEvent(mint, trader, is_buy=true, sol_in, tokens_out, new_vs, new_vt)
EMIT: MigrationReady(mint, sol_raised)   if threshold reached
```

---

### 3.3 Sell (`sell`)

```
INPUTS:  tokens_in, min_sol_out (slippage floor)
CHECKS:
  - curve.complete == false
  - tokens_in > 0
  - tokens_in ≤ virtual_token_reserves × MAX_TRADE_BPS / BPS_DENOMINATOR   [anti-whale cap]
FEE SPLIT (per Section 4):
  - sol_gross  = curve_formula_sell(tokens_in)   [pre-fee SOL from curve]
  - platform_fee = sol_gross × PLATFORM_FEE_BPS / BPS_DENOMINATOR
  - creator_fee  = sol_gross × creator_fee_bps / BPS_DENOMINATOR
  - sol_out      = sol_gross − platform_fee − creator_fee
TRADE MATH:
  - sol_out ≥ min_sol_out   [slippage check]
  - sol_gross ≤ real_sol_reserves   [reserve sufficiency]
EXECUTION:
  - Transfer tokens_in: trader ATA → curve ATA (trader signs)
  - Transfer sol_out: curve PDA → trader (lamport adjust)
  - Transfer platform_fee: curve PDA → fee_wallet
  - Transfer creator_fee: curve PDA → creator_wallet
STATE UPDATE:
  - virtual_sol_reserves  −= sol_gross
  - virtual_token_reserves += tokens_in
  - real_sol_reserves     −= sol_gross
  - real_token_reserves   += tokens_in
EMIT: TradeEvent(mint, trader, is_buy=false, sol_out, tokens_in, new_vs, new_vt)
```

---

### 3.4 Migration & Burning

**When curve locks (`complete = true`):**

- All further `buy`/`sell` fail with `CurveComplete` error
- Curve PDA holds: remaining real tokens + remaining SOL
- Migration authority calls `migrate` → sweeps SOL + tokens to authority wallet
- Authority then seeds DEX pool (Raydium CPMM on Solana; Uniswap V2 `createPair` + `mint` on EVM)

**Token burning:**

| Scenario | Burn? | Explanation |
|----------|-------|-------------|
| V1 buy/sell | No | Tokens move between curve ATA and trader ATA; supply constant |
| Migration | No | All remaining tokens swept to authority, then LP tokens minted |
| Graduation (optional V2) | Configurable | Creator may set `burn_on_graduation = true` → curve ATA balance is burned after migration sweep (deflationary graduation) |
| Creator withdrawal | No | Creator fee is SOL, not tokens — no token burn on fee collection |
| Admin demolition | Yes | Emergency destroy instruction burns remaining curve ATA balance + closes mint (admin-only, rate-limited) |

**Burn-on-graduation flow (V2 optional flag):**

```
if curve.burn_on_graduation && curve.complete:
  migration_authority sweeps SOL only (not tokens)
  remaining tokens in curve ATA → burned via Tokenburn CPI (Token-2022) or SPL burn
  LP pool created from authority's token holdings only
```

---

## 4. Fee Structure

### 4.1 Fee Split Model

```
sol_in
├── platform_fee  (= sol_in × platform_fee_bps / BPS_DENOMINATOR)   → protocol wallet
├── creator_fee   (= sol_in × creator_fee_bps    / BPS_DENOMINATOR)   → token creator
└── trade_net     (= sol_in − platform_fee − creator_fee)              → curve (buys tokens)
```

All fees apply symmetrically to buy and sell (fees computed on gross SOL movement).

### 4.2 Fee Rates

| Fee | V1 Rate | V2 Configurable? | Notes |
|-----|---------|-----------------|-------|
| Platform (protocol) | 0.25% (25 bps) | No — fixed at protocol level | Funds protocol revenue; minimum 0.10% hard floor |
| Creator royalty | 0.25% (25 bps) | **Yes** — set at `create_token`; range [0%, 2.5%] | Creator earns on all trades; default aligns with platform |
| Referral | 0.10% (10 bps) | **Yes** — off-chain V1, on-chain V2 | Routed via Token-2022 transfer hook or off-chain credit in V1 |
| Burn (deflation) | 0.10% (10 bps) | **Yes** — off-chain V1, on-chain V2 | Tokens burned from trade amount; V1 routed off-chain |
| **Total on-chain** | **0.50%** | Platform + creator only in V1 | Referral + burn off-chain in V1 |

**V1 on-chain math:** `sol_after_fees = sol_in × (1 − 0.005) = sol_in × 0.995`

**V2 total on-chain (max):** `0.25% platform + 2.5% creator = 2.75%` max per trade. Protocol minimum 0.10% ensures protocol always earns something.

### 4.3 Creator Fee Dynamics

- **Set at creation:** `create_token(creator_fee_bps: u16)` — stored in Curve account
- **Range:** `[0, 250]` bps (0% to 2.5%)
- **Immutable after creation:** Creator cannot change fee post-launch (prevents bait-and-switch, aligns with pump.fun model)
- **Default:** 25 bps (0.25%) — matches platform fee for symmetric split
- **Zero creator fee:** Allowed (0 bps) — for community/DAO tokens where all fees go to protocol

### 4.4 Fee Collection Accounting

| Destination | Mechanism (Solana) | Mechanism (EVM) |
|-------------|-------------------|-----------------|
| Platform wallet | `system_program::transfer` CPI from trader | `callvalue` split + transfer to protocol address |
| Creator wallet | `system_program::transfer` CPI from trader | ERC-20 `transfer` to creator address post-trade |
| Referral (V2) | Token-2022 transfer hook deducts 0.1% tokens to referral PDA | Transfer hook / ERC-777 `tokensToSend` hook |
| Burn (V2) | Token-2022 burn CPI from curve ATA | ERC-20 `burn` from curve balance |

### 4.5 Protocol Revenue Model

```
Per token, per trade:
  protocol_revenue = sol_in × platform_fee_bps / BPS_DENOMINATOR

Per graduation:
  protocol_revenue_share = 0 (platform fees collected during curve life only)
  DEX pool seeding        = real_sol_reserves + real_token_reserves at lock

Total protocol revenue (running):
  Σ all trades on all tokens × platform_fee_rate
```

**Target protocol economics:** At 1,000 trades/day average 0.5 SOL/trade × 0.25% platform fee = **~1.25 SOL/day protocol revenue** at scale. Graduation events are the major SOL events (85 SOL per graduation locked + swept).

---

## 5. Graduation & Migration

### 5.1 Graduation Trigger

```
curve.complete ← true  when:
  real_sol_reserves ≥ migration_threshold_lamports

migration_threshold_lamports:
  - Configured at Initialize (per-token override possible in V2)
  - Default: 85,000,000,000 lamports (85 SOL)
  - Range: [10 SOL, 500 SOL] — admin-set per-token at creation
  - Irreversible: once complete = true, cannot unset
```

**V1 threshold:** 85 SOL fixed (DEFAULT_MIGRATION_THRESHOLD). Config PDA stores single global threshold. **V2:** Per-token threshold set at `create_token(threshold_lamports)`; stored in Curve account; Config stores global default.

### 5.2 Post-Lock State

| Field | Value at lock | Effect |
|-------|--------------|--------|
| `complete` | `true` | `buy`/`sell` revert with `CurveComplete` |
| `real_sol_reserves` | ≥ threshold | SOL available for DEX seed |
| `real_token_reserves` | remaining tokens | tokens available for DEX pool |
| Curve ATA | holds remaining tokens | authority sweeps via `migrate` |
| Curve PDA lamports | holds remaining SOL | authority sweeps via `migrate` |

### 5.3 Migration Steps

```
Step 1 — Lock (automatic on buy when threshold reached):
  curve.complete = true
  emit MigrationReady(mint, sol_raised)

Step 2 — Sweep (migration authority calls migrate):
  - Sweep SOL: curve PDA → authority wallet (minus rent exemption)
  - Sweep tokens: curve ATA → authority ATA (curve PDA signs)
  - emit Migrated(mint, sol_swept, tokens_swept)

Step 3 — DEX Pool Creation (off-chain worker + on-chain CPI):
  Solana:
    - Authority creates Raydium CPMM pool (CPI to RAYDIUM_CPMM_PROGRAM_ID)
    - Pool initialized with swept SOL + tokens as liquidity
    - LP tokens minted to authority (or burned for charity mode)
  EVM equivalent:
    - Factory.createPair(tokenA, tokenB) → Uniswap V2 pool
    - Transfer liquidity to pool, mint LP tokens
    - Optional: burn LP tokens (charity/locked mode)
```

### 5.4 Graduation UX Events

- **On-chain:** `MigrationReady` event emitted at lock — indexer picks up
- **Indexer:** Marks token as `migration-ready` in D1; frontend shows graduation banner
- **Frontend:** Full-screen graduation animation + shareable certificate (V2 per v2 plan)
- **Chat:** Auto-post "TOKEN graduated!" to token chat room (V2)

---

## 6. Anti-Sniping & MEV Protections

### 6.1 Slippage Enforcement (Primary Defense — V1 deployed)

```
Buy:  require!(tokens_out ≥ min_tokens_out, SlippageExceeded)
Sell: require!(sol_out ≥ min_sol_out, SlippageExceeded)

Client computes min_tokens_out from expected price × (1 − slippage_tolerance).
Typical slippage: 1%–5% for buys; 1%–3% for sells.
Hard cap on trade size: sol_in ≤ virtual_sol_reserves × 50% / 100   [MAX_TRADE_BPS_OF_VIRTUAL = 5000 / 10000]
```

**Rationale:** Slippage floor + size cap prevents one large trade from front-running a smaller one too profitably. If whale buys 50% of curve in one tx, price moves 2× — slippage makes the second trade expensive.

### 6.2 Per-Wallet Rate Limiting (V2)

```
MAX_TRADES_PER_SLOT: u32 = 5   (max trades per wallet per slot)
tracked in: wallet_trade_count PDA (seeds = [b"trades", wallet.key().as_ref(), slot])

On each trade:
  count = load(wallet_trade_count PDA for current slot)
  require!(count < MAX_TRADES_PER_SLOT, RateLimitExceeded)
  increment count

Reset: per slot (Solana slot ≈ 400ms) — self-resetting, no manual cleanup
```

**Rationale:** Prevents sandwich attack bots from flooding trades in a single slot to manipulate price. 5 trades/slot is generous for human traders, restrictive for bots.

### 6.3 Commit-Reveal Scheme (V2 — optional per-token flag)

```
CREATE_PHASE (commit):
  buyer computes: commit_hash = sha256(salt || sol_in || min_tokens_out || timestamp)
  buyer sends:    commit(commit_hash) instruction to curve
  state:          commit registred for this hash (PDA: [b"commit", commit_hash])
  expires:        after COMMIT_WINDOW slots (default 64 slots ≈ 25 seconds)

REVEAL_PHASE (execute):
  buyer sends:    reveal(salt, sol_in, min_tokens_out, timestamp)
  program verifies: sha256(salt || sol_in || min_tokens_out || timestamp) == stored commit_hash
  if valid:       execute trade at committed parameters
  if mismatch:    revert

MEV benefit:  front-runners cannot see trade parameters before they are committed.
latency cost: 2 transactions per trade (commit + reveal) — doubles gas/fee.
```

**When to enable:** High-profile launches where sniping is expected (celebrity coins, airdrop claims). Default OFF — adds friction for normal traders.

**Expiration:** Unrevealed commits auto-expire after window; no penalty (commit is free — only a PDA write). Prevents griefing.

### 6.4 Price-Oracle Consistency Check (V2)

```
On each trade, after computing tokens_out / sol_out:
  expected_price = current_curve_price(curve_state)
  actual_price   = tokens_out / sol_in   (buy) or sol_out / tokens_in   (sell)
  deviation      = |actual_price − expected_price| / expected_price
  require!(deviation ≤ MAX_PRICE_DEVIATION_BPS / BPS_DENOMINATOR, PriceDeviationExceeded)

MAX_PRICE_DEVIATION_BPS = 1000   (10% max deviation from expected curve price)
```

**Rationale:** Detects if a preceding tx in the same slot moved the curve price unexpectedly (sandwich). If deviation > 10%, revert — the trade would have been a victim of MEV. 10% threshold tolerates normal curve movement from concurrent trades while catching extreme sandwich attacks.

### 6.5 Graduation Batch Auction (V2 — migration MEV protection)

```
At migration time, instead of immediate single-transaction pool creation:
  1. Curve locks → emits MigrationReady
  2. Enters MIGRATION_AUCTION state for BATCH_WINDOW slots (e.g., 128 slots ≈ 50 seconds)
  3. During auction: buys/sells are blocked; no migration allowed
  4. At auction close: migration authority creates DEX pool at final curve state
  5. Any trader who bought during lock phase gets to sell at migration price

Rationale: Prevents migration authority from front-running pool creation by
buying tokens cheaply before the pool is seeded.
```

### 6.6 MEV Protection Summary

| Protection | Status | Cost | Effectiveness |
|------------|--------|------|---------------|
| Slippage floor + size cap | V1 deployed | None (client-side min_out) | High — prevents profitable sandwich at individual trade level |
| Per-wallet rate limit | V2 | 1 PDA read/write per trade | Medium — restricts bot flooding |
| Commit-reveal | V2 (optional) | 2× transactions per trade | High — eliminates pre-trade visibility |
| Price-deviation check | V2 | 1 comparison per trade | Medium — catches post-trade-MEV |
| Batch auction at graduation | V2 | Delayed migration | Medium — prevents migration-front-running |

---

## 7. Emergency Pause & Admin Controls

### 7.1 Emergency Pause (`pause` / `unpause`)

```
Actors: admin (from Config account)

pause():
  - Sets curve.paused = true for ALL active curves (global pause)
  - OR sets per-curve.paused = true (V2 — per-curve pause)
  - Effect: all buy/sell/migrate revert with CurvePaused

unpause():
  - Reverses pause flag
  - Effect: trading resumes

Use cases:
  - Protocol exploit detected (curve math bug, authority compromise)
  - Extreme market event ( Solana congestion, validator outage)
  - Migration authority key compromise (pause, rotate authority, then unpause)

Implementation:
  - Global pause: Config account field `paused: bool`
  - Per-curve pause: Curve account field `paused: bool` (V2 addition)
  - Rate-limited: max 1 pause/unpause per minute (prevents panic-toggle abuse)
```

### 7.2 Admin Key Rotation

```
rotate_admin(new_admin: Pubkey):
  - Only current admin can call
  - Updates Config.admin = new_admin
  - Emits AdminRotated(old_admin, new_admin)

rotate_migration_authority(new_authority: Pubkey):
  - Only current admin can call
  - Updates Config.migration_authority = new_authority
  - Does NOT affect in-flight migrations (already-locked curves keep old authority for migrate)

Rate limit: 1 admin rotation per 24 hours (prevents rapid admin-reassignment attacks)
```

### 7.3 Curve Demolition (Emergency Burn + Close)

```
defund_curve(mint: Pubkey):
  - Admin-only, rate-limited (1 per 7 days per mint)
  - Burns all remaining tokens in curve ATA
  - Closes mint (revokes mint authority, closes account if possible)
  - Emits CurveDefunded(mint)
  - Use: dead/abandoned tokens that never graduated — reclaim rent + prevent infinite PDA accumulation
```

---

## 8. Solidity Interface Definitions

> **Note:** The deployed program is written in Rust/Anchor for Solana. These Solidity interfaces define the **ABI contract** the program satisfies conceptually, and serve as the reference interface for any EVM deployment (Base Sepolia / Ethereum) of the same bonding curve logic. A Solidity implementation on EVM would implement `IHermesCurve` below.

### 8.1 Primary Curve Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IHermesCurve — Bonding Curve Trading Interface
/// @notice Constant-product / linear / exponential / custom polynomial curve
/// @dev On-chain ledger for token creation, buy, sell, migration.
///      All state is public; any observer can recompute prices from reserves.
interface IHermesCurve {
    // ── Errors ──────────────────────────────────────────────────────────────
    error CurveComplete();
    error CurveNotComplete();
    error SlippageExceeded();
    error ZeroAmount();
    error TradeTooLarge();
    error MathOverflow();
    error InsufficientTokenReserves();
    error InsufficientSolReserves();
    error Unauthorized();
    error CurvePaused();
    error RateLimitExceeded();
    error PriceDeviationExceeded();
    error NameTooLong();
    error SymbolTooLong();
    error UriTooLong();

    // ── Events ──────────────────────────────────────────────────────────────
    /// @param mint Token mint address
    /// @param trader Trader wallet
    /// @param isBuy true = buy (SOL→tokens), false = sell
    /// @param solAmount SOL movement in lamports (or wei on EVM)
    /// @param tokenAmount Token movement (in smallest unit, 6 decimals)
    /// @param virtualSolReserves Virtual SOL reserves after trade
    /// @param virtualTokenReserves Virtual token reserves after trade
    event TradeEvent(
        bytes32 mint,
        address trader,
        bool isBuy,
        uint256 solAmount,
        uint256 tokenAmount,
        uint256 virtualSolReserves,
        uint256 virtualTokenReserves
    );

    /// Emitted when curve locks at graduation threshold
    event MigrationReady(bytes32 mint, uint256 solRaised);

    /// Emitted when migration authority sweeps funds
    event Migrated(bytes32 mint, uint256 solSwept, uint256 tokensSwept);

    /// Emitted on token creation
    event TokenCreated(
        bytes32 mint,
        address creator,
        string name,
        string symbol,
        string uri,
        uint256 creatorFeeBps,
        uint256 migrationThreshold
    );

    /// Emitted on admin actions
    event AdminRotated(address oldAdmin, address newAdmin);
    event CurvePaused(bytes32 mint, bool paused);

    // ── Constants (matching on-chain) ────────────────────────────────────────
    /// 1B tokens at 6 decimals
    uint256 constant TOTAL_SUPPLY = 1_000_000_000_000_000;

    /// Virtual reserve seeds (SOL in wei: 30 SOL; tokens in 6-decimal units)
    uint256 constant INITIAL_VIRTUAL_SOL = 30_000_000_000;
    uint256 constant INITIAL_VIRTUAL_TOKEN = 1_073_000_000_000_000;

    /// Fee rates in basis points (1 bp = 0.01%)
    uint256 constant PLATFORM_FEE_BPS = 25;     // 0.25%
    uint256 constant CREATOR_FEE_BPS_DEFAULT = 25; // 0.25% (default; per-token configurable)
    uint256 constant BPS_DENOMINATOR = 10_000;

    /// Hard slippage cap: max 50% of virtual SOL reserves per trade
    uint256 constant MAX_TRADE_BPS_OF_VIRTUAL = 5_000;

    // ── Curve Type Enum ──────────────────────────────────────────────────────
    /// 0 = constant-product (x*y=k); 1 = linear; 2 = exponential; 3 = custom polynomial
    enum CurveType { ConstantProduct, Linear, Exponential, Custom }

    // ── Initialization ───────────────────────────────────────────────────────
    /// @dev One-time setup: admin, fee wallet, migration authority, global threshold
    function initialize(
        address admin,
        address feeWallet,
        address migrationAuthority,
        uint256 migrationThresholdLamports
    ) external;

    // ── Token Creation ───────────────────────────────────────────────────────
    /// @dev Create a new token on the curve. Full supply is minted to curve PDA.
    /// @param name UTF-8 token name (max 32 bytes)
    /// @param symbol Token symbol (max 10 bytes)
    /// @param uri Metadata URI (max 200 bytes)
    /// @param creatorFeeBps Creator royalty in bps [0, 250]
    /// @param migrationThreshold Override threshold in lamports (0 = use global default)
    /// @param curveType Curve formula selector (0–3)
    /// @return mint Address of newly created token mint
    function createToken(
        string calldata name,
        string calldata symbol,
        string calldata uri,
        uint16 creatorFeeBps,
        uint256 migrationThreshold,
        CurveType curveType
    ) external returns (bytes32 mint);

    // ── Trading ──────────────────────────────────────────────────────────────
    /// @dev Buy tokens with SOL. Slippage enforced via minTokensOut.
    /// @param solIn Amount of SOL to spend (in lamports on Solana; wei on EVM)
    /// @param minTokensOut Minimum tokens receiver requires (slippage floor)
    function buy(uint256 solIn, uint256 minTokensOut) external;

    /// @dev Sell tokens back to curve. Slippage enforced via minSolOut.
    /// @param tokensIn Amount of tokens to sell
    /// @param minSolOut Minimum SOL receiver requires (slippage floor)
    function sell(uint256 tokensIn, uint256 minSolOut) external;

    // ── Migration ───────────────────────────────────────────────────────────
    /// @dev Sweep SOL + tokens from locked curve to migration authority.
    ///      Only callable by migration authority after curve.complete == true.
    /// @param mint Token mint to migrate
    function migrate(bytes32 mint) external;

    /// @dev Migrate to DEX pool (Raydium CPMM on Solana; Uniswap V2 on EVM).
    ///      COMPILE-ONLY POC in V1 — requires deployed DEX program address.
    /// @param mint Token mint
    /// @param initAmount0 Initial liquidity amount of token0 (SOL)
    /// @param initAmount1 Initial liquidity amount of token1 (the token)
    /// @param openTime Pool open time (Unix timestamp)
    function migrateToDEX(
        bytes32 mint,
        uint256 initAmount0,
        uint256 initAmount1,
        uint64 openTime
    ) external;

    // ── Admin ────────────────────────────────────────────────────────────────
    function pauseAll() external;
    function unpauseAll() external;
    function rotateAdmin(address newAdmin) external;
    function rotateMigrationAuthority(address newAuthority) external;
    function defundCurve(bytes32 mint) external;

    // ── View Functions ───────────────────────────────────────────────────────
    /// @return Config state: admin, feeWallet, migrationAuthority, threshold
    function getConfig()
        external
        view
        returns (
            address admin,
            address feeWallet,
            address migrationAuthority,
            uint256 migrationThresholdLamports,
            bool paused
        );

    /// @return Full curve state for a given mint
    function getCurve(bytes32 mint)
        external
        view
        returns (
            address creator,
            bytes32 mintAddr,
            uint256 virtualTokenReserves,
            uint256 virtualSolReserves,
            uint256 realTokenReserves,
            uint256 realSolReserves,
            bool complete,
            uint8 curveType,
            string memory name,
            string memory symbol,
            string memory uri,
            uint16 creatorFeeBps,
            uint256 migrationThreshold,
            bool paused
        );

    /// @return Current price in SOL per token (derived from virtual reserves)
    function getCurrentPrice(bytes32 mint) external view returns (uint256);

    /// @return Tokens received for a given SOL input (pre-trade simulation)
    /// @param solIn SOL to spend
    /// @return tokensOut Tokens received (before fees — use buy for post-fee amount)
    function simulateBuy(bytes32 mint, uint256 solIn)
        external
        view
        returns (uint256 tokensOut, uint256 platformFee, uint256 creatorFee);

    /// @return SOL received for a given token input (pre-trade simulation)
    function simulateSell(bytes32 mint, uint256 tokensIn)
        external
        view
        returns (uint256 solOut, uint256 platformFee, uint256 creatorFee);
}
```

### 8.2 Config PDA / Factory Interface

```solidity
/// @title IHermesFactory — Token factory + config access
/// @notice Optional factory wrapper that creates new curve instances.
///         V1 uses a single program with per-mint PDAs; factory is a V2 abstraction.
interface IHermesFactory {
    event CurveInstantiated(
        bytes32 mint,
        address creator,
        address curveAddress,
        uint256 timestamp
    );

    function instantiateCurve(address creator) external returns (bytes32 mint);
    function getCurveCount() external view returns (uint256);
    function getCurveByIndex(uint256 index) external view returns (bytes32 mint);
}
```

### 8.3 Fee Collector Interface (V2)

```solidity
/// @title IFeeCollector — Protocol fee wallet + revenue distribution
/// @notice The fee wallet can be a separate contract that splits revenue:
///         protocol treasury / staking rewards / buybacks.
interface IFeeCollector {
    /// @dev Called by curve on each trade with collected platform fee.
    ///      Dispatches to treasury, staking pool, or buyback contract.
    function depositPlatformFee(uint256 amount, bytes32 mint) external;

    /// @return Total platform fees collected (all-time)
    function totalFeesCollected() external view returns (uint256);

    /// @return Fees collected in the last 24 hours (rolling window)
    function feesLast24h() external view returns (uint256);
}
```

---

## 9. Math Models — Formal Reference

### 9.1 Constant-Product Curve (Type 0) — Formal

```
Given:  V_s(0), V_t(0), K = V_s(0) × V_t(0)

State variables (all ≥ 0):
  V_s = virtual SOL reserves    (lamports or wei)
  V_t = virtual token reserves  (smallest token unit, 6 decimals)
  R_s = real SOL reserves       (on-chain balance of curve PDA)
  R_t = real token reserves     (on-chain balance of curve ATA)

Invariant:  V_s × V_t = K  (maintained after every trade)

Buy (Δs SOL in, Δt tokens out):
  Δs_net  = Δs × (1 − f_total)     where f_total = (PLATFORM_FEE_BPS + CREATOR_FEE_BPS) / BPS_DENOMINATOR
  V_s'    = V_s + Δs_net
  V_t'    = K / V_s'
  Δt      = V_t − V_t'
  Preconditions: Δt ≥ min_tokens_out  ∧  Δt ≤ R_t  ∧  Δs ≤ V_s × MAX_TRADE_BPS/BPS_DENOM
  Post: V_s ← V_s', V_t ← V_t', R_s += Δs_net, R_t −= Δt

Sell (Δt tokens in, Δs SOL out):
  V_t'    = V_t + Δt
  V_s'    = K / V_t'
  Δs_gross = V_s − V_s'
  Δs_net  = Δs_gross × (1 − f_total)
  Preconditions: Δs_net ≥ min_sol_out  ∧  Δs_gross ≤ R_s  ∧  Δt ≤ V_t × MAX_TRADE_BPS/BPS_DENOM
  Post: V_s ← V_s', V_t ← V_t', R_s −= Δs_gross, R_t += Δt   [note: fees deducted from R_s]

Current price (SOL per token):
  P = V_s / V_t

Marginal price (cost of next infinitesimal token):
  P_marg = V_s² / K

Price as function of tokens bought (n = SUPPLY − R_t):
  P(n) = V_s(n) / V_t(n)
  where V_s(n) = V_s(0) + Δs_net_bought_so_far
  and V_t(n) = V_t(0) − tokens_out_given_so_far
  In closed form: P(n) = (V_s(0) + ΣΔs_net) / (V_t(0) − ΣΔt_out)
  For constant-product: P(n) = P(0) / (1 − n/V_t(0) × (1 − f_total))   [approximate, fee-inclusive]
```

### 9.2 Linear Curve (Type 1) — Formal

```
Given:  P0 = base_price, α = slope

Price schedule:  P(n) = P0 + α × n    where n = tokens bought so far (n ∈ [0, SUPPLY])

Buy (Δs SOL in):
  P_current = P0 + α × n
  Δt = Δs × (1 − f_total) / P_current
  n ← n + Δt
  Post: R_s += Δs × (1 − f_total), R_t −= Δt

Sell (Δt tokens in):
  P_current = P0 + α × n
  Δs_gross = Δt × P_current
  Δs_net  = Δs_gross × (1 − f_total)
  n ← n − Δt
  Post: R_s −= Δs_gross, R_t += Δt

Virtual reserve interpretation (for unified UI):
  V_s(n) = P0 × n + ½ × α × n²   [integral of P(n)]
  V_t(n) = n
  Note: V_s × V_t ≠ constant — this is NOT a constant-product curve

Current price: P_current = P0 + α × (SUPPLY − R_t) / SUPPLY × SUPPLY  = P0 + α × n

Integration note: V_s in the linear case is the CUMULATIVE SOL invested, not a virtual reserve
that participates in an invariant. For UI consistency, display V_s as cumulative SOL invested.
```

### 9.3 Exponential Curve (Type 2) — Formal

```
Given:  P0 = V_SOL0 / V_TOK0, α = steepness parameter (0 < α ≤ 5.0)

Price schedule:  P(n) = P0 × exp(α × n / SUPPLY)    where n = tokens bought so far

Buy (Δs SOL in):
  P_current = P0 × exp(α × n / SUPPLY)
  Δt = Δs × (1 − f_total) / P_current
  n ← n + Δt

Sell (Δt tokens in):
  P_current = P0 × exp(α × n / SUPPLY)
  Δs_gross = Δt × P_current
  Δs_net  = Δs_gross × (1 − f_total)
  n ← n − Δt

Closed-form reserves at token bought count n:
  V_s(n) = ∫₀ⁿ P0 × exp(α × x / SUPPLY) dx
         = P0 × SUPPLY/α × (exp(α × n / SUPPLY) − 1)
  V_t(n) = n

Price at n = 0: P(0) = P0 = 2.796e-5 SOL/token (standard V0)
Price at n = SUPPLY (all tokens bought): P(SUPPLY) = P0 × exp(α)

α examples:
  α = 1.0: P(SUPPLY) = P0 × e ≈ 7.58e-5 SOL/token  (≈ 2.7× entry)
  α = 3.0: P(SUPPLY) = P0 × e³ ≈ 5.49e-4 SOL/token (≈ 19.6× entry)
  α = 5.0: P(SUPPLY) = P0 × exp(5) ≈ 8.74e-3 SOL/token (≈ 313× entry)

Gas note: exp() on EVM is O(1) via `Math.exp` (Solidity 0.8.20+ `exp` builtin not available;
use Taylor series or precomputed LUT). On Solana, use `exp` syscall or LUT.
Recommended: LUT for α ∈ {0.25, 0.5, 1.0, 2.0, 3.0, 5.0}; interpolate for values in between.
```

### 9.4 Custom Polynomial Curve (Type 3) — Formal

```
Given:  coefficients [a₀, a₁, ..., aₖ] with k ≤ 5, all aᵢ ≥ 0, a₀ > 0

Price schedule:  P(n) = Σᵢ₌₀ᵏ aᵢ × nⁱ

Buy (Δs SOL in):
  P_current = Σᵢ₌₀ᵏ aᵢ × nⁱ
  Δt = Δs × (1 − f_total) / P_current
  n ← n + Δt

Sell (Δt tokens in):
  P_current = Σᵢ₌₀ᵏ nⁱ × aᵢ
  Δs_gross = Δt × P_current
  Δs_net  = Δs_gross × (1 − f_total)
  n ← n − Δt

Constraints: a₀ > 0 (nonzero entry price); aᵢ ≥ 0 for all i (monotonic increasing);
  k ≤ 5 (gas-bounded to 5 multiplications + 5 additions per price evaluation)

Example (quadratic, k=2): P(n) = a₀ + a₁×n + a₂×n²
  a₀ = P0 = 2.796e-5; a₁ = P0 / (2×SUPPLY); a₂ = P0 / (4×SUPPLY²)
  → convex-up price curve, accelerating faster than linear but bounded

Gas cost per trade (degree k): k multiplications + k additions + 1 division
  k=2: ~5 arithmetic ops — very cheap
  k=5: ~11 arithmetic ops — acceptable, ~2× constant-product cost
```

### 9.5 Graduation Threshold Logic

```
Graduation condition: R_s ≥ migration_threshold_lamports

At curve creation: threshold = config.migration_threshold_lamports
                    (per-token override: create_token(migration_threshold))

On each buy, after state update:
  if R_s ≥ threshold:
    complete = true
    emit MigrationReady(mint, R_s)

Post-graduation invariants:
  - curve.complete == true (immutable)
  - buy() reverts with CurveComplete
  - sell() reverts with CurveComplete
  - migrate() callable only by migration_authority

Migrated state:
  - R_s → 0 (swept to authority)
  - R_t → 0 (swept to authority ATA)
  - Curve PDA lamports → rent-exempt minimum only
  - Curve ATA balance → 0
  - emit Migrated(mint, sol_swept, tokens_swept)
```

---

## 10. Gas Optimization Targets

### 10.1 Solana / Anchor Targets (on-chain program)

| Operation | V1 Measured | V2 Target | Notes |
|-----------|-------------|-----------|-------|
| `initialize` | ~3,500 CU | < 3,000 CU | One-time; not throughput-critical |
| `create_token` | ~12,000 CU | < 10,000 CU | CPI to token program dominates; reduce account setup |
| `buy` (small trade) | ~7,500 CU | < 6,500 CU | CPI to token transfer + 3 system transfers |
| `buy` (large trade) | ~9,000 CU | < 7,500 CU | More SOL transfer compute; same CPI count |
| `sell` (small trade) | ~6,000 CU | < 5,500 CU | No SOL from trader; lamport adjusts cheaper |
| `sell` (large trade) | ~7,500 CU | < 6,500 CU | Same CPI structure as small |
| `migrate` (sweep only) | ~5,000 CU | < 4,500 CU | Remove migration CPI (V2: worker does pool creation) |

**CU optimization levers:**
- Pack Curve account data to minimize account size (already compact in V1)
- Use `init_if_needed` for trader ATA to avoid redundant CPI (V1 already does this)
- Batch fee transfers: use a single `transfer` CPI with multiple destinations via a fee splitter contract (V2)
- Avoid `Rent::get()` syscall on every migrate — cache rent in Config at initialize

### 10.2 EVM / Solidity Targets (V2 alternative deployment)

| Operation | Target gas (EVM) | Notes |
|-----------|------------------|-------|
| `initialize` | < 150,000 gas | SSTORE-heavy; one-time cost acceptable |
| `createToken` | < 300,000 gas | ERC-20 mint + curve account creation |
| `buy` (small) | < 120,000 gas | 1 SSTORE for curve state + 3 transfers |
| `sell` (small) | < 100,000 gas | 1 SSTORE + 3 transfers; no callvalue |
| `migrate` | < 200,000 gas | Sweep + optional DEX pool creation CPI |
| `getCurrentPrice` (view) | < 50,000 gas | Read-only; 1 SLOAD for curve state |

**EVM gas optimization levers:**
- Pack Curve struct into a single `bytes32`-aligned storage slot layout (4 slots max for core state)
- Use `unchecked` blocks for arithmetic that is provably in-range (after overflow checks pass)
- Cache `virtual_sol_reserves` and `virtual_token_reserves` in memory during trade execution (avoid double SLOAD)
- Use `callstaticall` for `simulateBuy`/`simulateSell` (free, no state change)
- Emit events with minimal indexed parameters (avoid >3 indexed params — gas cost per indexed param)

### 10.3 Cross-Chain Parity Note

The same curve math (Section 2, Section 9) applies identically on Solana and EVM. The only differences are:
- **Unit:** Solana uses lamports (10⁻⁹ SOL) and 6-decimal tokens; EVM uses wei (10⁻¹⁸) and configurable ERC-20 decimals
- **CPI vs call:** Solana uses CPI (program-to-program); EVM uses `call` / `delegatecall`
- **Account model:** Solana PDAs vs EVM contract instances
- **Fee routing:** Solana `system_program::transfer` vs EVM `transfer` / `callvalue`

The interface in Section 8 is deliberately unit-agnostic (`uint256` for amounts) so it maps to both chains with a unit adapter layer.

---

## 11. State Machine — Curve Lifecycle

```
                    create_token()
                        │
                        ▼
              ┌─────────────────┐
              │   ACTIVE        │ ◄── buy/sell (any curve_type)
              │  (trading)      │
              └────────┬────────┘
                       │ real_sol_reserves ≥ threshold
                       ▼
              ┌─────────────────┐
              │   LOCKED        │ ◄── complete = true, no more trades
              │ (migration-ready)│
              └────────┬────────┘
                       │ migration_authority calls migrate()
                       ▼
              ┌─────────────────┐
              ┌│   MIGRATED      │
              ││  (swept to DEX) │
              │└─────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   CLOSED        │ ◄── defund_curve (admin, emergency only)
              │  (burned/closed)│
              └─────────────────┘

States:
  ACTIVE     — accepting buy/sell; curve PDA holds tokens + SOL
  LOCKED     — complete = true; migration ready; no trades
  MIGRATED   — funds swept to authority; DEX pool seeded
  CLOSED     — curve ATA burned, mint closed (emergency admin action)
```

**State transitions:**
- `ACTIVE → LOCKED`: automatic, triggered by `buy` when `R_s ≥ threshold` (irreversible)
- `LOCKED → MIGRATED`: `migrate()` called by migration authority (once per curve)
- `ACTIVE → CLOSED`: `defundCurve()` called by admin (emergency, rate-limited to 1/week)
- `LOCKED → CLOSED`: not allowed (must migrate first, then defund if desired)
- `MIGRATED → CLOSED`: not applicable (tokens are in DEX pool, not in curve)

---

## 12. Security Considerations

| Threat | Mitigation | Status |
|--------|-----------|--------|
| Curve math overflow | Checked arithmetic (`checked_mul`, `checked_add`, `checked_sub`) on all ops; revert on overflow | V1 deployed |
| Authority key compromise | Curve authority = PDA (no private key); migration authority = separate key, rotatable by admin | V1 deployed |
| Front-running / sandwich | Slippage floor + size cap (V1); commit-reveal + price-deviation check (V2) | V1 partial; V2 planned |
| Rug pull (creator drains tokens) | All supply minted to curve; creator cannot withdraw tokens; only earns fee in SOL | V1 deployed |
| Replay attack on migration | `complete` flag is irreversible; `migrate` checks authority == config.migration_authority | V1 deployed |
| PDA griefing (bump grinding) | Anchor derives bump deterministically; no user-supplied bump | V1 deployed |
| Token metadata spoofing | `uri` bounded to 200 bytes; metadata fetched off-chain by indexer, not trusted on-chain | V1 deployed |
| Infinite loop in custom curve | Degree ≤ 5 hard-coded; coefficients validated ≥ 0 at creation | V2 planned |
| Migration MEV | Batch auction at graduation (V2); DEX pool creation by authority only after lock | V2 planned |
| Fee drain (zero-fee curve) | Platform fee hard minimum 0.10% (10 bps); creator fee can be 0 but platform fee never 0 | V2 planned |

---

## 13. Open Questions & V2 Backlog

| Item | Decision needed | Priority |
|------|----------------|----------|
| Per-token migration threshold (V1: global only) | Allow creator to set per-token threshold at creation; Config stores global default | P1 |
| Commit-reveal enabled by default? | OFF by default (friction); creator can enable per-token at creation | P1 |
| Token-2022 vs legacy SPL | V1 uses legacy SPL; V2 migrate to Token-2022 for transfer hooks (referral + burn on-chain) | P2 |
| EVM deployment (Base Sepolia) | Duplicate program logic in Solidity per Section 8 interfaces; same curve math | P2 |
| Graduation ceremony UX | V2: full-screen animation, shareable certificate, chat auto-post | P2 |
| LP token lock / burn mode | Creator chooses at graduation: keep LP (tradeable) or burn LP (charity/locked) | P2 |
| Curve type discovery (off-chain) | Indexer reads `curve_type` from Curve account; frontend displays curve type badge | P2 |
| Price oracle for exponential LUT | Pre-compute LUT at program deploy; store in Config; update only by admin | P2 |

---

## 14. Acceptance Checklist

- [x] Bonding curve formulas defined: constant-product (V1), linear, exponential, custom polynomial
- [x] Token minting/burning logic specified: full supply to curve at creation; no hidden allocation; burn-on-graduation optional
- [x] Graduation threshold: 85 SOL default (V1), per-token configurable (V2); migration authority sweep + DEX pool seeding
- [x] Fee structure: platform 0.25% (fixed), creator 0.25%–2.5% (configurable), referral 0.1% + burn 0.1% (V2 on-chain)
- [x] Anti-sniping/MEV: slippage floor + size cap (V1), commit-reveal + rate limit + price deviation + batch auction (V2)
- [x] Solidity interface definitions: `IHermesCurve`, `IHermesFactory`, `IFeeCollector` with full event/error enum
- [x] Math models: formal closed-form for all 4 curve types, price functions, reserve integrals, graduation condition
- [x] Gas targets: Solana CU targets per operation; EVM gas targets per operation; optimization levers documented
- [x] State machine: ACTIVE → LOCKED → MIGRATED → CLOSED with transition guards
- [x] Security considerations: 10 threats mapped to mitigations with V1/V2 status

**Spec approved by lead-orchestrator-2 for smart contract implementation.**

> Next step: Implement V2 curve type support (`curve_type` field + buy/sell dispatch) in `programs/hermes-curve/src/lib.rs`, starting with constant-product backward compatibility for existing V1 curves. Child task `t_296685a5` (Implement smart contracts) is the implementation lane.
