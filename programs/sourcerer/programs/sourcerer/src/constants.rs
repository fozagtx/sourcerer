use anchor_lang::prelude::*;

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";

#[constant]
pub const BONDING_CURVE_SEED: &[u8] = b"bonding-curve";

#[constant]
pub const CURVE_VAULT_SEED: &[u8] = b"curve-vault";

#[constant]
pub const MINT_AUTHORITY_SEED: &[u8] = b"mint-authority";

/// Total supply minted into the curve: 1,000,000,000 tokens * 10^6 (decimals=6).
pub const TOTAL_SUPPLY: u64 = 1_000_000_000_000_000;

/// Tokens available on the bonding curve (793.1M) before graduation.
pub const CURVE_TOKEN_SUPPLY: u64 = 793_100_000_000_000;

/// Virtual SOL reserves seed (30 SOL in lamports).
pub const VIRTUAL_SOL_RESERVES: u64 = 30_000_000_000;

/// Virtual token reserves seed (1,073,000,000 tokens with 6 decimals).
pub const VIRTUAL_TOKEN_RESERVES: u64 = 1_073_000_000_000_000;

/// Decimals used for every token minted by Sourcerer.
pub const TOKEN_DECIMALS: u8 = 6;

/// Maximum fee in basis points (5%).
pub const MAX_FEE_BPS: u16 = 500;
