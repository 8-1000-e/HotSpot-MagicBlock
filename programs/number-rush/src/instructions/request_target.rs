use anchor_lang::prelude::*;
use ephemeral_vrf_sdk::anchor::vrf;
use ephemeral_vrf_sdk::instructions::{create_request_randomness_ix, RequestRandomnessParams};
use ephemeral_vrf_sdk::types::SerializableAccountMeta;
use session_keys::{session_auth_or, Session, SessionError, SessionToken};
use crate::constants::*;
use crate::errors::*;
use crate::state::*;

#[session_auth_or(
    ctx.accounts.authority.key() == ctx.accounts.game_config.authority,
    GameError::Unauthorized
)]
pub fn handler(ctx: Context<RequestTarget>) -> Result<()>
{
    require!(ctx.accounts.game_config.status == GameStatus::Playing, GameError::InvalidGameStatus);

    let game_key = ctx.accounts.game_config.key();
    let round = ctx.accounts.game_config.current_round;

    let ix = create_request_randomness_ix(RequestRandomnessParams {
        payer: ctx.accounts.payer.key(),
        oracle_queue: ctx.accounts.oracle_queue.key(),
        callback_program_id: crate::ID,
        callback_discriminator: crate::instruction::VrfCallbackSetTarget::DISCRIMINATOR.to_vec(),
        accounts_metas: Some(vec![SerializableAccountMeta {
            pubkey: ctx.accounts.round_secret.key(),
            is_signer: false,
            is_writable: true,
        }]),
        caller_seed: {
            let mut seed = [0u8; 32];
            seed[..31].copy_from_slice(&game_key.to_bytes()[..31]);
            seed[31] = round;
            seed
        },
        ..Default::default()
    });

    ctx.accounts.invoke_signed_vrf(&ctx.accounts.payer.to_account_info(), &ix)?;

    Ok(())
}

#[vrf]
#[derive(Accounts, Session)]
pub struct RequestTarget<'info> {
    /// CHECK: must match game_config.authority
    pub authority: AccountInfo<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[session(
        signer = payer,
        authority = authority.key()
    )]
    pub session_token: Option<Account<'info, SessionToken>>,

    #[account(mut)]
    pub game_config: Account<'info, GameConfig>,

    #[account(
        mut,
        seeds = [SECRET_SEED, game_config.key().as_ref()],
        bump = round_secret.bump,
    )]
    pub round_secret: Account<'info, RoundSecret>,

    /// CHECK: The ephemeral VRF oracle queue (PER/TEE queue, not the L1 one)
    #[account(mut, address = ephemeral_vrf_sdk::consts::DEFAULT_EPHEMERAL_QUEUE)]
    pub oracle_queue: AccountInfo<'info>,
}
