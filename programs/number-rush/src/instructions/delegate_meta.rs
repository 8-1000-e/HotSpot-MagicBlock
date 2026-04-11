use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::delegate;
use crate::state::*;

pub fn handler(ctx: Context<DelegateMeta>) -> Result<()> {
    // TODO: delegate leaderboard + round_reveal to TEE validator
    //   use ctx.accounts.delegate_pda(..., DelegateConfig { validator: Some(TEE_VALIDATOR_DEVNET) })
    Ok(())
}

#[delegate]
#[derive(Accounts)]
pub struct DelegateMeta<'info> {
    #[account(mut, del)]
    pub leaderboard: Box<Account<'info, Leaderboard>>,
    #[account(mut, del)]
    pub round_reveal: Box<Account<'info, RoundReveal>>,
    pub payer: Signer<'info>,
}
