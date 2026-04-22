use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod curve;
pub mod state;
pub mod instructions;

use instructions::*;

declare_id!("Sourcerer1111111111111111111111111111111111");

#[program]
pub mod sourcerer {
    use super::*;

    /// Initialize the global config (fee recipient, fee bps, graduation threshold).
    pub fn initialize(ctx: Context<Initialize>, fee_bps: u16, graduation_lamports: u64) -> Result<()> {
        instructions::initialize::handler(ctx, fee_bps, graduation_lamports)
    }

    /// Create a new Token-2022 mint with metadata and a bonding-curve PDA.
    pub fn create_token(
        ctx: Context<CreateToken>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        instructions::create_token::handler(ctx, name, symbol, uri)
    }

    /// Buy tokens with SOL along the virtual constant-product curve.
    pub fn buy(ctx: Context<Trade>, sol_in: u64, min_tokens_out: u64) -> Result<()> {
        instructions::trade::buy_handler(ctx, sol_in, min_tokens_out)
    }

    /// Sell tokens for SOL along the virtual constant-product curve.
    pub fn sell(ctx: Context<Trade>, tokens_in: u64, min_sol_out: u64) -> Result<()> {
        instructions::trade::sell_handler(ctx, tokens_in, min_sol_out)
    }

    /// Permissionlessly graduate a token: seed Raydium pool, burn LP, revoke authorities.
    /// Minimal on-chain portion marks the curve complete; Raydium CPI is done via a helper script.
    pub fn graduate(ctx: Context<Graduate>) -> Result<()> {
        instructions::graduate::handler(ctx)
    }
}
