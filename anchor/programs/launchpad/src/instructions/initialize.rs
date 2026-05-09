use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::{BondingCurve, VIRTUAL_SOL_RESERVES, VIRTUAL_TOKEN_RESERVES, TOKEN_TOTAL_SUPPLY};

// Step 1: Creates the bonding curve state + mint only.
// The curve's token account is created in create_curve_token_account (step 2).
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = BondingCurve::LEN,
        seeds = [b"bonding_curve", mint.key().as_ref()],
        bump
    )]
    pub bonding_curve: Box<Account<'info, BondingCurve>>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 6,
        mint::authority = bonding_curve,
    )]
    pub mint: Box<Account<'info, Mint>>,

    /// CHECK: treasury wallet receives fees
    pub treasury: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let bump = ctx.bumps.bonding_curve;
    let bc = &mut ctx.accounts.bonding_curve;

    bc.mint = ctx.accounts.mint.key();
    bc.authority = ctx.accounts.authority.key();
    bc.treasury = ctx.accounts.treasury.key();
    bc.virtual_sol_reserves = VIRTUAL_SOL_RESERVES;
    bc.virtual_token_reserves = VIRTUAL_TOKEN_RESERVES;
    bc.real_sol_reserves = 0;
    bc.real_token_reserves = 0;
    bc.token_total_supply = TOKEN_TOTAL_SUPPLY;
    bc.graduated = false;
    bc.bump = bump;

    Ok(())
}

// Step 2: Creates the bonding curve's token account after initialization.
#[derive(Accounts)]
#[instruction()]
pub struct CreateCurveTokenAccount<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        seeds = [b"bonding_curve", mint.key().as_ref()],
        bump = bonding_curve.bump,
    )]
    pub bonding_curve: Box<Account<'info, BondingCurve>>,

    #[account(address = bonding_curve.mint)]
    pub mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = payer,
        token::mint = mint,
        token::authority = bonding_curve,
    )]
    pub bonding_curve_token_account: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn create_curve_token_account(_ctx: Context<CreateCurveTokenAccount>) -> Result<()> {
    Ok(())
}
