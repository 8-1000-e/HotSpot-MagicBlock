use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::delegate;
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use crate::constants::*;
use crate::state::*;

pub fn handler(ctx: Context<DelegatePlayer>) -> Result<()>
{
    let validator = Some(TEE_VALIDATOR_DEVNET);
    let game_key = ctx.accounts.game_config.key();
    let player_key = ctx.accounts.player_authority.key();

    ctx.accounts.delegate_player_state(
        &ctx.accounts.payer,
        &[PLAYER_SEED, game_key.as_ref(), player_key.as_ref()],
        DelegateConfig { validator, ..Default::default() },
    )?;

    ctx.accounts.delegate_player_guess(
        &ctx.accounts.payer,
        &[GUESS_SEED, game_key.as_ref(), player_key.as_ref()],
        DelegateConfig { validator, ..Default::default() },
    )?;

    Ok(())
}

#[delegate]
#[derive(Accounts)]
pub struct DelegatePlayer<'info> {
    pub game_config: Account<'info, GameConfig>,

    /// CHECK: just used as seed reference (no signer required, server pays)
    pub player_authority: UncheckedAccount<'info>,

    #[account(mut, del)]
    pub player_state: Box<Account<'info, PlayerState>>,
    #[account(mut, del)]
    pub player_guess: Box<Account<'info, PlayerGuess>>,

    /// Server wallet — pays for delegation
    #[account(mut)]
    pub payer: Signer<'info>,
}
