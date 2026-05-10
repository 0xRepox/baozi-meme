use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};
use crate::state::{MintState, UserAccount, MINT_FEE_LAMPORTS, TOKENS_PER_MINT, MINT_CAP, MAX_MINTS_PER_USER};
use crate::errors::LaunchpadError;

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"mint_state", mint.key().as_ref()],
        bump = mint_state.bump,
    )]
    pub mint_state: Box<Account<'info, MintState>>,

    #[account(
        mut,
        seeds = [b"user_account", user.key().as_ref()],
        bump = user_account.bump,
    )]
    pub user_account: Box<Account<'info, UserAccount>>,

    #[account(mut, address = mint_state.mint)]
    pub mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = user,
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,

    /// CHECK: receives mint fees; validated as authority below.
    #[account(mut, constraint = treasury.key() == mint_state.authority @ LaunchpadError::Unauthorized)]
    pub treasury: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn mint_tokens(ctx: Context<MintTokens>, quantity: u8) -> Result<()> {
    require!(quantity > 0, LaunchpadError::ZeroAmount);

    // Snapshot immutable values before any &mut borrow.
    let graduated = ctx.accounts.mint_state.graduated;
    let total_minted = ctx.accounts.mint_state.total_minted;
    let mints_used = ctx.accounts.user_account.mints_used;
    let mint_key = ctx.accounts.mint.key();
    let bump = ctx.accounts.mint_state.bump;
    let user_key = ctx.accounts.user.key();

    require!(!graduated, LaunchpadError::AlreadyGraduated);
    require!(
        MINT_CAP.saturating_sub(total_minted) >= quantity as u32,
        LaunchpadError::MaxMintsReached
    );
    require!(
        mints_used.saturating_add(quantity) <= MAX_MINTS_PER_USER,
        LaunchpadError::MaxMintsReached
    );

    let total_fee = MINT_FEE_LAMPORTS
        .checked_mul(quantity as u64)
        .ok_or(LaunchpadError::MathOverflow)?;

    require!(
        ctx.accounts.user.lamports() >= total_fee,
        LaunchpadError::InsufficientFee
    );

    let tokens_out = TOKENS_PER_MINT
        .checked_mul(quantity as u64)
        .ok_or(LaunchpadError::MathOverflow)?;

    // Transfer SOL fee to treasury.
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
            },
        ),
        total_fee,
    )?;

    // Mint tokens — use mint_state.to_account_info() directly (no &mut alias held).
    let seeds: &[&[u8]] = &[b"mint_state", mint_key.as_ref(), &[bump]];
    let signer_seeds = &[seeds];

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.mint_state.to_account_info(),
            },
            signer_seeds,
        ),
        tokens_out,
    )?;

    // Update state after CPIs complete.
    let new_total = total_minted
        .checked_add(quantity as u32)
        .ok_or(LaunchpadError::MathOverflow)?;

    ctx.accounts.mint_state.total_minted = new_total;
    ctx.accounts.mint_state.graduated = new_total >= MINT_CAP;

    ctx.accounts.user_account.mints_used = mints_used
        .checked_add(quantity)
        .ok_or(LaunchpadError::MathOverflow)?;

    ctx.accounts.user_account.total_spent_lamports = ctx
        .accounts
        .user_account
        .total_spent_lamports
        .checked_add(total_fee)
        .ok_or(LaunchpadError::MathOverflow)?;

    emit!(MintEvent {
        mint: mint_key,
        user: user_key,
        quantity,
        tokens_out,
        sol_paid: total_fee,
        total_minted: new_total,
    });

    Ok(())
}

#[event]
pub struct MintEvent {
    pub mint: Pubkey,
    pub user: Pubkey,
    pub quantity: u8,
    pub tokens_out: u64,
    pub sol_paid: u64,
    pub total_minted: u32,
}
