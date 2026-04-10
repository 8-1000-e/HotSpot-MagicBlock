use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::*;
use crate::state::*;

pub fn handler(ctx: Context<SpawnPlayer>) -> Result<()> {
    // TODO: require game status == Waiting
    // TODO: require player_count < MAX_PLAYERS

    // TODO: init player_state (authority, alive=true, etc.)
    // TODO: init player_guess (authority, game ref, all guesses zeroed)

    // TODO: transfer bet SOL: player → vault PDA
    //   use anchor_lang::system_program::transfer CPI

    // TODO: update vault (total_pot += bet, deposits_count++)
    // TODO: register player in game_config.players[count] = player_state PDA bytes
    // TODO: increment game_config.player_count + active_players

    // TODO: create permission for player_guess via Permission Program CPI
    //   members = [player_authority only] → only this player reads their guesses on PER
    Ok(())
}

#[derive(Accounts)]
pub struct SpawnPlayer<'info> {
    #[account(
        init,
        payer = player,
        space = 8 + PlayerState::INIT_SPACE,
        seeds = [PLAYER_SEED, game_config.key().as_ref(), player.key().as_ref()],
        bump,
    )]
    pub player_state: Account<'info, PlayerState>,

    #[account(
        init,
        payer = player,
        space = 8 + PlayerGuess::INIT_SPACE,
        seeds = [GUESS_SEED, game_config.key().as_ref(), player.key().as_ref()],
        bump,
    )]
    pub player_guess: Account<'info, PlayerGuess>,

    #[account(mut)]
    pub game_config: Account<'info, GameConfig>,

    #[account(
        mut,
        seeds = [VAULT_SEED, game_config.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
    // TODO: add permission_program + permission account for player_guess privacy
}
