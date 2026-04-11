use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::*;
use crate::state::*;

pub fn handler(ctx: Context<SpawnPlayer>) -> Result<()> 
{
    require!(ctx.accounts.game_config.status == GameStatus::Waiting, GameError::InvalidGameStatus);
    require!((ctx.accounts.game_config.player_count as usize) < MAX_PLAYERS, GameError::MaxPlayersReached);

    //todo init player state
    ctx.accounts.player_state.authority = ctx.accounts.player.key();
    ctx.accounts.player_state.game = ctx.accounts.game_config.key();
    ctx.accounts.player_state.alive = true;
    ctx.accounts.player_state.proximity = 0;
    ctx.accounts.player_state.direction = Direction::None;
    ctx.accounts.player_state.round_attempts = 0;
    ctx.accounts.player_state.total_attempts = 0;
    ctx.accounts.player_state.found_this_round = false;
    ctx.accounts.player_state.total_time_slot = 0;
    ctx.accounts.player_state.inactive_rounds = 0;
    ctx.accounts.player_state.bump = ctx.bumps.player_state;



    ctx.accounts.player_guess.authority = ctx.accounts.player.key();
    ctx.accounts.player_guess.game = ctx.accounts.game_config.key();
    ctx.accounts.player_guess.guesses = [0; MAX_ATTEMPTS_PER_ROUND as usize];
    ctx.accounts.player_guess.count = 0;
    ctx.accounts.player_guess.last_guess_slot = 0;
    ctx.accounts.player_guess.bump = ctx.bumps.player_guess;

    ctx.accounts.player.sub_lamports(ctx.accounts.game_config.bet_amount)?;
    ctx.accounts.vault.add_lamports(ctx.accounts.game_config.bet_amount)?;

    ctx.accounts.vault.total_pot += ctx.accounts.game_config.bet_amount;
    ctx.accounts.vault.deposits_count += 1;

    let idx = ctx.accounts.game_config.player_count as usize;
    ctx.accounts.game_config.players[idx] = ctx.accounts.player_state.key().to_bytes();
    ctx.accounts.game_config.player_count += 1;
    ctx.accounts.game_config.active_players += 1;

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
}
