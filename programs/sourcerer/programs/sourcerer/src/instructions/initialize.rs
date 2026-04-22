use anchor_lang::prelude::*;

use crate::constants::{CONFIG_SEED, MAX_FEE_BPS};
use crate::errors::SourcererError;
use crate::state::Config;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        seeds = [CONFIG_SEED],
        bump,
        space = 8 + Config::INIT_SPACE,
    )]
    pub config: Account<'info, Config>,

    /// CHECK: fee recipient; any pubkey provided by admin
    pub fee_recipient: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>, fee_bps: u16, graduation_lamports: u64) -> Result<()> {
    require!(fee_bps <= MAX_FEE_BPS, SourcererError::FeeTooHigh);

    let config = &mut ctx.accounts.config;
    config.admin = ctx.accounts.admin.key();
    config.fee_recipient = ctx.accounts.fee_recipient.key();
    config.fee_bps = fee_bps;
    config.graduation_lamports = graduation_lamports;
    config.bump = ctx.bumps.config;
    Ok(())
}
