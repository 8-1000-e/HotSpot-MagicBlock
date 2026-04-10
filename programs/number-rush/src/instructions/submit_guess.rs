use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::*;
use crate::state::*;

pub fn handler(ctx: Context<SubmitGuess>, guess: u16) -> Result<()> {
    // TODO: require status == Playing
    // TODO: require player alive
    // TODO: require !found_this_round
    // TODO: require round_attempts < MAX_ATTEMPTS_PER_ROUND
    // TODO: require guess <= NUMBER_RANGE

    // TODO: read target from round_secret.target_number
    //   (program can read it even though RPC permission blocks players)

    // TODO: store guess in player_guess.guesses[attempt_idx]
    // TODO: update player_guess.count
    // TODO: update last_guess_time
    // TODO: increment round_attempts + total_attempts

    // TODO: calculate proximity:
    //   diff = abs(guess - target)
    //   >400 = Glacial, 200-400 = Froid, 100-200 = Tiede
    //   50-100 = Chaud, 1-50 = Bouillant, 0 = Trouve

    // TODO: calculate direction (1 = higher, 2 = lower)

    // TODO: if found (diff == 0):
    //   found_this_round = true
    //   total_time_ms += (now - round_start_time) * 1000
    //   game_config.round_found_count++
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
