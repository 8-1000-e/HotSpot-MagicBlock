use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::delegate;
use crate::state::*;

pub fn handler(ctx: Context<DelegateGame>) -> Result<()> {
    // TODO: delegate game_config, vault, leaderboard, round_reveal, round_secret
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
    pub game_config: Account<'info, GameConfig>,
    #[account(mut, del)]
    pub vault: Account<'info, Vault>,
    #[account(mut, del)]
    pub leaderboard: Account<'info, Leaderboard>,
    #[account(mut, del)]
    pub round_reveal: Account<'info, RoundReveal>,
    #[account(mut, del)]
    pub round_secret: Account<'info, RoundSecret>,
    pub payer: Signer<'info>,
}
