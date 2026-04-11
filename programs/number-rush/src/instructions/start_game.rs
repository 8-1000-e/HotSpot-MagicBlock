use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::*;
use crate::state::*;
use ephemeral_vrf_sdk::instructions::{create_request_randomness_ix, RequestRandomnessParams};
use ephemeral_vrf_sdk::types::SerializableAccountMeta;
use anchor_lang::solana_program::program::invoke;

pub fn handler(ctx: Context<StartGame>) -> Result<()> 
{
    let now_slot = Clock::get()?.slot;
    let now_ts = Clock::get()?.unix_timestamp;

    require!(ctx.accounts.game_config.status == GameStatus::Waiting, GameError::InvalidGameStatus);
    require!(now_ts >= ctx.accounts.game_config.lobby_end, GameError::LobbyNotOver);
    require!(ctx.accounts.game_config.active_players >= 2, GameError::NotEnoughPlayers);
    require!(ctx.accounts.vault.deposits_count == ctx.accounts.game_config.active_players, GameError::NotEnoughPlayers);

    ctx.accounts.game_config.status = GameStatus::Playing;
    ctx.accounts.game_config.current_round = 1;
    ctx.accounts.game_config.round_start_slot = now_slot;

    // Request randomness from the VRF program. The callback will set target_number.
    let game_key = ctx.accounts.game_config.key();
    let callback_accounts = vec![
        SerializableAccountMeta {
            pubkey: ctx.accounts.round_secret.key(),
            is_signer: false,
            is_writable: true,
        },
    ];
    
    let ix = create_request_randomness_ix(RequestRandomnessParams {
        payer: ctx.accounts.payer.key(),
        oracle_queue: ctx.accounts.oracle_queue.key(),
        callback_program_id: crate::ID,
        callback_discriminator: crate::instruction::VrfCallbackSetTarget::DISCRIMINATOR.to_vec(),
        accounts_metas: Some(callback_accounts),
        caller_seed: {
            let mut seed = [0u8; 32];
            seed[..31].copy_from_slice(&game_key.to_bytes()[..31]);
            seed[31] = 1; // round number
            seed
        },
        ..Default::default()
    });
    
    invoke(&ix, ctx.remaining_accounts)?;
    

    Ok(())
}

#[derive(Accounts)]
pub struct StartGame<'info> {
    #[account(mut)]
    pub game_config: Account<'info, GameConfig>,

    #[account(
        mut,
        seeds = [SECRET_SEED, game_config.key().as_ref()],
        bump = round_secret.bump,
    )]
    pub round_secret: Account<'info, RoundSecret>,

    #[account(
        seeds = [VAULT_SEED, game_config.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    /// Server wallet — pays for VRF request
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: VRF oracle queue (default queue)
    #[account(mut)]
    pub oracle_queue: UncheckedAccount<'info>,
    // remaining_accounts: passed through to the VRF program
    //   [vrf_program, slot_hashes, ...any other accounts the VRF program needs]
}
