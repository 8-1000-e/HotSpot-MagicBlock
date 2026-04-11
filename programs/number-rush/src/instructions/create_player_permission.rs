use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::access_control::instructions::CreatePermissionCpiBuilder;
use ephemeral_rollups_sdk::access_control::structs::{
    Member, MembersArgs, TX_BALANCES_FLAG, TX_LOGS_FLAG, TX_MESSAGE_FLAG,
};
use ephemeral_rollups_sdk::consts::PERMISSION_PROGRAM_ID;

use crate::constants::*;
use crate::state::*;

/// Create a Permission for a PlayerGuess account, restricting reads to the player only.
/// This must be called AFTER the PlayerGuess has been delegated to the PER.
///
/// Members = [player_authority] → only this player can read their own guesses via RPC on the PER.
/// Other players cannot read this account through the RPC even though it lives on the PER.
///
/// Server pays for the permission account rent (player only signs spawn_player).
pub fn handler(ctx: Context<CreatePlayerPermission>) -> Result<()> {
    let player_key = ctx.accounts.player_authority.key();
    let game_key = ctx.accounts.game_config.key();

    // Derive the seeds + bump for the PlayerGuess PDA so we can sign the CPI on its behalf
    let seed_data: Vec<Vec<u8>> = vec![
        GUESS_SEED.to_vec(),
        game_key.to_bytes().to_vec(),
        player_key.to_bytes().to_vec(),
    ];

    let (_, bump) = Pubkey::find_program_address(
        &seed_data.iter().map(|s| s.as_slice()).collect::<Vec<_>>(),
        &crate::ID,
    );

    let mut seeds = seed_data.clone();
    seeds.push(vec![bump]);
    let seed_refs: Vec<&[u8]> = seeds.iter().map(|s| s.as_slice()).collect();

    // Restrict the PlayerGuess to be readable only by the player
    // Flags: full read access (logs, balances, message)
    let members = Some(vec![Member {
        flags: TX_LOGS_FLAG | TX_BALANCES_FLAG | TX_MESSAGE_FLAG,
        pubkey: player_key,
    }]);

    CreatePermissionCpiBuilder::new(&ctx.accounts.permission_program.to_account_info())
        .permissioned_account(&ctx.accounts.player_guess.to_account_info())
        .permission(&ctx.accounts.permission.to_account_info())
        .payer(&ctx.accounts.payer.to_account_info())
        .system_program(&ctx.accounts.system_program.to_account_info())
        .args(MembersArgs { members })
        .invoke_signed(&[seed_refs.as_slice()])?;

    Ok(())
}

#[derive(Accounts)]
pub struct CreatePlayerPermission<'info> {
    pub game_config: Account<'info, GameConfig>,

    /// CHECK: just used as seed reference (no signer required, server pays)
    pub player_authority: UncheckedAccount<'info>,

    /// CHECK: validated by the permission program via PDA seeds
    #[account(
        seeds = [GUESS_SEED, game_config.key().as_ref(), player_authority.key().as_ref()],
        bump,
    )]
    pub player_guess: UncheckedAccount<'info>,

    /// CHECK: created by the permission program CPI
    #[account(mut)]
    pub permission: UncheckedAccount<'info>,

    /// Server wallet — pays for the permission account rent
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: PERMISSION PROGRAM
    #[account(address = PERMISSION_PROGRAM_ID)]
    pub permission_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}
