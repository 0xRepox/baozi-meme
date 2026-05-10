use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use crate::state::BondingCurve;
use crate::errors::LaunchpadError;

#[derive(Accounts)]
pub struct Sell<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"bonding_curve", mint.key().as_ref()],
        bump = bonding_curve.bump,
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

    #[account(
        mut,
        token::mint = mint,
        token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn sell(ctx: Context<Sell>, token_amount: u64, min_sol_out: u64) -> Result<()> {
    let bonding_curve = &mut ctx.accounts.bonding_curve;

    require!(!bonding_curve.graduated, LaunchpadError::AlreadyGraduated);
    require!(token_amount > 0, LaunchpadError::ZeroAmount);

    // SOL out — no fee deducted, full AMM value returned to seller
    let sol_out = bonding_curve
        .get_sol_for_tokens(token_amount)
        .ok_or(LaunchpadError::MathOverflow)?;

    require!(sol_out >= min_sol_out, LaunchpadError::SlippageExceeded);

    // Burn user's tokens
    let mint_key = ctx.accounts.mint.key();
    let seeds = &[b"bonding_curve", mint_key.as_ref(), &[bonding_curve.bump]];
    let signer_seeds = &[&seeds[..]];

    token::burn(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::Burn {
                mint: ctx.accounts.mint.to_account_info(),
                from: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
            signer_seeds,
        ),
        token_amount,
    )?;

    // Update reserves
    bonding_curve.virtual_sol_reserves = bonding_curve
        .virtual_sol_reserves
        .checked_sub(sol_out)
        .ok_or(LaunchpadError::MathOverflow)?;
    bonding_curve.virtual_token_reserves = bonding_curve
        .virtual_token_reserves
        .checked_add(token_amount)
        .ok_or(LaunchpadError::MathOverflow)?;
    bonding_curve.real_sol_reserves = bonding_curve
        .real_sol_reserves
        .checked_sub(sol_out)
        .ok_or(LaunchpadError::MathOverflow)?;
    bonding_curve.real_token_reserves = bonding_curve
        .real_token_reserves
        .checked_sub(token_amount)
        .ok_or(LaunchpadError::MathOverflow)?;

    // Return full SOL to user — direct lamport transfer from PDA
    **bonding_curve.to_account_info().try_borrow_mut_lamports()? -= sol_out;
    **ctx.accounts.user.try_borrow_mut_lamports()? += sol_out;

    Ok(())
}
