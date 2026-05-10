use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use mpl_token_metadata::{
    instructions::{CreateV1Builder, CreateV1InstructionArgs},
    types::{TokenStandard, PrintSupply},
};

#[derive(Accounts)]
pub struct CreateMetadata<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"mint_state", mint.key().as_ref()],
        bump = mint_state.bump,
        has_one = authority,
    )]
    pub mint_state: Account<'info, crate::state::MintState>,

    #[account(mut, address = mint_state.mint)]
    pub mint: Account<'info, Mint>,

    /// CHECK: created by Metaplex CPI
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: Metaplex Token Metadata program
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: sysvar
    pub sysvar_instructions: UncheckedAccount<'info>,
}

pub fn create_metadata(
    ctx: Context<CreateMetadata>,
    name: String,
    symbol: String,
    uri: String,
) -> Result<()> {
    let mint_key = ctx.accounts.mint.key();
    let bump = ctx.accounts.mint_state.bump;
    let seeds: &[&[u8]] = &[b"mint_state", mint_key.as_ref(), &[bump]];
    let signer_seeds = &[seeds];

    let ix = CreateV1Builder::new()
        .metadata(ctx.accounts.metadata.key())
        .mint(ctx.accounts.mint.key(), false)
        .authority(ctx.accounts.mint_state.key())
        .payer(ctx.accounts.authority.key())
        .update_authority(ctx.accounts.authority.key(), true)
        .system_program(ctx.accounts.system_program.key())
        .sysvar_instructions(ctx.accounts.sysvar_instructions.key())
        .name(name)
        .symbol(symbol)
        .uri(uri)
        .seller_fee_basis_points(0)
        .token_standard(TokenStandard::Fungible)
        .print_supply(PrintSupply::Zero)
        .instruction();

    anchor_lang::solana_program::program::invoke_signed(
        &ix,
        &[
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.mint_state.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.sysvar_instructions.to_account_info(),
            ctx.accounts.token_metadata_program.to_account_info(),
        ],
        signer_seeds,
    )?;

    Ok(())
}
