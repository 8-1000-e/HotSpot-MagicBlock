use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::access_control::instructions::CreatePermissionCpiBuilder;
use ephemeral_rollups_sdk::access_control::structs::MembersArgs;
use ephemeral_rollups_sdk::consts::PERMISSION_PROGRAM_ID;

use crate::constants::*;
use crate::state::*;

/// Create a Permission for the RoundSecret account, blocking ALL RPC reads.
/// This must be called AFTER the RoundSecret has been delegated to the PER.
///
/// Members = Some(vec![]) → nobody can read the target_number via RPC.
/// The program itself can still access it in instruction contexts (e.g. submit_guess).
/// At end of round, UpdatePermissionCpiBuilder with members = None will open it for reveal.
pub fn handler(ctx: Context<CreateRoundSecretPermission>) -> Result<()> {
    let game_key = ctx.accounts.game_config.key();

    // Derive the seeds + bump for the RoundSecret PDA so we can sign the CPI
    let seed_data: Vec<Vec<u8>> = vec![
        SECRET_SEED.to_vec(),
        game_key.to_bytes().to_vec(),
    ];

    let (_, bump) = Pubkey::find_program_address(
        &seed_data.iter().map(|s| s.as_slice()).collect::<Vec<_>>(),
        &crate::ID,
    );

    let mut seeds = seed_data.clone();
    seeds.push(vec![bump]);
    let seed_refs: Vec<&[u8]> = seeds.iter().map(|s| s.as_slice()).collect();

    // Empty members vec → nobody can read via RPC (only the program reads it in instructions)
    let members = Some(vec![]);

    CreatePermissionCpiBuilder::new(&ctx.accounts.permission_program.to_account_info())
        .permissioned_account(&ctx.accounts.round_secret.to_account_info())
        .permission(&ctx.accounts.permission.to_account_info())
        .payer(&ctx.accounts.payer.to_account_info())
        .system_program(&ctx.accounts.system_program.to_account_info())
        .args(MembersArgs { members })
        .invoke_signed(&[seed_refs.as_slice()])?;

    Ok(())
}

#[derive(Accounts)]
pub struct CreateRoundSecretPermission<'info> {
    pub game_config: Account<'info, GameConfig>,

    /// CHECK: validated by the permission program via PDA seeds
    #[account(
        seeds = [SECRET_SEED, game_config.key().as_ref()],
        bump,
    )]
    pub round_secret: UncheckedAccount<'info>,

    /// CHECK: created by the permission program CPI
    #[account(mut)]
    pub permission: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: PERMISSION PROGRAM
    #[account(address = PERMISSION_PROGRAM_ID)]
    pub permission_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}
