use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("BBP3vz9Bm4Fx21UZmmWAoykL4shNbTxCrAXtmUrBMEuV");

#[program]
pub mod launchpad {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::initialize(ctx)
    }

    pub fn create_mint_state_token_account(ctx: Context<CreateMintStateTokenAccount>) -> Result<()> {
        instructions::initialize::create_mint_state_token_account(ctx)
    }

    pub fn register_user(ctx: Context<RegisterUser>) -> Result<()> {
        instructions::register_user::register_user(ctx)
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, quantity: u8) -> Result<()> {
        instructions::mint::mint_tokens(ctx, quantity)
    }

    pub fn graduate(ctx: Context<Graduate>) -> Result<()> {
        instructions::graduate::graduate(ctx)
    }

    pub fn emergency_halt(ctx: Context<EmergencyHalt>) -> Result<()> {
        instructions::emergency_halt::emergency_halt(ctx)
    }

    pub fn transfer_authority(ctx: Context<TransferAuthority>) -> Result<()> {
        instructions::transfer_authority::transfer_authority(ctx)
    }

    pub fn create_metadata(ctx: Context<CreateMetadata>, name: String, symbol: String, uri: String) -> Result<()> {
        instructions::create_metadata::create_metadata(ctx, name, symbol, uri)
    }
}
