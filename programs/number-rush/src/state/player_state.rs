use anchor_lang::prelude::*;

// PDA seeds: [PLAYER_SEED, game.key(), player_authority.key()]
// Public on PER — other players see proximity + direction

#[account]
#[derive(InitSpace)]
pub struct PlayerState {
    pub authority: Pubkey,
    pub game: Pubkey,
    pub alive: bool,
    /// Proximity level (0-6)
    pub proximity: u8,
    /// Direction: 0 = none, 1 = higher (+), 2 = lower (-)
    pub direction: u8,
    pub round_attempts: u8,
    /// Total attempts across all rounds (scoring)
    pub total_attempts: u16,
    pub found_this_round: bool,
    /// Total time in ms to find numbers (tiebreaker)
    pub total_time_ms: u64,
    /// Consecutive rounds without submission (>= 3 = eliminated)
    pub inactive_rounds: u8,
    pub bump: u8,
}
