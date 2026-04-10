use anchor_lang::prelude::*;

pub const MAX_PLAYERS: usize = 10;
pub const MAX_ROUNDS: u8 = 5;
pub const MAX_ATTEMPTS_PER_ROUND: u8 = 15;
pub const ATTEMPT_TIMER_SECS: i64 = 5;
pub const NUMBER_RANGE: u16 = 1000;
pub const LOBBY_DURATION: i64 = 120;
pub const INACTIVE_ROUNDS_LIMIT: u8 = 3;

// Payout distribution in basis points (out of 10000)
pub const FIRST_PLACE_BPS: u64 = 5000;  // 50%
pub const SECOND_PLACE_BPS: u64 = 2500; // 25%
pub const THIRD_PLACE_BPS: u64 = 1500;  // 15%
// 4th+ split remaining 10%

// PER — TEE validators
pub const TEE_VALIDATOR_DEVNET: Pubkey = pubkey!("FnE6VJT5QNZdedZPnCoLsARgBwoE6DeJNjBs2H1gySXA");

// Permission Program
pub const PERMISSION_PROGRAM: Pubkey = pubkey!("ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1");

// Delegation Program
pub const DELEGATION_PROGRAM: Pubkey = pubkey!("DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh");

// Proximity levels
pub const PROXIMITY_NONE: u8 = 0;
pub const PROXIMITY_GLACIAL: u8 = 1;     // > 400
pub const PROXIMITY_FROID: u8 = 2;       // 200-400
pub const PROXIMITY_TIEDE: u8 = 3;       // 100-200
pub const PROXIMITY_CHAUD: u8 = 4;       // 50-100
pub const PROXIMITY_BOUILLANT: u8 = 5;   // 1-50
pub const PROXIMITY_TROUVE: u8 = 6;      // 0

// Seeds
pub const GAME_SEED: &[u8] = b"game";
pub const PLAYER_SEED: &[u8] = b"player";
pub const GUESS_SEED: &[u8] = b"guess";
pub const VAULT_SEED: &[u8] = b"vault";
pub const SECRET_SEED: &[u8] = b"secret";
