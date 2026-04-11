use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::delegate;
use crate::state::*;
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use crate::constants::*;

pub fn handler(ctx: Context<DelegateGame>) -> Result<()> 
{
    let validator = Some(TEE_VALIDATOR_DEVNET);

    ctx.accounts.delegate_game_config(
        &ctx.accounts.payer,
        &[GAME_SEED, &ctx.accounts.game_config.game_id.to_le_bytes()],
        DelegateConfig { validator, ..Default::default() },
    )?;

    ctx.accounts.delegate_vault(
        &ctx.accounts.payer,
        &[VAULT_SEED, ctx.accounts.game_config.key().as_ref()],
        DelegateConfig { validator, ..Default::default() },
    )?;

    ctx.accounts.delegate_round_secret(
        &ctx.accounts.payer,
        &[SECRET_SEED, ctx.accounts.game_config.key().as_ref()],
        DelegateConfig { validator, ..Default::default() },
    )?;

    Ok(())
}

#[delegate]
#[derive(Accounts)]
pub struct DelegateGame<'info> {
    #[account(mut, del)]
    pub game_config: Box<Account<'info, GameConfig>>,
    #[account(mut, del)]
    pub vault: Box<Account<'info, Vault>>,
    #[account(mut, del)]
    pub round_secret: Box<Account<'info, RoundSecret>>,
    pub payer: Signer<'info>,
}
