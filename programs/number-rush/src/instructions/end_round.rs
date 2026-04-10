use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::*;
use crate::state::*;

pub fn handler(ctx: Context<EndRound>) -> Result<()> {
    // TODO: require status == Playing
    // TODO: require current_round >= 1 && <= MAX_ROUNDS

    // TODO: check round end conditions:
    //   - all active players found OR all reached MAX_ATTEMPTS
    //   - OR round timer expired

    // ── REVEAL ──
    // TODO: copy round_secret.target_number → round_reveal.targets[round_idx]
    // TODO: populate round_reveal.player_attempts + player_found from remaining_accounts
    // TODO: set round_reveal.last_revealed_round = current_round

    // TODO: update leaderboard (sort by total_attempts asc, tiebreak total_time_ms asc)

    // ── RESET FOR NEXT ROUND ──
    // TODO: reset per-round player state (via remaining_accounts):
    //   round_attempts=0, found_this_round=false, proximity=0, direction=0
    // TODO: reset player_guess: count=0, guesses=[0;15]

    // TODO: increment inactive_rounds for non-submitters
    // TODO: eliminate players with inactive_rounds >= 3

    // TODO: if current_round >= MAX_ROUNDS → status = Finished
    // TODO: else:
    //   current_round++, round_found_count=0, round_start_time=now
    //   call VRF → new target in round_secret
    Ok(())
}

#[derive(Accounts)]
pub struct EndRound<'info> {
    #[account(mut)]
    pub game_config: Account<'info, GameConfig>,

    #[account(
        mut,
        seeds = [b"leaderboard", game_config.key().as_ref()],
        bump = leaderboard.bump,
    )]
    pub leaderboard: Account<'info, Leaderboard>,

    #[account(
        mut,
        seeds = [b"reveal", game_config.key().as_ref()],
        bump = round_reveal.bump,
    )]
    pub round_reveal: Account<'info, RoundReveal>,

    #[account(
        mut,
        seeds = [SECRET_SEED, game_config.key().as_ref()],
        bump = round_secret.bump,
    )]
    pub round_secret: Account<'info, RoundSecret>,

    pub authority: Signer<'info>,
    // TODO: remaining_accounts = PlayerState + PlayerGuess PDAs for all players
}
