use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::*;
use crate::state::*;

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

#[derive(Accounts)]
pub struct StartGame<'info> {
    #[account(mut)]
    pub game_config: Account<'info, GameConfig>,

    #[account(
        seeds = [VAULT_SEED, game_config.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub payer: Signer<'info>,
}
