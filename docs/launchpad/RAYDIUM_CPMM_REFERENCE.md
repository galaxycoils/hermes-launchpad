# Raydium CPMM Reference (WU-02)

> Source: Context7 `/raydium-io/raydium-cpi` (fetched 2026-08-07). For WU-02 Raydium CPMM integration.

## Initialize CPMM Pool (CPI)

### Context Accounts (`ctx`)
- `creator` (signer, mut) — Address funding pool creation
- `amm_config` — Pool configuration account
- `authority` — Pool vault authority (PDA)
- `pool_state` (init) — Pool state account
- `token_0_mint` — First token mint (must be < token_1_mint)
- `token_1_mint` — Second token mint
- `lp_mint` (init) — LP token mint
- `creator_token_0`, `creator_token_1` (mut) — Creator's token accounts
- `creator_lp_token` (init) — Creator's LP token account
- `token_0_vault`, `token_1_vault` (mut) — Pool token vaults
- `create_pool_fee` (mut) — Fee recipient account
- `observation_state` (init) — Oracle observations
- Token programs and system program

### Function Parameters
- `init_amount_0` (u64) — Required — Initial deposit of token 0 (with decimals)
- `init_amount_1` (u64) — Required — Initial deposit of token 1 (with decimals)
- `open_time` (u64) — Required — Unix timestamp when swaps are enabled (0 for immediate)

### Returns
- `Result<()>`

### Rust CPI Example
```rust
use anchor_lang::prelude::*;
use raydium_cpmm_cpi::raydium_cpmm;

pub fn create_constant_product_pool(
    ctx: Context<InitCPMM>,
) -> Result<()> {
    let cpi_ctx = CpiContext::new(
        ctx.accounts.cpmm_program.to_account_info(),
        raydium_cpmm::Initialize {
            creator: ctx.accounts.payer.to_account_info(),
            amm_config: ctx.accounts.config.to_account_info(),
            // ... other accounts
        },
    );
    raydium_cpmm::initialize(
        cpi_ctx,
        1_000_000,  // init_amount_0: 1M
        2_000_000,  // init_amount_1: 2M
        0,          // open_time: immediate
    )
}
```

## WU-02 Scope (per plan)
- Add `accounts.rs` for Raydium CPMM CPI accounts
- Implement `migrate` instruction CPI to Raydium `initialize`
- Proof-of-concept test against devnet (no program upgrade until approved)
- Migration threshold: 85 SOL real reserves → lock curve → CPI to Raydium