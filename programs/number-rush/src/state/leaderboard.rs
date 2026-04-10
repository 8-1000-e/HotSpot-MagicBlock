use anchor_lang::prelude::*;
use crate::constants::*;

// PDA seeds: [b"leaderboard", game.key()]
// Public on PER — updated after each round

#[account]
#[derive(InitSpace)]
pub struct Leaderboard {
    pub game: Pubkey,
    /// Player pubkeys sorted by rank (index 0 = best)
    pub entries: [[u8; 32]; MAX_PLAYERS],
    /// Total attempts per player (parallel array)
    pub attempts: [u16; MAX_PLAYERS],
    /// Total time per player in ms (tiebreaker)
    pub times: [u64; MAX_PLAYERS],
    pub count: u8,
    pub bump: u8,
}
