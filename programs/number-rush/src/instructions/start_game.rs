use anchor_lang::prelude::*;
use session_keys::{session_auth_or, Session, SessionError, SessionToken};
use crate::constants::*;
use crate::errors::*;
use crate::state::*;

#[session_auth_or(
    ctx.accounts.authority.key() == ctx.accounts.game_config.authority,
    GameError::Unauthorized
)]
pub fn handler(ctx: Context<StartGame>) -> Result<()>
{
    let now_slot = Clock::get()?.slot;

    require!(ctx.accounts.game_config.status == GameStatus::Waiting, GameError::InvalidGameStatus);
    require!(ctx.accounts.game_config.active_players >= 2, GameError::NotEnoughPlayers);
    require!(ctx.accounts.vault.deposits_count == ctx.accounts.game_config.active_players, GameError::NotEnoughPlayers);

    ctx.accounts.game_config.status = GameStatus::Playing;
    ctx.accounts.game_config.current_round = 1;
    ctx.accounts.game_config.round_start_slot = now_slot;

    // Target is set via separate request_target → vrf_callback_set_target

    Ok(())
}

#[derive(Accounts, Session)]
pub struct StartGame<'info> {
    /// CHECK: must match game_config.authority (creator)
    pub authority: AccountInfo<'info>,

    /// Fee payer on PER — either the creator's wallet or their session keypair
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
        seeds = [VAULT_SEED, game_config.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,
}
