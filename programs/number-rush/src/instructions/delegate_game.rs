use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::delegate;
use crate::state::*;

pub fn handler(ctx: Context<DelegateGame>) -> Result<()> {
    // TODO: delegate game_config, vault, round_secret to TEE validator
    //   use ctx.accounts.delegate_pda(..., DelegateConfig { validator: Some(TEE_VALIDATOR_DEVNET) })

    // TODO: create permission for round_secret via Permission Program CPI
    //   members = [] (empty) → nobody can read target via RPC
    //   the program still reads it as account in instruction context
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
