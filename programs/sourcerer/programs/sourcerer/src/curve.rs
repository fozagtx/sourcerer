use crate::errors::SourcererError;
use anchor_lang::prelude::*;

/// Compute tokens out when depositing `sol_in` lamports (net of fees).
/// Uses virtual constant-product reserves (x * y = k).
///
/// tokens_out = virtual_tokens - (virtual_sol * virtual_tokens) / (virtual_sol + sol_in)
pub fn tokens_out_for_sol_in(
    virtual_sol: u64,
    virtual_tokens: u64,
    sol_in: u64,
) -> Result<u64> {
    let vs = virtual_sol as u128;
    let vt = virtual_tokens as u128;
    let si = sol_in as u128;

    let k = vs.checked_mul(vt).ok_or(SourcererError::MathOverflow)?;
    let new_vs = vs.checked_add(si).ok_or(SourcererError::MathOverflow)?;
    let new_vt = k.checked_div(new_vs).ok_or(SourcererError::MathOverflow)?;
    let out = vt.checked_sub(new_vt).ok_or(SourcererError::MathOverflow)?;
    Ok(out as u64)
}

/// Compute SOL out when selling `tokens_in` base units (net of fees).
/// sol_out = virtual_sol - (virtual_sol * virtual_tokens) / (virtual_tokens + tokens_in)
pub fn sol_out_for_tokens_in(
    virtual_sol: u64,
    virtual_tokens: u64,
    tokens_in: u64,
) -> Result<u64> {
    let vs = virtual_sol as u128;
    let vt = virtual_tokens as u128;
    let ti = tokens_in as u128;

    let k = vs.checked_mul(vt).ok_or(SourcererError::MathOverflow)?;
    let new_vt = vt.checked_add(ti).ok_or(SourcererError::MathOverflow)?;
    let new_vs = k.checked_div(new_vt).ok_or(SourcererError::MathOverflow)?;
    let out = vs.checked_sub(new_vs).ok_or(SourcererError::MathOverflow)?;
    Ok(out as u64)
}

/// Apply a basis-point fee and return (amount_after_fee, fee_amount).
pub fn apply_fee_bps(amount: u64, fee_bps: u16) -> Result<(u64, u64)> {
    let fee = (amount as u128)
        .checked_mul(fee_bps as u128)
        .ok_or(SourcererError::MathOverflow)?
        .checked_div(10_000)
        .ok_or(SourcererError::MathOverflow)? as u64;
    let net = amount.checked_sub(fee).ok_or(SourcererError::MathOverflow)?;
    Ok((net, fee))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::constants::{VIRTUAL_SOL_RESERVES, VIRTUAL_TOKEN_RESERVES};

    #[test]
    fn small_buy_sanity() {
        let out = tokens_out_for_sol_in(VIRTUAL_SOL_RESERVES, VIRTUAL_TOKEN_RESERVES, 1_000_000_000).unwrap();
        assert!(out > 0);
    }

    #[test]
    fn buy_then_sell_roundtrip_lossless_ignoring_fees() {
        let vs = VIRTUAL_SOL_RESERVES;
        let vt = VIRTUAL_TOKEN_RESERVES;
        let sol_in = 2_500_000_000u64;
        let tokens = tokens_out_for_sol_in(vs, vt, sol_in).unwrap();

        let new_vs = vs + sol_in;
        let new_vt = vt - tokens;
        let sol_back = sol_out_for_tokens_in(new_vs, new_vt, tokens).unwrap();
        let drift = sol_in as i128 - sol_back as i128;
        assert!(drift.abs() <= 2, "drift too large: {}", drift);
    }
}
