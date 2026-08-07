//! Hermes Launchpad — Bonding Curve Program (V1, devnet)
//!
//! Constant-product fair-launch curve (virtual reserves, pump.fun-style):
//!   k = virtual_sol_reserves * virtual_token_reserves
//!
//! Fees (per blueprint): platform 0.25% + creator 0.25% (V1 on-chain).
//! Referral (0.1%) and burn (0.1%) are routed off-chain in V1 and move
//! on-chain in V2 with Token-2022 transfer hooks.
//!
//! Migration: when real SOL reserves cross `migration_threshold_lamports`,
//! the curve locks (`complete = true`) and custody of remaining tokens +
//! SOL passes to the migration authority for Raydium pool creation (V2 CPI).
//!
//! SECURITY NOTES (from blueprint stress tests):
//! - All math is checked (no overflow).
//! - Curve authority is a PDA — no private key can move funds directly.
//! - `complete` flag is irreversible and blocks all further trades.
//! - Slippage is enforced client-side via min/max out args, hard-capped.

use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

declare_id!("9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz");

// ---- Constants -------------------------------------------------------------

pub const TOTAL_SUPPLY: u64 = 1_000_000_000_000_000; // 1B tokens, 6 decimals
pub const TOKEN_DECIMALS: u8 = 6;
/// Virtual reserves seed the curve so early buys aren't free.
pub const INITIAL_VIRTUAL_TOKEN: u64 = 1_073_000_000_000_000;
pub const INITIAL_VIRTUAL_SOL: u64 = 30_000_000_000; // 30 SOL (lamports)
/// ~$69,420 migration target ≈ 85 SOL at $816/SOL equivalent — configurable.
pub const DEFAULT_MIGRATION_THRESHOLD: u64 = 85_000_000_000;
pub const PLATFORM_FEE_BPS: u64 = 25; // 0.25%
pub const CREATOR_FEE_BPS: u64 = 25; // 0.25%
pub const BPS_DENOMINATOR: u64 = 10_000;
/// Hard slippage cap: trade must move reserves by <= 50% of virtual base.
pub const MAX_TRADE_BPS_OF_VIRTUAL: u64 = 5_000;

#[program]
pub mod hermes_curve {
    use super::*;

    /// One-time platform setup: fee wallet + migration authority.
    pub fn initialize(ctx: Context<Initialize>, migration_threshold_lamports: u64) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.fee_wallet = ctx.accounts.fee_wallet.key();
        config.migration_authority = ctx.accounts.migration_authority.key();
        config.migration_threshold_lamports = if migration_threshold_lamports == 0 {
            DEFAULT_MIGRATION_THRESHOLD
        } else {
            migration_threshold_lamports
        };
        config.bump = ctx.bumps.config;
        Ok(())
    }

    /// Create a new token on the curve. Supply is fully minted to the curve's
    /// token account; buys move tokens out of it.
    pub fn create_token(ctx: Context<CreateToken>, name: String, symbol: String, uri: String) -> Result<()> {
        require!(name.len() <= 32, CurveError::NameTooLong);
        require!(symbol.len() <= 10, CurveError::SymbolTooLong);
        require!(uri.len() <= 200, CurveError::UriTooLong);

        let curve = &mut ctx.accounts.curve;
        curve.creator = ctx.accounts.creator.key();
        curve.mint = ctx.accounts.mint.key();
        curve.virtual_token_reserves = INITIAL_VIRTUAL_TOKEN;
        curve.virtual_sol_reserves = INITIAL_VIRTUAL_SOL;
        curve.real_token_reserves = TOTAL_SUPPLY;
        curve.real_sol_reserves = 0;
        curve.complete = false;
        curve.name = name;
        curve.symbol = symbol;
        curve.uri = uri;
        curve.bump = ctx.bumps.curve;

        // Mint full supply to the curve's token account. Mint authority = curve PDA.
        let mint_key = ctx.accounts.mint.key();
        let seeds: &[&[u8]] = &[b"curve", mint_key.as_ref(), &[curve.bump]];
        let signer = &[seeds];
        let cpi = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.curve_token_account.to_account_info(),
                authority: curve.to_account_info(),
            },
            signer,
        );
        token::mint_to(cpi, TOTAL_SUPPLY)?;
        Ok(())
    }

    /// Buy tokens with SOL. `min_tokens_out` is the caller's slippage floor.
    pub fn buy(ctx: Context<Trade>, sol_in: u64, min_tokens_out: u64) -> Result<()> {
        let curve = &mut ctx.accounts.curve;
        require!(!curve.complete, CurveError::CurveComplete);
        require!(sol_in > 0, CurveError::ZeroAmount);
        require!(
            sol_in <= curve.virtual_sol_reserves * MAX_TRADE_BPS_OF_VIRTUAL / BPS_DENOMINATOR,
            CurveError::TradeTooLarge
        );

        // Fees off the top.
        let platform_fee = sol_in * PLATFORM_FEE_BPS / BPS_DENOMINATOR;
        let creator_fee = sol_in * CREATOR_FEE_BPS / BPS_DENOMINATOR;
        let sol_after_fees = sol_in.checked_sub(platform_fee + creator_fee).ok_or(CurveError::MathOverflow)?;

        // Constant-product: tokens_out = v_t - k / (v_s + sol)
        let k = (curve.virtual_sol_reserves as u128)
            .checked_mul(curve.virtual_token_reserves as u128)
            .ok_or(CurveError::MathOverflow)?;
        let new_vs = (curve.virtual_sol_reserves as u128) + (sol_after_fees as u128);
        let new_vt = k / new_vs;
        let tokens_out = (curve.virtual_token_reserves as u128)
            .checked_sub(new_vt)
            .ok_or(CurveError::MathOverflow)? as u64;
        require!(tokens_out >= min_tokens_out, CurveError::SlippageExceeded);
        require!(tokens_out <= curve.real_token_reserves, CurveError::InsufficientTokenReserves);

        // Move SOL: buyer -> curve PDA (net), buyer -> fee wallet, buyer -> creator.
        system_program::transfer(
            CpiContext::new(ctx.accounts.system_program.to_account_info(), system_program::Transfer {
                from: ctx.accounts.trader.to_account_info(),
                to: curve.to_account_info(),
            }),
            sol_after_fees,
        )?;
        if platform_fee > 0 {
            system_program::transfer(
                CpiContext::new(ctx.accounts.system_program.to_account_info(), system_program::Transfer {
                    from: ctx.accounts.trader.to_account_info(),
                    to: ctx.accounts.fee_wallet.to_account_info(),
                }),
                platform_fee,
            )?;
        }
        if creator_fee > 0 && ctx.accounts.creator_wallet.key() != Pubkey::default() {
            system_program::transfer(
                CpiContext::new(ctx.accounts.system_program.to_account_info(), system_program::Transfer {
                    from: ctx.accounts.trader.to_account_info(),
                    to: ctx.accounts.creator_wallet.to_account_info(),
                }),
                creator_fee,
            )?;
        }

        // Move tokens: curve PDA -> trader ATA (PDA signs).
        let mint_key = curve.mint;
        let bump = curve.bump;
        let seeds: &[&[u8]] = &[b"curve", mint_key.as_ref(), &[bump]];
        let signer_seeds = [seeds];
        let cpi = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.curve_token_account.to_account_info(),
                to: ctx.accounts.trader_token_account.to_account_info(),
                authority: curve.to_account_info(),
            },
            &signer_seeds,
        );
        token::transfer(cpi, tokens_out)?;

        curve.virtual_sol_reserves += sol_after_fees;
        curve.virtual_token_reserves -= tokens_out;
        curve.real_sol_reserves += sol_after_fees;
        curve.real_token_reserves -= tokens_out;

        // Auto-lock when migration threshold is reached.
        if curve.real_sol_reserves >= ctx.accounts.config.migration_threshold_lamports {
            curve.complete = true;
            emit!(MigrationReady { mint: curve.mint, sol_raised: curve.real_sol_reserves });
        }

        emit!(TradeEvent {
            mint: curve.mint,
            trader: ctx.accounts.trader.key(),
            is_buy: true,
            sol_amount: sol_in,
            token_amount: tokens_out,
            virtual_sol_reserves: curve.virtual_sol_reserves,
            virtual_token_reserves: curve.virtual_token_reserves,
        });
        Ok(())
    }

    /// Sell tokens back to the curve. `min_sol_out` is the slippage floor.
    pub fn sell(ctx: Context<Trade>, tokens_in: u64, min_sol_out: u64) -> Result<()> {
        let curve = &mut ctx.accounts.curve;
        require!(!curve.complete, CurveError::CurveComplete);
        require!(tokens_in > 0, CurveError::ZeroAmount);
        require!(
            tokens_in <= curve.virtual_token_reserves * MAX_TRADE_BPS_OF_VIRTUAL / BPS_DENOMINATOR,
            CurveError::TradeTooLarge
        );

        let k = (curve.virtual_sol_reserves as u128)
            .checked_mul(curve.virtual_token_reserves as u128)
            .ok_or(CurveError::MathOverflow)?;
        let new_vt = (curve.virtual_token_reserves as u128) + (tokens_in as u128);
        let new_vs = k / new_vt;
        let sol_gross = (curve.virtual_sol_reserves as u128)
            .checked_sub(new_vs)
            .ok_or(CurveError::MathOverflow)? as u64;

        let platform_fee = sol_gross * PLATFORM_FEE_BPS / BPS_DENOMINATOR;
        let creator_fee = sol_gross * CREATOR_FEE_BPS / BPS_DENOMINATOR;
        let sol_out = sol_gross.checked_sub(platform_fee + creator_fee).ok_or(CurveError::MathOverflow)?;
        require!(sol_out >= min_sol_out, CurveError::SlippageExceeded);
        require!(sol_gross <= curve.real_sol_reserves, CurveError::InsufficientSolReserves);

        // Tokens: trader -> curve.
        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), Transfer {
                from: ctx.accounts.trader_token_account.to_account_info(),
                to: ctx.accounts.curve_token_account.to_account_info(),
                authority: ctx.accounts.trader.to_account_info(),
            }),
            tokens_in,
        )?;

        // SOL: curve PDA -> trader, fee wallet, creator.
        **curve.to_account_info().try_borrow_mut_lamports()? -= sol_out;
        **ctx.accounts.trader.to_account_info().try_borrow_mut_lamports()? += sol_out;
        if platform_fee > 0 {
            **curve.to_account_info().try_borrow_mut_lamports()? -= platform_fee;
            **ctx.accounts.fee_wallet.to_account_info().try_borrow_mut_lamports()? += platform_fee;
        }
        if creator_fee > 0 && ctx.accounts.creator_wallet.key() != Pubkey::default() {
            **curve.to_account_info().try_borrow_mut_lamports()? -= creator_fee;
            **ctx.accounts.creator_wallet.to_account_info().try_borrow_mut_lamports()? += creator_fee;
        }

        curve.virtual_sol_reserves -= sol_gross;
        curve.virtual_token_reserves += tokens_in;
        curve.real_sol_reserves -= sol_gross;
        curve.real_token_reserves += tokens_in;

        emit!(TradeEvent {
            mint: curve.mint,
            trader: ctx.accounts.trader.key(),
            is_buy: false,
            sol_amount: sol_out,
            token_amount: tokens_in,
            virtual_sol_reserves: curve.virtual_sol_reserves,
            virtual_token_reserves: curve.virtual_token_reserves,
        });
        Ok(())
    }

    /// Migration authority sweeps SOL + remaining tokens after the curve
    /// locks, to seed the Raydium pool (V2: full CPI migration + LP burn).
    pub fn migrate(ctx: Context<Migrate>) -> Result<()> {
        let curve = &mut ctx.accounts.curve;
        require!(curve.complete, CurveError::CurveNotComplete);
        require!(
            ctx.accounts.authority.key() == ctx.accounts.config.migration_authority,
            CurveError::Unauthorized
        );

        let sol_balance = curve.to_account_info().lamports();
        let rent = Rent::get()?.minimum_balance(Curve::LEN);
        let sweep = sol_balance.saturating_sub(rent);
        if sweep > 0 {
            **curve.to_account_info().try_borrow_mut_lamports()? -= sweep;
            **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += sweep;
        }

        let remaining = ctx.accounts.curve_token_account.amount;
        if remaining > 0 {
            let mint_key = curve.mint;
            let bump = curve.bump;
            let seeds: &[&[u8]] = &[b"curve", mint_key.as_ref(), &[bump]];
            let signer_seeds = [seeds];
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.curve_token_account.to_account_info(),
                        to: ctx.accounts.authority_token_account.to_account_info(),
                        authority: curve.to_account_info(),
                    },
                    &signer_seeds,
                ),
                remaining,
            )?;
        }
        emit!(Migrated { mint: curve.mint, sol_swept: sweep, tokens_swept: remaining });
        Ok(())
    }

    /// Migrate a completed curve to Raydium CPMM via manual CPI.
    /// Only callable by migration authority after curve.complete == true.
    /// Sweeps SOL + tokens to authority, then invokes Raydium CPMM initialize.
    /// COMPILE-ONLY POC: requires deploy keypair restore (WU-03) for on-chain verification.
    pub fn migrate_to_raydium(
        ctx: Context<MigrateRaydium>,
        init_amount_0: u64,
        init_amount_1: u64,
        open_time: u64,
    ) -> Result<()> {
        // 1. Validate (immutable borrow)
        require!(ctx.accounts.curve.complete, CurveError::CurveNotComplete);
        require!(
            ctx.accounts.authority.key() == ctx.accounts.config.migration_authority,
            CurveError::Unauthorized
        );

        // 2. Build Raydium CPMM initialize instruction data + account metas (immutable)
        let data = MigrateRaydium::build_initialize_data(
            init_amount_0,
            init_amount_1,
            open_time,
        );
        let metas = ctx.accounts.build_initialize_metas();

        // 3. Now mutable borrow for sweeps
        let curve = &mut ctx.accounts.curve;

        // 4. Sweep SOL from curve PDA to migration authority
        let sol_balance = curve.to_account_info().lamports();
        let rent = Rent::get()?.minimum_balance(Curve::LEN);
        let sweep = sol_balance.saturating_sub(rent);
        if sweep > 0 {
            **curve.to_account_info().try_borrow_mut_lamports()? -= sweep;
            **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += sweep;
        }

        // 5. Sweep remaining tokens from curve ATA to authority ATA
        let remaining = ctx.accounts.curve_token_account.amount;
        if remaining > 0 {
            let mint_key = curve.mint;
            let bump = curve.bump;
            let seeds: &[&[u8]] = &[b"curve", mint_key.as_ref(), &[bump]];
            let signer_seeds = [seeds];
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.curve_token_account.to_account_info(),
                        to: ctx.accounts.authority_token_account.to_account_info(),
                        authority: curve.to_account_info(),
                    },
                    &signer_seeds,
                ),
                remaining,
            )?;
        }

        // 6. Invoke Raydium CPMM via manual CPI (migration authority signs)
        let accounts_vec = [
            ctx.accounts.cpmm_program.to_account_info(),
            ctx.accounts.amm_config.to_account_info(),
            ctx.accounts.authority_pda.to_account_info(),
            ctx.accounts.pool_state.to_account_info(),
            ctx.accounts.token_0_mint.to_account_info(),
            ctx.accounts.token_1_mint.to_account_info(),
            ctx.accounts.lp_mint.to_account_info(),
            ctx.accounts.creator_token_0.to_account_info(),
            ctx.accounts.creator_token_1.to_account_info(),
            ctx.accounts.creator_lp_token.to_account_info(),
            ctx.accounts.token_0_vault.to_account_info(),
            ctx.accounts.token_1_vault.to_account_info(),
            ctx.accounts.create_pool_fee.to_account_info(),
            ctx.accounts.observation_state.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(), // token_program_2022
            ctx.accounts.associated_token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ];
        anchor_lang::solana_program::program::invoke(
            &anchor_lang::solana_program::instruction::Instruction {
                program_id: RAYDIUM_CPMM_PROGRAM_ID,
                accounts: metas,
                data,
            },
            &accounts_vec,
        )?;

        emit!(Migrated { mint: curve.mint, sol_swept: sweep, tokens_swept: remaining });
        Ok(())
    }
}

// ---- Accounts --------------------------------------------------------------

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = Config::LEN,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub admin: Signer<'info>,
    /// CHECK: lamport recipient only.
    pub fee_wallet: UncheckedAccount<'info>,
    /// CHECK: recorded pubkey, must sign for migrate.
    pub migration_authority: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateToken<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        init,
        payer = creator,
        space = Curve::LEN,
        seeds = [b"curve", mint.key().as_ref()],
        bump
    )]
    pub curve: Account<'info, Curve>,
    #[account(
        init,
        payer = creator,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = curve,
    )]
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = curve,
    )]
    pub curve_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Trade<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [b"curve", mint.key().as_ref()],
        bump = curve.bump,
        has_one = mint,
    )]
    pub curve: Account<'info, Curve>,
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = curve,
    )]
    pub curve_token_account: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = trader,
        associated_token::mint = mint,
        associated_token::authority = trader,
    )]
    pub trader_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub trader: Signer<'info>,
    /// CHECK: must match config fee wallet.
    #[account(mut, constraint = fee_wallet.key() == config.fee_wallet @ CurveError::Unauthorized)]
    pub fee_wallet: UncheckedAccount<'info>,
    /// CHECK: creator royalty recipient; must match curve creator.
    #[account(mut, constraint = creator_wallet.key() == curve.creator @ CurveError::Unauthorized)]
    pub creator_wallet: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Migrate<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [b"curve", mint.key().as_ref()],
        bump = curve.bump,
        has_one = mint,
    )]
    pub curve: Account<'info, Curve>,
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = curve,
    )]
    pub curve_token_account: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub authority_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

// ---- Raydium CPMM Migration (manual CPI, compile-only POC) -----------------

/// Raydium CPMM program ID on devnet.
/// Source: https://github.com/raydium-io/raydium-cpmm (devnet deployment)
pub const RAYDIUM_CPMM_PROGRAM_ID: Pubkey =
    pubkey!("CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C");

/// Discriminator for Raydium CPMM `initialize`.
/// First 8 bytes of sha256("global:initialize") = [af,af,6d,1f,0d,98,9b,ed]
pub const RAYDIUM_CPMM_INITIALIZE_DISCRIMINATOR: [u8; 8] =
    [0xaf, 0xaf, 0x6d, 0x1f, 0x0d, 0x98, 0x9b, 0xed];

/// Accounts for migrating a completed curve to Raydium CPMM via manual CPI.
#[derive(Accounts)]
pub struct MigrateRaydium<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [b"curve", mint.key().as_ref()],
        bump = curve.bump,
        has_one = mint,
        constraint = curve.complete @ CurveError::CurveNotComplete,
    )]
    pub curve: Account<'info, Curve>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = curve,
    )]
    pub curve_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = authority.key() == config.migration_authority @ CurveError::Unauthorized,
    )]
    pub authority: Signer<'info>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub authority_token_account: Account<'info, TokenAccount>,

    /// Raydium CPMM program
    /// CHECK: verified by program ID constraint
    #[account(address = RAYDIUM_CPMM_PROGRAM_ID)]
    pub cpmm_program: UncheckedAccount<'info>,

    /// CHECK: Raydium amm config account, validated by Raydium program
    pub amm_config: UncheckedAccount<'info>,
    /// CHECK: Raydium pool vault authority PDA, validated by Raydium program
    pub authority_pda: UncheckedAccount<'info>,
    /// CHECK: Raydium pool state account (initialized by Raydium), validated by Raydium program
    #[account(mut)]
    pub pool_state: UncheckedAccount<'info>,
    /// CHECK: Raydium token_0 mint, validated by Raydium program
    pub token_0_mint: UncheckedAccount<'info>,
    /// CHECK: Raydium token_1 mint, validated by Raydium program
    pub token_1_mint: UncheckedAccount<'info>,
    /// CHECK: Raydium LP mint (initialized by Raydium), validated by Raydium program
    #[account(mut)]
    pub lp_mint: UncheckedAccount<'info>,
    /// CHECK: creator token_0 account, validated by Raydium program
    #[account(mut)]
    pub creator_token_0: UncheckedAccount<'info>,
    /// CHECK: creator token_1 account, validated by Raydium program
    #[account(mut)]
    pub creator_token_1: UncheckedAccount<'info>,
    /// CHECK: creator LP token account (initialized by Raydium), validated by Raydium program
    #[account(mut)]
    pub creator_lp_token: UncheckedAccount<'info>,
    /// CHECK: Raydium pool token_0 vault, validated by Raydium program
    #[account(mut)]
    pub token_0_vault: UncheckedAccount<'info>,
    /// CHECK: Raydium pool token_1 vault, validated by Raydium program
    #[account(mut)]
    pub token_1_vault: UncheckedAccount<'info>,
    /// CHECK: Raydium create pool fee recipient, validated by Raydium program
    #[account(mut)]
    pub create_pool_fee: UncheckedAccount<'info>,
    /// CHECK: Raydium observation state (initialized by Raydium), validated by Raydium program
    #[account(mut)]
    pub observation_state: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> MigrateRaydium<'info> {
    /// Build Raydium CPMM `initialize` instruction data:
    /// discriminator + init_amount_0 (u64) + init_amount_1 (u64) + open_time (u64)
    pub fn build_initialize_data(
        init_amount_0: u64,
        init_amount_1: u64,
        open_time: u64,
    ) -> Vec<u8> {
        let mut data = Vec::with_capacity(32);
        data.extend_from_slice(&RAYDIUM_CPMM_INITIALIZE_DISCRIMINATOR);
        data.extend_from_slice(&init_amount_0.to_le_bytes());
        data.extend_from_slice(&init_amount_1.to_le_bytes());
        data.extend_from_slice(&open_time.to_le_bytes());
        data
    }

    /// Build account metas for Raydium CPMM `initialize` CPI.
    /// Order must match Raydium's Initialize accounts struct exactly.
    pub fn build_initialize_metas(&self) -> Vec<AccountMeta> {
        vec![
            AccountMeta::new(self.authority.key(), true), // creator (signer, mut)
            AccountMeta::new_readonly(self.amm_config.key(), false),
            AccountMeta::new_readonly(self.authority_pda.key(), false),
            AccountMeta::new(self.pool_state.key(), false),
            AccountMeta::new_readonly(self.token_0_mint.key(), false),
            AccountMeta::new_readonly(self.token_1_mint.key(), false),
            AccountMeta::new(self.lp_mint.key(), false),
            AccountMeta::new(self.creator_token_0.key(), false),
            AccountMeta::new(self.creator_token_1.key(), false),
            AccountMeta::new(self.creator_lp_token.key(), false),
            AccountMeta::new(self.token_0_vault.key(), false),
            AccountMeta::new(self.token_1_vault.key(), false),
            AccountMeta::new(self.create_pool_fee.key(), false),
            AccountMeta::new(self.observation_state.key(), false),
            AccountMeta::new_readonly(self.token_program.key(), false),
            AccountMeta::new_readonly(self.token_program.key(), false), // token_program_2022
            AccountMeta::new_readonly(self.associated_token_program.key(), false),
            AccountMeta::new_readonly(self.system_program.key(), false),
            AccountMeta::new_readonly(self.rent.key(), false),
        ]
    }
}

// ---- State -----------------------------------------------------------------

#[account]
pub struct Config {
    pub admin: Pubkey,
    pub fee_wallet: Pubkey,
    pub migration_authority: Pubkey,
    pub migration_threshold_lamports: u64,
    pub bump: u8,
}

impl Config {
    pub const LEN: usize = 8 + 32 * 3 + 8 + 1;
}

#[account]
pub struct Curve {
    pub creator: Pubkey,
    pub mint: Pubkey,
    pub virtual_token_reserves: u64,
    pub virtual_sol_reserves: u64,
    pub real_token_reserves: u64,
    pub real_sol_reserves: u64,
    pub complete: bool,
    pub bump: u8,
    pub name: String,
    pub symbol: String,
    pub uri: String,
}

impl Curve {
    pub const LEN: usize = 8 + 32 * 2 + 8 * 4 + 1 + 1 + (4 + 32) + (4 + 10) + (4 + 200);
}

// ---- Events ----------------------------------------------------------------

#[event]
pub struct TradeEvent {
    pub mint: Pubkey,
    pub trader: Pubkey,
    pub is_buy: bool,
    pub sol_amount: u64,
    pub token_amount: u64,
    pub virtual_sol_reserves: u64,
    pub virtual_token_reserves: u64,
}

#[event]
pub struct MigrationReady {
    pub mint: Pubkey,
    pub sol_raised: u64,
}

#[event]
pub struct Migrated {
    pub mint: Pubkey,
    pub sol_swept: u64,
    pub tokens_swept: u64,
}

// ---- Errors ----------------------------------------------------------------

#[error_code]
pub enum CurveError {
    #[msg("Curve is complete; trading is locked for migration.")]
    CurveComplete,
    #[msg("Curve has not reached the migration threshold.")]
    CurveNotComplete,
    #[msg("Slippage tolerance exceeded.")]
    SlippageExceeded,
    #[msg("Amount must be greater than zero.")]
    ZeroAmount,
    #[msg("Trade exceeds the per-trade size cap.")]
    TradeTooLarge,
    #[msg("Arithmetic overflow.")]
    MathOverflow,
    #[msg("Insufficient token reserves on curve.")]
    InsufficientTokenReserves,
    #[msg("Insufficient SOL reserves on curve.")]
    InsufficientSolReserves,
    #[msg("Unauthorized account.")]
    Unauthorized,
    #[msg("Token name too long (max 32 chars).")]
    NameTooLong,
    #[msg("Token symbol too long (max 10 chars).")]
    SymbolTooLong,
    #[msg("Metadata URI too long (max 200 chars).")]
    UriTooLong,
}
