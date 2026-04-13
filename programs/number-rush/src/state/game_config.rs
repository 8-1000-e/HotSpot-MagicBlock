use anchor_lang::prelude::*;
use crate::constants::*;

// PDA seeds: [GAME_SEED, game_id.to_le_bytes()]
// Public on PER

#[derive(AnchorSerialize, AnchorDeserialize, InitSpace, Clone, Copy, PartialEq, Eq, Debug)]
pub enum GameStatus {
    Waiting,
    Playing,
    Finished,
}

#[account]
#[derive(InitSpace)]
pub struct GameConfig {
    pub game_id: u64,
    pub status: GameStatus,
    pub active_players: u8,
    pub current_round: u8,
    pub round_start_slot: u64,
    pub start_time: i64,
    pub lobby_end: i64,
    /// Bet amount in lamports
    pub bet_amount: u64,
    /// Creator of the game
    pub authority: Pubkey,
    /// Player state PDAs registry (max 10)
    pub players: [[u8; 32]; MAX_PLAYERS],
    pub player_count: u8,
    /// Number of players who found the number this round
    pub round_found_count: u8,
    pub eliminated_count: u8,
    pub bump: u8,
}
