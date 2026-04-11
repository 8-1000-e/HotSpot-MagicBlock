use anchor_lang::prelude::*;

// PDA seeds: [VAULT_SEED, game.key()]
// Holds the SOL pot — lamports on the PDA itself

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub game: Pubkey,
    pub total_pot: u64,
    pub deposits_count: u8,
    /// 0 = Pending, 1 = Distributed
    pub payout_status: u8,
    pub bump: u8,
}
