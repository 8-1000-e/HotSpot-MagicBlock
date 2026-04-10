use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::*;
use crate::state::*;

pub fn handler(ctx: Context<EndGame>) -> Result<()> {
    // TODO: require status == Finished
    // TODO: require vault.payout_status == 0

    // TODO: calculate fee + net_pot
    // TODO: pay platform fee (vault → authority)
    // TODO: pay 1st: 50%, 2nd: 25%, 3rd: 15%, 4th+: split 10%
    //   use pay() helper for direct lamport manipulation

    // TODO: set vault.payout_status = 1
    // TODO: commit_and_undelegate_accounts() → settle back to L1
    Ok(())
}

pub fn pay<'a>(from: &AccountInfo<'a>, to: &AccountInfo<'a>, amount: u64) -> Result<()> {
    let from_lamports = from.lamports();
    let payable = amount.min(from_lamports);
    **from.try_borrow_mut_lamports()? = from_lamports.saturating_sub(payable);
    **to.try_borrow_mut_lamports()? = to.lamports().saturating_add(payable);
    Ok(())
}

#[derive(Accounts)]
pub struct EndGame<'info> {
    #[account(mut)]
    pub game_config: Account<'info, GameConfig>,

    #[account(
        mut,
        seeds = [b"leaderboard", game_config.key().as_ref()],
        bump = leaderboard.bump,
    )]
    pub leaderboard: Account<'info, Leaderboard>,

    #[account(
        mut,
        seeds = [VAULT_SEED, game_config.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    pub authority: Signer<'info>,
    // TODO: remaining_accounts = player wallets in leaderboard order for payout
}
