use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::delegate;
use crate::state::*;

pub fn handler(ctx: Context<DelegatePlayer>) -> Result<()> {
    // TODO: delegate player_state to TEE validator
    // TODO: delegate player_guess to TEE validator (already has permission from spawn)
    Ok(())
}

#[delegate]
#[derive(Accounts)]
pub struct DelegatePlayer<'info> {
    #[account(mut, del)]
    pub player_state: Account<'info, PlayerState>,
    #[account(mut, del)]
    pub player_guess: Account<'info, PlayerGuess>,
    pub payer: Signer<'info>,
}
