use anchor_lang::prelude::*;
use crate::state::MintState;

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"mint_state", mint_state.mint.as_ref()],
        bump = mint_state.bump,
        has_one = authority,
    )]
    pub mint_state: Account<'info, MintState>,

    /// CHECK: caller is responsible for providing a valid, accessible pubkey.
    pub new_authority: UncheckedAccount<'info>,
}

pub fn transfer_authority(ctx: Context<TransferAuthority>) -> Result<()> {
    ctx.accounts.mint_state.authority = ctx.accounts.new_authority.key();

    emit!(AuthorityTransferredEvent {
        mint: ctx.accounts.mint_state.mint,
        old_authority: ctx.accounts.authority.key(),
        new_authority: ctx.accounts.new_authority.key(),
    });

    Ok(())
}

#[event]
pub struct AuthorityTransferredEvent {
    pub mint: Pubkey,
    pub old_authority: Pubkey,
    pub new_authority: Pubkey,
}
