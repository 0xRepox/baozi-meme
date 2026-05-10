use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};
use crate::state::{MintState, LP_RESERVE};

/// Step 1: Create the MintState PDA and the SPL mint.
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = MintState::SPACE,
        seeds = [b"mint_state", mint.key().as_ref()],
        bump
    )]
    pub mint_state: Box<Account<'info, MintState>>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 6,
        mint::authority = mint_state,
    )]
    pub mint: Box<Account<'info, Mint>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let bump = ctx.bumps.mint_state;
    let ms = &mut ctx.accounts.mint_state;

    ms.mint = ctx.accounts.mint.key();
    ms.authority = ctx.accounts.authority.key();
    ms.total_minted = 0;
    ms.graduated = false;
    ms.bump = bump;

    Ok(())
}

/// Step 2: Create the mint_state token account and mint the LP reserve into it.
#[derive(Accounts)]
pub struct CreateMintStateTokenAccount<'info> {
    #[account(mut, constraint = payer.key() == mint_state.authority @ crate::errors::LaunchpadError::Unauthorized)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"mint_state", mint.key().as_ref()],
        bump = mint_state.bump,
    )]
    pub mint_state: Box<Account<'info, MintState>>,

    #[account(mut, address = mint_state.mint)]
    pub mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = payer,
        token::mint = mint,
        token::authority = mint_state,
    )]
    pub mint_state_token_account: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn create_mint_state_token_account(ctx: Context<CreateMintStateTokenAccount>) -> Result<()> {
    let mint_key = ctx.accounts.mint.key();
    let seeds: &[&[u8]] = &[b"mint_state", mint_key.as_ref(), &[ctx.accounts.mint_state.bump]];
    let signer_seeds = &[seeds];

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.mint_state_token_account.to_account_info(),
                authority: ctx.accounts.mint_state.to_account_info(),
            },
            signer_seeds,
        ),
        LP_RESERVE,
    )?;

    Ok(())
}
