use anchor_lang::prelude::*;
use crate::state::bonding_curve::MAX_MINTS_PER_USER;

#[account]
pub struct UserAccount {
    pub wallet: Pubkey,
    pub mints_used: u8,
    pub total_spent_lamports: u64,
    pub registered_at: i64,
    pub bump: u8,
}

impl UserAccount {
    pub const LEN: usize = 8 + 32 + 1 + 8 + 8 + 1;

    pub fn mints_remaining(&self) -> u8 {
        MAX_MINTS_PER_USER.saturating_sub(self.mints_used)
    }

    pub fn can_mint(&self) -> bool {
        self.mints_used < MAX_MINTS_PER_USER
    }
}
