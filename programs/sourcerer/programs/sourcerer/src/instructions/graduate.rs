use anchor_lang::prelude::*;
use anchor_spl::token::{set_authority, spl_token::instruction::AuthorityType, Mint, SetAuthority, Token, TokenAccount};

use crate::constants::{BONDING_CURVE_SEED, CONFIG_SEED, CURVE_VAULT_SEED};
use crate::errors::SourcererError;
use crate::state::{BondingCurve, Config, Graduated};

/// On-chain graduation step. Marks the curve complete, revokes mint/freeze authority.
/// Pool seeding happens in an off-chain helper (apps/indexer/src/graduator.ts) that CPIs into
/// Raydium CPMM using the curve vault as source of liquidity. Keeping this instruction minimal
/// avoids pulling the large Raydium crate into this program.
#[derive(Accounts)]
pub struct Graduate<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,

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

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Graduate>) -> Result<()> {
    let curve = &mut ctx.accounts.bonding_curve;
    require!(
        curve.real_sol_reserves >= ctx.accounts.config.graduation_lamports || curve.complete,
        SourcererError::NotReadyToGraduate
    );
    require!(!curve.complete || curve.real_sol_reserves > 0, SourcererError::Graduated);

    let mint_key = ctx.accounts.mint.key();
    let bump = curve.bump;
    let seeds: &[&[u8]] = &[BONDING_CURVE_SEED, mint_key.as_ref(), &[bump]];
    let signer_seeds = &[seeds];

    set_authority(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            SetAuthority {
                current_authority: ctx.accounts.bonding_curve.to_account_info(),
                account_or_mint: ctx.accounts.mint.to_account_info(),
                },
            signer_seeds,
        ),
        AuthorityType::MintTokens,
        None,
    )?;
    set_authority(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            SetAuthority {
                current_authority: ctx.accounts.bonding_curve.to_account_info(),
                account_or_mint: ctx.accounts.mint.to_account_info(),
            },
            signer_seeds,
        ),
        AuthorityType::FreezeAccount,
        None,
    )?;

    let sol_amount = curve.real_sol_reserves;
    let token_amount = ctx.accounts.curve_token_vault.amount;

    curve.complete = true;

    emit!(Graduated {
        mint: mint_key,
        sol_amount,
        token_amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
