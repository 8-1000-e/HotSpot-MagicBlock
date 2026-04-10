use anchor_lang::prelude::*;
use crate::constants::*;

// PDA seeds: [GUESS_SEED, game.key(), player_authority.key()]
// PRIVATE on PER — Permission: members = [player_authority]
// Only the owner can read their guesses, other players cannot
// Reset each round, at end of game: undelegate → L1 → auditable

#[account]
#[derive(InitSpace)]
pub struct PlayerGuess {
    pub authority: Pubkey,
    pub game: Pubkey,
    pub guesses: [u16; MAX_ATTEMPTS_PER_ROUND as usize],
    pub count: u8,
    pub last_guess_time: i64,
    pub bump: u8,
}
