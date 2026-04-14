use anchor_lang::prelude::*;
use magicblock_permission_client::instructions::{
    CreateGroupCpiBuilder, CreatePermissionCpiBuilder,
};

use crate::constants::*;

/// Creates a Group + Permission for a PlayerGuess.
///
/// Must be called BEFORE `delegate_player` — the PlayerGuess must still be owned by this
/// program so we can sign the CPI as the delegated_account signer.
///
/// The group contains only the player_authority → only they can read guesses on the PER.
pub fn handler(ctx: Context<CreatePlayerPermission>, id: Pubkey) -> Result<()> {
    let player_key = ctx.accounts.player_authority.key();
    let game_key = ctx.accounts.game_config.key();

    // 1. Create a group with the player as the only member
    CreateGroupCpiBuilder::new(&ctx.accounts.permission_program.to_account_info())
        .group(&ctx.accounts.group.to_account_info())
        .id(id)
        .members(vec![player_key])
        .payer(&ctx.accounts.payer.to_account_info())
        .system_program(&ctx.accounts.system_program.to_account_info())
        .invoke()?;

    // 2. Create the permission binding player_guess to the group.
    //    player_guess is a PDA owned by our program, so we sign via invoke_signed.
    let (_, bump) = Pubkey::find_program_address(
        &[GUESS_SEED, game_key.as_ref(), player_key.as_ref()],
        &crate::ID,
    );
    let seeds: &[&[u8]] = &[GUESS_SEED, game_key.as_ref(), player_key.as_ref(), &[bump]];

    CreatePermissionCpiBuilder::new(&ctx.accounts.permission_program.to_account_info())
        .permission(&ctx.accounts.permission.to_account_info())
        .delegated_account(&ctx.accounts.player_guess.to_account_info())
        .group(&ctx.accounts.group.to_account_info())
        .payer(&ctx.accounts.payer.to_account_info())
        .system_program(&ctx.accounts.system_program.to_account_info())
        .invoke_signed(&[seeds])?;

    Ok(())
}

#[derive(Accounts)]
pub struct CreatePlayerPermission<'info> {
    /// CHECK: just used as seed reference for the player_guess PDA
    pub game_config: UncheckedAccount<'info>,

    /// CHECK: used as seed reference, no signer needed (server pays)
    pub player_authority: UncheckedAccount<'info>,

    /// CHECK: PDA owned by this program; becomes signer via invoke_signed for the permission CPI
    #[account(
        seeds = [GUESS_SEED, game_config.key().as_ref(), player_authority.key().as_ref()],
        bump,
    )]
    pub player_guess: UncheckedAccount<'info>,

    /// CHECK: created by the permission program CPI
    #[account(mut)]
    pub permission: UncheckedAccount<'info>,

    /// CHECK: created by the permission program CPI (group PDA, id-seeded)
    #[account(mut)]
    pub group: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: the magicblock permission program
    #[account(address = magicblock_permission_client::ID)]
    pub permission_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}
