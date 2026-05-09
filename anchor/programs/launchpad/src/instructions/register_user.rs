use anchor_lang::prelude::*;
use crate::state::UserAccount;

#[derive(Accounts)]
pub struct RegisterUser<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = UserAccount::LEN,
        seeds = [b"user_account", user.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,

    pub system_program: Program<'info, System>,
}

pub fn register_user(ctx: Context<RegisterUser>) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;
    let clock = Clock::get()?;

    user_account.wallet = ctx.accounts.user.key();
    user_account.mints_used = 0;
    user_account.total_spent_lamports = 0;
    user_account.registered_at = clock.unix_timestamp;
    user_account.bump = ctx.bumps.user_account;

    Ok(())
}
