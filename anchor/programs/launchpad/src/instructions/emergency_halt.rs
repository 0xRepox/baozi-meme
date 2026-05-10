use anchor_lang::prelude::*;
use crate::state::MintState;
use crate::errors::LaunchpadError;

/// Authority-only emergency halt — instantly stops all minting by marking
/// the contract as graduated. Use if something goes wrong before mint-out.
/// SOL fees already went to treasury on each mint, so no SOL is recovered here.
#[derive(Accounts)]
pub struct EmergencyHalt<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"mint_state", mint_state.mint.as_ref()],
        bump = mint_state.bump,
        has_one = authority,
    )]
    pub mint_state: Account<'info, MintState>,
}

pub fn emergency_halt(ctx: Context<EmergencyHalt>) -> Result<()> {
    let ms = &mut ctx.accounts.mint_state;

    require!(!ms.graduated, LaunchpadError::AlreadyGraduated);

    ms.graduated = true;

    emit!(EmergencyHaltEvent {
        mint: ms.mint,
        authority: ctx.accounts.authority.key(),
        total_minted: ms.total_minted,
    });

    Ok(())
}

#[event]
pub struct EmergencyHaltEvent {
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub total_minted: u32,
}
