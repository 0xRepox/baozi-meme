use anchor_lang::prelude::*;

pub const MINT_FEE_LAMPORTS: u64 = 22_000_000;        // 0.022 SOL per mint
pub const TOKENS_PER_MINT: u64  = 250_000_000_000;    // 250,000 tokens (6 decimals)
pub const MINT_CAP: u32         = 20_000;              // total slots
pub const MAX_MINTS_PER_USER: u8 = 10;
pub const LP_RESERVE: u64       = 5_000_000_000_000_000; // 5B tokens for Meteora LP

#[account]
pub struct MintState {
    pub mint:          Pubkey,
    pub authority:     Pubkey,
    pub total_minted:  u32,
    pub graduated:     bool,
    pub bump:          u8,
}

impl MintState {
    pub const SPACE: usize = 8 + 32 + 32 + 4 + 1 + 1; // 78 (includes discriminator)

    pub fn slots_remaining(&self) -> u32 {
        MINT_CAP.saturating_sub(self.total_minted)
    }

    pub fn is_complete(&self) -> bool {
        self.total_minted >= MINT_CAP
    }
}

#[account]
pub struct UserAccount {
    pub wallet:               Pubkey,
    pub mints_used:           u8,
    pub total_spent_lamports: u64,
    pub registered_at:        i64,
    pub bump:                 u8,
}

impl UserAccount {
    pub const SPACE: usize = 8 + 32 + 1 + 8 + 8 + 1; // 58 (includes discriminator)

    pub fn mints_remaining(&self) -> u8 {
        MAX_MINTS_PER_USER.saturating_sub(self.mints_used)
    }

    pub fn can_mint(&self, quantity: u8) -> bool {
        self.mints_used.saturating_add(quantity) <= MAX_MINTS_PER_USER
    }
}
