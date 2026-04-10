use anchor_lang::prelude::*;

// PDA seeds: [SECRET_SEED, game.key()]
// PRIVATE on PER — Permission: members = [] (nobody reads via RPC)
// Only the program reads it in instruction context (submit_guess)
// At end of game: undelegate → back on L1 → public, auditable

#[account]
#[derive(InitSpace)]
pub struct RoundSecret {
    pub game: Pubkey,
    /// VRF-generated target number (0-1000)
    pub target_number: u16,
    pub bump: u8,
}
