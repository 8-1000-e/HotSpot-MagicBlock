use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::*;
use crate::state::*;

pub fn handler(ctx: Context<StartGame>) -> Result<()> {
    // TODO: require status == Waiting
    // TODO: require now >= lobby_end
    // TODO: require active_players >= 2
    // TODO: require vault.deposits_count == active_players

    // TODO: call VRF → get random number
    // TODO: store in round_secret.target_number = vrf_result % 1001

    // TODO: set status = Playing, current_round = 1, round_start_time = now
    Ok(())
}

#[derive(Accounts)]
pub struct StartGame<'info> {
    #[account(mut)]
    pub game_config: Account<'info, GameConfig>,

    #[account(
        mut,
        seeds = [SECRET_SEED, game_config.key().as_ref()],
        bump = round_secret.bump,
    )]
    pub round_secret: Account<'info, RoundSecret>,

    #[account(
        seeds = [VAULT_SEED, game_config.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    pub authority: Signer<'info>,
    // TODO: add VRF accounts (oracle_queue, vrf_program, slot_hashes)
}
