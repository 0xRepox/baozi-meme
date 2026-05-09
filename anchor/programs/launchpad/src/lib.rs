use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("BBP3vz9Bm4Fx21UZmmWAoykL4shNbTxCrAXtmUrBMEuV");

#[program]
pub mod launchpad {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::initialize(ctx)
    }

    pub fn create_curve_token_account(ctx: Context<CreateCurveTokenAccount>) -> Result<()> {
        instructions::initialize::create_curve_token_account(ctx)
    }

    pub fn register_user(ctx: Context<RegisterUser>) -> Result<()> {
        instructions::register_user::register_user(ctx)
    }

    pub fn buy(ctx: Context<Buy>, min_tokens_out: u64) -> Result<()> {
        instructions::buy::buy(ctx, min_tokens_out)
    }

    pub fn sell(ctx: Context<Sell>, token_amount: u64, min_sol_out: u64) -> Result<()> {
        instructions::sell::sell(ctx, token_amount, min_sol_out)
    }

    pub fn graduate(ctx: Context<Graduate>) -> Result<()> {
        instructions::graduate::graduate(ctx)
    }
}
