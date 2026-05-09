use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use crate::state::{BondingCurve, TRADING_FEE_BPS};
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

    /// CHECK: treasury receives trading fees
    #[account(mut, address = bonding_curve.treasury)]
    pub treasury: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn sell(ctx: Context<Sell>, token_amount: u64, min_sol_out: u64) -> Result<()> {
    let bonding_curve = &mut ctx.accounts.bonding_curve;

    require!(!bonding_curve.graduated, LaunchpadError::AlreadyGraduated);
    require!(token_amount > 0, LaunchpadError::ZeroAmount);

    // Calculate SOL out via bonding curve
    let sol_out_gross = bonding_curve
        .get_sol_for_tokens(token_amount)
        .ok_or(LaunchpadError::MathOverflow)?;

    // Deduct 1% trading fee
    let trading_fee = sol_out_gross
        .checked_mul(TRADING_FEE_BPS)
        .and_then(|v| v.checked_div(10_000))
        .ok_or(LaunchpadError::MathOverflow)?;
    let sol_out_net = sol_out_gross
        .checked_sub(trading_fee)
        .ok_or(LaunchpadError::MathOverflow)?;

    require!(sol_out_net >= min_sol_out, LaunchpadError::SlippageExceeded);

    // Burn user's tokens
    let mint_key = ctx.accounts.mint.key();
    let seeds = &[
        b"bonding_curve",
        mint_key.as_ref(),
        &[bonding_curve.bump],
    ];
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

    // Update bonding curve reserves
    bonding_curve.virtual_sol_reserves = bonding_curve
        .virtual_sol_reserves
        .checked_sub(sol_out_gross)
        .ok_or(LaunchpadError::MathOverflow)?;
    bonding_curve.virtual_token_reserves = bonding_curve
        .virtual_token_reserves
        .checked_add(token_amount)
        .ok_or(LaunchpadError::MathOverflow)?;
    bonding_curve.real_sol_reserves = bonding_curve
        .real_sol_reserves
        .checked_sub(sol_out_gross)
        .ok_or(LaunchpadError::MathOverflow)?;
    bonding_curve.real_token_reserves = bonding_curve
        .real_token_reserves
        .checked_sub(token_amount)
        .ok_or(LaunchpadError::MathOverflow)?;

    // Send SOL to user (net of fee)
    **bonding_curve.to_account_info().try_borrow_mut_lamports()? -= sol_out_net;
    **ctx.accounts.user.try_borrow_mut_lamports()? += sol_out_net;

    // Send fee to treasury
    if trading_fee > 0 {
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
            ),
            trading_fee,
        )?;
    }

    Ok(())
}
