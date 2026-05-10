use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::{BondingCurve, GRADUATION_SOL_THRESHOLD};
use crate::errors::LaunchpadError;

// Graduation drains the bonding curve PDA escrow:
//   85 SOL → Raydium CLMM pool (CPI stubbed, currently sent to authority)
//   Remaining → treasury as dev revenue
// Full Raydium CPI to be wired once program core is verified on devnet.

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

    bonding_curve.graduated = true;

    // All escrowed mint fees → Raydium LP. Dev earns 0 from mints — only trading fees.
    let curve_info = bonding_curve.to_account_info();
    let rent = Rent::get()?;
    let rent_exempt = rent.minimum_balance(BondingCurve::LEN + 8);
    let to_raydium = curve_info.lamports().saturating_sub(rent_exempt);

    // TODO: replace with Raydium CLMM CPI — pair to_raydium SOL + LP_RESERVE tokens,
    // then lock LP tokens via Streamflow. Temporarily credited to authority.
    if to_raydium > 0 {
        **curve_info.lamports.borrow_mut() -= to_raydium;
        **ctx.accounts.authority.lamports.borrow_mut() += to_raydium;
    }

    emit!(GraduationEvent {
        mint: bonding_curve.mint,
        sol_raised: bonding_curve.real_sol_reserves,
        tokens_sold: bonding_curve.real_token_reserves,
        to_raydium,
    });

    Ok(())
}

#[event]
pub struct GraduationEvent {
    pub mint: Pubkey,
    pub sol_raised: u64,
    pub tokens_sold: u64,
    pub to_raydium: u64,
}
