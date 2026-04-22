use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount, Transfer as SplTransfer, transfer as spl_transfer};

use crate::constants::{BONDING_CURVE_SEED, CONFIG_SEED, CURVE_VAULT_SEED};
use crate::curve::{apply_fee_bps, sol_out_for_tokens_in, tokens_out_for_sol_in};
use crate::errors::SourcererError;
use crate::state::{BondingCurve, Config, Traded};

#[derive(Accounts)]
pub struct Trade<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    /// CHECK: fee recipient lamports destination
    #[account(mut, address = config.fee_recipient)]
    pub fee_recipient: UncheckedAccount<'info>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [BONDING_CURVE_SEED, mint.key().as_ref()],
        bump = bonding_curve.bump,
        constraint = bonding_curve.mint == mint.key(),
    )]
    pub bonding_curve: Account<'info, BondingCurve>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = bonding_curve,
    )]
    pub curve_token_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA SOL vault
    #[account(
        mut,
        seeds = [CURVE_VAULT_SEED, mint.key().as_ref()],
        bump,
    )]
    pub curve_sol_vault: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = trader,
        associated_token::mint = mint,
        associated_token::authority = trader,
    )]
    pub trader_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn buy_handler(ctx: Context<Trade>, sol_in: u64, min_tokens_out: u64) -> Result<()> {
    require!(!ctx.accounts.bonding_curve.complete, SourcererError::Graduated);
    require!(sol_in > 0, SourcererError::ZeroAmount);

    let fee_bps = ctx.accounts.config.fee_bps;
    let (net_sol, fee) = apply_fee_bps(sol_in, fee_bps)?;

    let curve = &ctx.accounts.bonding_curve;
    let tokens_out = tokens_out_for_sol_in(
        curve.virtual_sol_reserves,
        curve.virtual_token_reserves,
        net_sol,
    )?;

    require!(tokens_out >= min_tokens_out, SourcererError::SlippageExceeded);
    require!(
        tokens_out <= curve.real_token_reserves,
        SourcererError::InsufficientCurveTokens
    );

    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.trader.to_account_info(),
                to: ctx.accounts.curve_sol_vault.to_account_info(),
            },
        ),
        net_sol,
    )?;
    if fee > 0 {
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.trader.to_account_info(),
                    to: ctx.accounts.fee_recipient.to_account_info(),
                },
            ),
            fee,
        )?;
    }

    let mint_key = ctx.accounts.mint.key();
    let curve_bump = ctx.accounts.bonding_curve.bump;
    let seeds: &[&[u8]] = &[BONDING_CURVE_SEED, mint_key.as_ref(), &[curve_bump]];
    let signer_seeds = &[seeds];

    spl_transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            SplTransfer {
                from: ctx.accounts.curve_token_vault.to_account_info(),
                to: ctx.accounts.trader_token_account.to_account_info(),
                authority: ctx.accounts.bonding_curve.to_account_info(),
            },
            signer_seeds,
        ),
        tokens_out,
    )?;

    let curve = &mut ctx.accounts.bonding_curve;
    curve.virtual_sol_reserves = curve
        .virtual_sol_reserves
        .checked_add(net_sol)
        .ok_or(SourcererError::MathOverflow)?;
    curve.virtual_token_reserves = curve
        .virtual_token_reserves
        .checked_sub(tokens_out)
        .ok_or(SourcererError::MathOverflow)?;
    curve.real_sol_reserves = curve
        .real_sol_reserves
        .checked_add(net_sol)
        .ok_or(SourcererError::MathOverflow)?;
    curve.real_token_reserves = curve
        .real_token_reserves
        .checked_sub(tokens_out)
        .ok_or(SourcererError::MathOverflow)?;

    if curve.real_sol_reserves >= ctx.accounts.config.graduation_lamports {
        curve.complete = true;
    }

    emit!(Traded {
        mint: mint_key,
        trader: ctx.accounts.trader.key(),
        is_buy: true,
        sol_amount: sol_in,
        token_amount: tokens_out,
        fee_amount: fee,
        virtual_sol_reserves: curve.virtual_sol_reserves,
        virtual_token_reserves: curve.virtual_token_reserves,
        real_sol_reserves: curve.real_sol_reserves,
        real_token_reserves: curve.real_token_reserves,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

pub fn sell_handler(ctx: Context<Trade>, tokens_in: u64, min_sol_out: u64) -> Result<()> {
    require!(!ctx.accounts.bonding_curve.complete, SourcererError::Graduated);
    require!(tokens_in > 0, SourcererError::ZeroAmount);

    let curve = &ctx.accounts.bonding_curve;
    let gross_sol = sol_out_for_tokens_in(
        curve.virtual_sol_reserves,
        curve.virtual_token_reserves,
        tokens_in,
    )?;
    require!(
        gross_sol <= curve.real_sol_reserves,
        SourcererError::InsufficientCurveSol
    );

    let fee_bps = ctx.accounts.config.fee_bps;
    let (net_sol, fee) = apply_fee_bps(gross_sol, fee_bps)?;
    require!(net_sol >= min_sol_out, SourcererError::SlippageExceeded);

    spl_transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            SplTransfer {
                from: ctx.accounts.trader_token_account.to_account_info(),
                to: ctx.accounts.curve_token_vault.to_account_info(),
                authority: ctx.accounts.trader.to_account_info(),
            },
        ),
        tokens_in,
    )?;

    let mint_key = ctx.accounts.mint.key();
    let vault_bump = ctx.bumps.curve_sol_vault;
    let vault_seeds: &[&[u8]] = &[CURVE_VAULT_SEED, mint_key.as_ref(), &[vault_bump]];
    let vault_signer = &[vault_seeds];

    **ctx
        .accounts
        .curve_sol_vault
        .to_account_info()
        .try_borrow_mut_lamports()? -= gross_sol;
    **ctx
        .accounts
        .trader
        .to_account_info()
        .try_borrow_mut_lamports()? += net_sol;
    if fee > 0 {
        **ctx
            .accounts
            .fee_recipient
            .to_account_info()
            .try_borrow_mut_lamports()? += fee;
    }
    // Suppress unused-variable warning for vault_signer (reserved for future CPI variants).
    let _ = vault_signer;

    let curve = &mut ctx.accounts.bonding_curve;
    curve.virtual_sol_reserves = curve
        .virtual_sol_reserves
        .checked_sub(gross_sol)
        .ok_or(SourcererError::MathOverflow)?;
    curve.virtual_token_reserves = curve
        .virtual_token_reserves
        .checked_add(tokens_in)
        .ok_or(SourcererError::MathOverflow)?;
    curve.real_sol_reserves = curve
        .real_sol_reserves
        .checked_sub(gross_sol)
        .ok_or(SourcererError::MathOverflow)?;
    curve.real_token_reserves = curve
        .real_token_reserves
        .checked_add(tokens_in)
        .ok_or(SourcererError::MathOverflow)?;

    emit!(Traded {
        mint: mint_key,
        trader: ctx.accounts.trader.key(),
        is_buy: false,
        sol_amount: net_sol,
        token_amount: tokens_in,
        fee_amount: fee,
        virtual_sol_reserves: curve.virtual_sol_reserves,
        virtual_token_reserves: curve.virtual_token_reserves,
        real_sol_reserves: curve.real_sol_reserves,
        real_token_reserves: curve.real_token_reserves,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
