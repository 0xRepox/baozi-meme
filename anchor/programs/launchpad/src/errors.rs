use anchor_lang::prelude::*;

#[error_code]
pub enum LaunchpadError {
    #[msg("Max mints per account reached (10)")]
    MaxMintsReached,
    #[msg("Insufficient SOL for mint fee")]
    InsufficientFee,
    #[msg("Minting is closed")]
    AlreadyGraduated,
    #[msg("Not ready to graduate — mint cap not reached")]
    NotReadyToGraduate,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Zero amount not allowed")]
    ZeroAmount,
    #[msg("Unauthorized")]
    Unauthorized,
}
