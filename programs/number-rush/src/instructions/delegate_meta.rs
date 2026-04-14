use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::delegate;
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use crate::constants::*;
use crate::state::*;

pub fn handler(ctx: Context<DelegateMeta>) -> Result<()>
{
    let validator = Some(TEE_VALIDATOR_DEVNET);
    let game_key = ctx.accounts.game_config.key();

    ctx.accounts.delegate_leaderboard(
        &ctx.accounts.payer,
        &[LEADERBOARD_SEED, game_key.as_ref()],
        DelegateConfig { validator, ..Default::default() },
    )?;

    ctx.accounts.delegate_round_reveal(
        &ctx.accounts.payer,
        &[REVEAL_SEED, game_key.as_ref()],
        DelegateConfig { validator, ..Default::default() },
    )?;

    Ok(())
}

#[delegate]
#[derive(Accounts)]
pub struct DelegateMeta<'info> {
    /// CHECK: game config reference for PDA seeds (may already be delegated)
    pub game_config: UncheckedAccount<'info>,
    #[account(mut, del)]
    pub leaderboard: Box<Account<'info, Leaderboard>>,
    #[account(mut, del)]
    pub round_reveal: Box<Account<'info, RoundReveal>>,
    pub payer: Signer<'info>,
}
