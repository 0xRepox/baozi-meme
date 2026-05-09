use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::BondingCurve;
use crate::errors::LaunchpadError;

// Graduation creates a Raydium CLMM pool and burns LP tokens.
// Full Raydium CPI integration requires their SDK — stubbed here,
// to be wired up once the program core is verified on devnet.

#[derive(Accounts)]
pub struct Graduate<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"bonding_curve", mint.key().as_ref()],
        bump = bonding_curve.bump,
        has_one = authority,
    )]
    pub bonding_curve: Account<'info, BondingCurve>,

    #[account(mut, address = bonding_curve.mint)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = bonding_curve,
    )]
    pub bonding_curve_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn graduate(ctx: Context<Graduate>) -> Result<()> {
    let bonding_curve = &mut ctx.accounts.bonding_curve;

    require!(!bonding_curve.graduated, LaunchpadError::AlreadyGraduated);
    require!(bonding_curve.should_graduate(), LaunchpadError::NotReadyToGraduate);

    // Mark as graduated — halts all buys/sells on this program
    bonding_curve.graduated = true;

    // TODO: CPI into Raydium CLMM to create pool with:
    //   - bonding_curve.real_sol_reserves (collected SOL)
    //   - LP_RESERVE tokens (5B minted fresh for the pool)
    // Then burn LP tokens to lock liquidity permanently.

    emit!(GraduationEvent {
        mint: bonding_curve.mint,
        sol_raised: bonding_curve.real_sol_reserves,
        tokens_sold: bonding_curve.real_token_reserves,
    });

    Ok(())
}

#[event]
pub struct GraduationEvent {
    pub mint: Pubkey,
    pub sol_raised: u64,
    pub tokens_sold: u64,
}
