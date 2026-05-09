use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use crate::state::{BondingCurve, UserAccount, MINT_FEE_LAMPORTS, TOKENS_PER_MINT, TRADING_FEE_BPS, PUBLIC_MINT_CAP};
use crate::errors::LaunchpadError;

#[derive(Accounts)]
pub struct Buy<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user_account", user.key().as_ref()],
        bump = user_account.bump,
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        mut,
        seeds = [b"bonding_curve", mint.key().as_ref()],
        bump = bonding_curve.bump,
    )]
    pub bonding_curve: Box<Account<'info, BondingCurve>>,

    #[account(mut, address = bonding_curve.mint)]
    pub mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = bonding_curve,
    )]
    pub bonding_curve_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = user,
        token::mint = mint,
        token::authority = user,
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,

    /// CHECK: treasury receives mint fees and trading fees
    #[account(mut, address = bonding_curve.treasury)]
    pub treasury: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn buy(ctx: Context<Buy>, min_tokens_out: u64) -> Result<()> {
    let bonding_curve = &mut ctx.accounts.bonding_curve;
    let user_account = &mut ctx.accounts.user_account;

    require!(!bonding_curve.graduated, LaunchpadError::AlreadyGraduated);
    require!(user_account.can_mint(), LaunchpadError::MaxMintsReached);

    // Collect $2 mint fee → treasury
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
            },
        ),
        MINT_FEE_LAMPORTS,
    )?;

    // Calculate tokens out via bonding curve
    let tokens_out = TOKENS_PER_MINT;
    require!(tokens_out >= min_tokens_out, LaunchpadError::SlippageExceeded);

    // Calculate 1% trading fee on the bonding curve value of these tokens
    let sol_value = bonding_curve
        .get_sol_for_tokens(tokens_out)
        .ok_or(LaunchpadError::MathOverflow)?;
    let trading_fee = sol_value
        .checked_mul(TRADING_FEE_BPS)
        .and_then(|v| v.checked_div(10_000))
        .ok_or(LaunchpadError::MathOverflow)?;

    // Collect trading fee → treasury
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

    // Update bonding curve reserves
    bonding_curve.virtual_sol_reserves = bonding_curve
        .virtual_sol_reserves
        .checked_add(sol_value)
        .ok_or(LaunchpadError::MathOverflow)?;
    bonding_curve.virtual_token_reserves = bonding_curve
        .virtual_token_reserves
        .checked_sub(tokens_out)
        .ok_or(LaunchpadError::MathOverflow)?;
    bonding_curve.real_sol_reserves = bonding_curve
        .real_sol_reserves
        .checked_add(sol_value)
        .ok_or(LaunchpadError::MathOverflow)?;
    bonding_curve.real_token_reserves = bonding_curve
        .real_token_reserves
        .checked_add(tokens_out)
        .ok_or(LaunchpadError::MathOverflow)?;

    require!(
        bonding_curve.real_token_reserves <= PUBLIC_MINT_CAP,
        LaunchpadError::MaxMintsReached
    );

    // Mint tokens to user
    let mint_key = ctx.accounts.mint.key();
    let seeds = &[
        b"bonding_curve",
        mint_key.as_ref(),
        &[bonding_curve.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: bonding_curve.to_account_info(),
            },
            signer_seeds,
        ),
        tokens_out,
    )?;

    // Update user account
    user_account.mints_used = user_account.mints_used.checked_add(1).unwrap();
    user_account.total_spent_lamports = user_account
        .total_spent_lamports
        .checked_add(MINT_FEE_LAMPORTS.checked_add(trading_fee).unwrap())
        .ok_or(LaunchpadError::MathOverflow)?;

    Ok(())
}
