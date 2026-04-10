use anchor_lang::prelude::*;
use crate::constants::*;

// PDA seeds: [b"reveal", game.key()]
// Public on PER — permanent record of past rounds
// This is how players see targets + summary between rounds

#[account]
#[derive(InitSpace)]
pub struct RoundReveal {
    pub game: Pubkey,
    /// Target numbers revealed after each round
    pub targets: [u16; MAX_ROUNDS as usize],
    /// Attempts per player per round
    pub player_attempts: [[u8; MAX_PLAYERS]; MAX_ROUNDS as usize],
    /// Whether player found the number per round
    pub player_found: [[bool; MAX_PLAYERS]; MAX_ROUNDS as usize],
    pub last_revealed_round: u8,
    pub bump: u8,
}
