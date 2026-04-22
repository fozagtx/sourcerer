use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::metadata::{
    create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3,
    Metadata,
};
use anchor_spl::token::{mint_to, Mint, MintTo, Token, TokenAccount};

use crate::constants::{
    BONDING_CURVE_SEED, CURVE_TOKEN_SUPPLY, CURVE_VAULT_SEED, TOKEN_DECIMALS, TOTAL_SUPPLY,
    VIRTUAL_SOL_RESERVES, VIRTUAL_TOKEN_RESERVES,
};
use crate::errors::SourcererError;
use crate::state::{BondingCurve, TokenCreated};

#[derive(Accounts)]
pub struct CreateToken<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = bonding_curve,
        mint::freeze_authority = bonding_curve,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = creator,
        seeds = [BONDING_CURVE_SEED, mint.key().as_ref()],
        bump,
        space = 8 + BondingCurve::INIT_SPACE,
    )]
    pub bonding_curve: Account<'info, BondingCurve>,

    #[account(
        init,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = bonding_curve,
    )]
    pub curve_token_vault: Account<'info, TokenAccount>,

    /// SOL vault PDA that holds curve lamports.
    /// CHECK: PDA holding SOL, validated by seeds.
    #[account(
        mut,
        seeds = [CURVE_VAULT_SEED, mint.key().as_ref()],
        bump,
    )]
    pub curve_sol_vault: UncheckedAccount<'info>,

    /// CHECK: validated by metadata program CPI
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    pub token_metadata_program: Program<'info, Metadata>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<CreateToken>,
    name: String,
    symbol: String,
    uri: String,
) -> Result<()> {
    require!(!name.is_empty() && name.len() <= 32, SourcererError::BadName);
    require!(!symbol.is_empty() && symbol.len() <= 10, SourcererError::BadSymbol);
    require!(!uri.is_empty() && uri.len() <= 200, SourcererError::BadUri);

    let mint_key = ctx.accounts.mint.key();
    let bump = ctx.bumps.bonding_curve;
    let seeds: &[&[u8]] = &[BONDING_CURVE_SEED, mint_key.as_ref(), &[bump]];
    let signer_seeds = &[seeds];

    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.curve_token_vault.to_account_info(),
                authority: ctx.accounts.bonding_curve.to_account_info(),
            },
            signer_seeds,
        ),
        TOTAL_SUPPLY,
    )?;

    create_metadata_accounts_v3(
        CpiContext::new_with_signer(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.metadata.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                mint_authority: ctx.accounts.bonding_curve.to_account_info(),
                update_authority: ctx.accounts.bonding_curve.to_account_info(),
                payer: ctx.accounts.creator.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
            signer_seeds,
        ),
        DataV2 {
            name: name.clone(),
            symbol: symbol.clone(),
            uri: uri.clone(),
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        },
        true,
        true,
        None,
    )?;

    let curve = &mut ctx.accounts.bonding_curve;
    curve.mint = mint_key;
    curve.creator = ctx.accounts.creator.key();
    curve.virtual_sol_reserves = VIRTUAL_SOL_RESERVES;
    curve.virtual_token_reserves = VIRTUAL_TOKEN_RESERVES;
    curve.real_sol_reserves = 0;
    curve.real_token_reserves = CURVE_TOKEN_SUPPLY;
    curve.total_supply = TOTAL_SUPPLY;
    curve.complete = false;
    curve.created_at = Clock::get()?.unix_timestamp;
    curve.bump = bump;

    emit!(TokenCreated {
        mint: mint_key,
        creator: curve.creator,
        name,
        symbol,
        uri,
        timestamp: curve.created_at,
    });

    Ok(())
}
