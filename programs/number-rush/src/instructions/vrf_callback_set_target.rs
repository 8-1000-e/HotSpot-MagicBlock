use anchor_lang::prelude::*;
use ephemeral_vrf_sdk::consts::VRF_PROGRAM_IDENTITY;

use crate::constants::*;
use crate::state::*;

/// VRF callback. Called by the Ephemeral VRF program after a randomness request
/// issued from `start_game` (or `end_round`). The signer is the VRF program identity.
///
/// Sets `round_secret.target_number` to a value in [0, NUMBER_RANGE].
pub fn handler(ctx: Context<VrfCallbackSetTarget>, randomness: [u8; 32]) -> Result<()> {
    let random_number = u64::from_le_bytes(randomness[..8].try_into().unwrap());
    let target = (random_number % (NUMBER_RANGE as u64 + 1)) as u16;

    ctx.accounts.round_secret.target_number = target;

    Ok(())
}

#[derive(Accounts)]
pub struct VrfCallbackSetTarget<'info> {
    /// VRF program identity — only the Ephemeral VRF program can sign here.
    #[account(address = VRF_PROGRAM_IDENTITY)]
    pub vrf_program_identity: Signer<'info>,

    /// The RoundSecret PDA. Owned by THIS program → direct mutation OK.
    #[account(mut)]
    pub round_secret: Account<'info, RoundSecret>,
}
