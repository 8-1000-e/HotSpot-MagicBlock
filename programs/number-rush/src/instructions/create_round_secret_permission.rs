use anchor_lang::prelude::*;
use magicblock_permission_client::instructions::{
    CreateGroupCpiBuilder, CreatePermissionCpiBuilder,
};

use crate::constants::*;

/// Creates a Group + Permission for the RoundSecret.
///
/// Must be called BEFORE `delegate_game`. Group has empty members → nobody can read
/// target_number via RPC on the PER. The program itself still reads it in instructions.
pub fn handler(ctx: Context<CreateRoundSecretPermission>, id: Pubkey) -> Result<()> {
    let game_key = ctx.accounts.game_config.key();

    // 1. Empty-members group: nobody authorized for RPC reads
    CreateGroupCpiBuilder::new(&ctx.accounts.permission_program.to_account_info())
        .group(&ctx.accounts.group.to_account_info())
        .id(id)
        .members(vec![])
        .payer(&ctx.accounts.payer.to_account_info())
        .system_program(&ctx.accounts.system_program.to_account_info())
        .invoke()?;

    // 2. Permission binding round_secret to the group; signed by round_secret PDA
    let (_, bump) = Pubkey::find_program_address(
        &[SECRET_SEED, game_key.as_ref()],
        &crate::ID,
    );
    let seeds: &[&[u8]] = &[SECRET_SEED, game_key.as_ref(), &[bump]];

    CreatePermissionCpiBuilder::new(&ctx.accounts.permission_program.to_account_info())
        .permission(&ctx.accounts.permission.to_account_info())
        .delegated_account(&ctx.accounts.round_secret.to_account_info())
        .group(&ctx.accounts.group.to_account_info())
        .payer(&ctx.accounts.payer.to_account_info())
        .system_program(&ctx.accounts.system_program.to_account_info())
        .invoke_signed(&[seeds])?;

    Ok(())
}

#[derive(Accounts)]
pub struct CreateRoundSecretPermission<'info> {
    /// CHECK: just used as seed reference for the round_secret PDA
    pub game_config: UncheckedAccount<'info>,

    /// CHECK: PDA owned by this program; becomes signer via invoke_signed for the permission CPI
    #[account(
        seeds = [SECRET_SEED, game_config.key().as_ref()],
        bump,
    )]
    pub round_secret: UncheckedAccount<'info>,

    /// CHECK: created by the permission program CPI
    #[account(mut)]
    pub permission: UncheckedAccount<'info>,

    /// CHECK: created by the permission program CPI
    #[account(mut)]
    pub group: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: the magicblock permission program
    #[account(address = magicblock_permission_client::ID)]
    pub permission_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}
