use anchor_lang::prelude::*;

#[error_code]
pub enum LaunchpadError {
    #[msg("Max mints per account reached (10)")]
    MaxMintsReached,
    #[msg("Insufficient SOL for mint fee")]
    InsufficientFee,
    #[msg("Token already graduated to DEX")]
    AlreadyGraduated,
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
    #[msg("Bonding curve is not ready to graduate")]
    NotReadyToGraduate,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Zero amount not allowed")]
    ZeroAmount,
    #[msg("Unauthorized")]
    Unauthorized,
}
