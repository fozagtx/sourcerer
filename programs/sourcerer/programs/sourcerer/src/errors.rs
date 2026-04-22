use anchor_lang::prelude::*;

#[error_code]
pub enum SourcererError {
    #[msg("Fee bps exceeds maximum")] 
    FeeTooHigh,
    #[msg("Name must be 1-32 chars")] 
    BadName,
    #[msg("Symbol must be 1-10 chars")] 
    BadSymbol,
    #[msg("Uri must be 1-200 chars")] 
    BadUri,
    #[msg("Curve already graduated")] 
    Graduated,
    #[msg("Zero input amount")] 
    ZeroAmount,
    #[msg("Slippage exceeded - output below min")] 
    SlippageExceeded,
    #[msg("Insufficient tokens in curve")] 
    InsufficientCurveTokens,
    #[msg("Insufficient SOL in curve")] 
    InsufficientCurveSol,
    #[msg("Curve not ready to graduate")] 
    NotReadyToGraduate,
    #[msg("Math overflow")] 
    MathOverflow,
}
