use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::BondingCurve;
use crate::errors::LaunchpadError;

/// Emergency authority-only drain of the bonding curve PDA.
/// Use if LP seeding on Meteora fails permanently and SOL would otherwise be
/// locked forever. Marks the curve graduated so no further mints can occur.
#[derive(Accounts)]
pub struct EmergencyWithdraw<'info> {
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

    /// Where the recovered SOL lands — must be authority or a designated wallet.
    /// CHECK: validated as authority below.
    #[account(mut, constraint = recipient.key() == authority.key() @ LaunchpadError::Unauthorized)]
    pub recipient: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn emergency_withdraw(ctx: Context<EmergencyWithdraw>) -> Result<()> {
    let bonding_curve = &mut ctx.accounts.bonding_curve;

    require!(!bonding_curve.graduated, LaunchpadError::AlreadyGraduated);

    // Lock the curve so no further mints can happen after this.
    bonding_curve.graduated = true;

    let curve_info = bonding_curve.to_account_info();
    let rent = Rent::get()?;
    let rent_exempt = rent.minimum_balance(BondingCurve::LEN + 8);
    let withdrawable = curve_info.lamports().saturating_sub(rent_exempt);

    if withdrawable > 0 {
        **curve_info.lamports.borrow_mut() -= withdrawable;
        **ctx.accounts.recipient.lamports.borrow_mut() += withdrawable;
    }

    emit!(EmergencyWithdrawEvent {
        mint: bonding_curve.mint,
        authority: ctx.accounts.authority.key(),
        sol_recovered: withdrawable,
    });

    Ok(())
}

#[event]
pub struct EmergencyWithdrawEvent {
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub sol_recovered: u64,
}
