use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::commit;
use ephemeral_rollups_sdk::ephem::commit_and_undelegate_accounts;
use session_keys::{session_auth_or, Session, SessionError, SessionToken};
use crate::constants::*;
use crate::errors::*;
use crate::state::*;

#[session_auth_or(
    ctx.accounts.authority.key() == ctx.accounts.game_config.authority,
    GameError::Unauthorized
)]
pub fn handler(ctx: Context<EndGame>) -> Result<()>
{
    require!(ctx.accounts.game_config.status == GameStatus::Finished, GameError::InvalidGameStatus);
    require!(ctx.accounts.vault.payout_status == 0, GameError::AlreadyDistributed);

    let total_pot = ctx.accounts.vault.total_pot;
    let fee = total_pot * PLATFORM_FEE_BPS / 10000;
    let net_pot = total_pot - fee;
    let player_count = ctx.accounts.leaderboard.count as usize;

    // Pay platform fee → creator (authority is just an AccountInfo now, but lamports still credit)
    ctx.accounts.vault.sub_lamports(fee)?;
    ctx.accounts.authority.add_lamports(fee)?;

    // remaining_accounts = player wallets in leaderboard order
    // Distribution depends on number of players
    match player_count {
        // 2 players: 1st gets 95%
        2 => {
            let first = net_pot * 9500 / 10000;
            let second = net_pot - first;
            ctx.accounts.vault.sub_lamports(first)?;
            ctx.remaining_accounts[0].add_lamports(first)?;
            ctx.accounts.vault.sub_lamports(second)?;
            ctx.remaining_accounts[1].add_lamports(second)?;
        }
        // 3 players: 1st 60%, 2nd 35%, 3rd rest
        3 => {
            let first = net_pot * 6000 / 10000;
            let second = net_pot * 3500 / 10000;
            let third = net_pot - first - second;
            ctx.accounts.vault.sub_lamports(first)?;
            ctx.remaining_accounts[0].add_lamports(first)?;
            ctx.accounts.vault.sub_lamports(second)?;
            ctx.remaining_accounts[1].add_lamports(second)?;
            ctx.accounts.vault.sub_lamports(third)?;
            ctx.remaining_accounts[2].add_lamports(third)?;
        }
        // 4+ players: 1st 55%, 2nd 25%, 3rd 15%, rest split 5%
        _ => {
            let first = net_pot * 5500 / 10000;
            let second = net_pot * 2500 / 10000;
            let third = net_pot * 1500 / 10000;
            ctx.accounts.vault.sub_lamports(first)?;
            ctx.remaining_accounts[0].add_lamports(first)?;
            ctx.accounts.vault.sub_lamports(second)?;
            ctx.remaining_accounts[1].add_lamports(second)?;
            ctx.accounts.vault.sub_lamports(third)?;
            ctx.remaining_accounts[2].add_lamports(third)?;

            if player_count > 3 {
                let rest = net_pot - first - second - third;
                let rest_count = (player_count - 3) as u64;
                let per_player = rest / rest_count;
                for i in 3..player_count {
                    ctx.accounts.vault.sub_lamports(per_player)?;
                    ctx.remaining_accounts[i].add_lamports(per_player)?;
                }
            }
        }
    }

    ctx.accounts.vault.payout_status = 1;

    // Commit and undelegate all game accounts → settle back to L1
    ctx.accounts.game_config.exit(&crate::ID)?;

    commit_and_undelegate_accounts(
        &ctx.accounts.payer,
        vec![
            &ctx.accounts.game_config.to_account_info(),
            &ctx.accounts.leaderboard.to_account_info(),
            &ctx.accounts.vault.to_account_info(),
        ],
        &ctx.accounts.magic_context,
        &ctx.accounts.magic_program,
    )?;

    Ok(())
}

#[commit]
#[derive(Accounts, Session)]
pub struct EndGame<'info> {
    /// CHECK: must match game_config.authority (creator)
    #[account(mut)]
    pub authority: AccountInfo<'info>,

    /// Fee payer on PER (sessionKp or wallet)
    #[account(mut)]
    pub payer: Signer<'info>,

    #[session(
        signer = payer,
        authority = authority.key()
    )]
    pub session_token: Option<Account<'info, SessionToken>>,

    #[account(mut)]
    pub game_config: Box<Account<'info, GameConfig>>,

    #[account(
        mut,
        seeds = [LEADERBOARD_SEED, game_config.key().as_ref()],
        bump = leaderboard.bump,
    )]
    pub leaderboard: Box<Account<'info, Leaderboard>>,

    #[account(
        mut,
        seeds = [VAULT_SEED, game_config.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Box<Account<'info, Vault>>,
    // remaining_accounts: player wallets in leaderboard order
}
