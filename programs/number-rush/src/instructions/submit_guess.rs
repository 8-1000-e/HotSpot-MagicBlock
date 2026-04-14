use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::*;
use crate::state::*;

pub fn handler(ctx: Context<SubmitGuess>, guess: u16) -> Result<()> 
{
    
    require!(ctx.accounts.game_config.status == GameStatus::Playing, GameError::InvalidGameStatus);
    require!(ctx.accounts.player_state.alive, GameError::PlayerEliminated);
    require!(!ctx.accounts.player_state.found_this_round, GameError::AlreadyFound);
    require!(ctx.accounts.player_guess.count < MAX_ATTEMPTS_PER_ROUND, GameError::MaxAttemptsReached);
    require!(guess <= NUMBER_RANGE || guess == NO_GUESS, GameError::GuessOutOfRange);
    if guess == NO_GUESS
    {
        ctx.accounts.player_state.inactive_rounds += 1;
        if ctx.accounts.player_state.inactive_rounds >= MAX_INACTIVE_ROUNDS
        {
            ctx.accounts.player_state.alive = false;
            ctx.accounts.game_config.eliminated_count += 1;
        }
        return Ok(());
    }

    // Reset inactive streak on real guess
    ctx.accounts.player_state.inactive_rounds = 0;

    let target = ctx.accounts.round_secret.target_number;
    let now_slot = Clock::get()?.slot;

    let attempt_idx = ctx.accounts.player_guess.count as usize;
    ctx.accounts.player_guess.guesses[attempt_idx] = guess;
    ctx.accounts.player_guess.count += 1;
    ctx.accounts.player_guess.last_guess_slot = now_slot;
    ctx.accounts.player_state.round_attempts += 1;
    ctx.accounts.player_state.total_attempts += 1;


    let diff = if guess > target { guess - target } else { target - guess };
    msg!("guess={} target={} diff={}", guess, target, diff);
    ctx.accounts.player_state.proximity = match diff 
    {
        0 => PROXIMITY_TROUVE,
        1..=50 => PROXIMITY_BOUILLANT,
        51..=100 => PROXIMITY_CHAUD,
        101..=200 => PROXIMITY_TIEDE,
        201..=400 => PROXIMITY_FROID,
        _ => PROXIMITY_GLACIAL,
    };

    ctx.accounts.player_state.direction = if diff == 0 
    {
        Direction::None
    } 
    else if guess < target 
    {
        Direction::Higher
    } 
    else 
    {
        Direction::Lower
    };

    if diff == 0 {
        ctx.accounts.player_state.found_this_round = true;
        ctx.accounts.player_state.total_time_slot = ctx.accounts.player_state.total_time_slot
            .saturating_add(now_slot.saturating_sub(ctx.accounts.game_config.round_start_slot));
        ctx.accounts.game_config.round_found_count = ctx.accounts.game_config.round_found_count.saturating_add(1);
    }

    Ok(())
}

#[derive(Accounts)]
pub struct SubmitGuess<'info> {
    #[account(mut, has_one = authority)]
    pub player_state: Account<'info, PlayerState>,

    #[account(mut, has_one = authority)]
    pub player_guess: Account<'info, PlayerGuess>,

    #[account(mut)]
    pub game_config: Account<'info, GameConfig>,

    /// Program reads target from here — players can't read via RPC (permission: members=[])
    #[account(
        seeds = [SECRET_SEED, game_config.key().as_ref()],
        bump = round_secret.bump,
    )]
    pub round_secret: Account<'info, RoundSecret>,

    pub authority: Signer<'info>,
    // NOTE: in production, authority = session key signer (not wallet)
}
