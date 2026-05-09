use anchor_lang::prelude::*;

pub const VIRTUAL_SOL_RESERVES: u64 = 30_000_000_000; // 30 SOL in lamports
pub const VIRTUAL_TOKEN_RESERVES: u64 = 10_000_000_000_000_000; // 10B tokens (6 decimals)
pub const TOKEN_TOTAL_SUPPLY: u64 = 10_000_000_000_000_000; // 10B max supply (6 decimals)
pub const PUBLIC_MINT_CAP: u64 = 5_000_000_000_000_000; // 5B public mint (50%)
pub const LP_RESERVE: u64 = 5_000_000_000_000_000; // 5B LP reserve at graduation (50%)
pub const TRADING_FEE_BPS: u64 = 100; // 1% fee on buys/sells (100 basis points)
pub const GRADUATION_SOL_THRESHOLD: u64 = 85_000_000_000; // 85 SOL in lamports
pub const MINT_FEE_LAMPORTS: u64 = 2_000_000; // ~$2 in SOL (adjust per price)
pub const MAX_MINTS_PER_USER: u8 = 10;
pub const TOKENS_PER_MINT: u64 = 250_000_000_000; // 250K tokens per mint (6 decimals)

#[account]
pub struct BondingCurve {
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub virtual_sol_reserves: u64,
    pub virtual_token_reserves: u64,
    pub real_sol_reserves: u64,
    pub real_token_reserves: u64,
    pub token_total_supply: u64,
    pub graduated: bool,
    pub bump: u8,
}

impl BondingCurve {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 1 + 1;

    // x * y = k constant product formula
    // Returns how many tokens you get for `sol_amount` lamports
    pub fn get_tokens_for_sol(&self, sol_amount: u64) -> Option<u64> {
        let k = (self.virtual_sol_reserves as u128)
            .checked_mul(self.virtual_token_reserves as u128)?;

        let new_sol = (self.virtual_sol_reserves as u128).checked_add(sol_amount as u128)?;
        let new_tokens = k.checked_div(new_sol)?;
        let tokens_out = (self.virtual_token_reserves as u128).checked_sub(new_tokens)?;

        u64::try_from(tokens_out).ok()
    }

    // Returns how many lamports you get for `token_amount` tokens
    pub fn get_sol_for_tokens(&self, token_amount: u64) -> Option<u64> {
        let k = (self.virtual_sol_reserves as u128)
            .checked_mul(self.virtual_token_reserves as u128)?;

        let new_tokens = (self.virtual_token_reserves as u128)
            .checked_add(token_amount as u128)?;
        let new_sol = k.checked_div(new_tokens)?;
        let sol_out = (self.virtual_sol_reserves as u128).checked_sub(new_sol)?;

        u64::try_from(sol_out).ok()
    }

    pub fn current_price_lamports_per_token(&self) -> u64 {
        if self.virtual_token_reserves == 0 {
            return 0;
        }
        self.virtual_sol_reserves / self.virtual_token_reserves
    }

    pub fn should_graduate(&self) -> bool {
        self.real_sol_reserves >= GRADUATION_SOL_THRESHOLD
    }
}
