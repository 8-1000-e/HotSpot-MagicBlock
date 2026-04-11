use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::ephemeral;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("3ufsJSDXPz2kSWuZr9bSPM4azb9u8PanYgNDsrK9iohQ");

#[ephemeral]
#[program]
pub mod number_rush {
    use super::*;

    pub fn init_game(ctx: Context<InitGame>, game_id: u64, bet_amount: u64) -> Result<()> {
        instructions::init_game::handler(ctx, game_id, bet_amount)
    }

    pub fn spawn_player(ctx: Context<SpawnPlayer>) -> Result<()> {
        instructions::spawn_player::handler(ctx)
    }

    pub fn delegate_game(ctx: Context<DelegateGame>) -> Result<()> {
        instructions::delegate_game::handler(ctx)
    }

    pub fn delegate_meta(ctx: Context<DelegateMeta>) -> Result<()> {
        instructions::delegate_meta::handler(ctx)
    }

    pub fn delegate_player(ctx: Context<DelegatePlayer>) -> Result<()> {
        instructions::delegate_player::handler(ctx)
    }

    pub fn create_player_permission(ctx: Context<CreatePlayerPermission>) -> Result<()> {
        instructions::create_player_permission::handler(ctx)
    }

    pub fn create_round_secret_permission(ctx: Context<CreateRoundSecretPermission>) -> Result<()> {
        instructions::create_round_secret_permission::handler(ctx)
    }

    pub fn start_game(ctx: Context<StartGame>) -> Result<()> {
        instructions::start_game::handler(ctx)
    }

    pub fn vrf_callback_set_target(
        ctx: Context<VrfCallbackSetTarget>,
        randomness: [u8; 32],
    ) -> Result<()> {
        instructions::vrf_callback_set_target::handler(ctx, randomness)
    }

    pub fn submit_guess(ctx: Context<SubmitGuess>, guess: u16) -> Result<()> {
        instructions::submit_guess::handler(ctx, guess)
    }

    pub fn end_round(ctx: Context<EndRound>) -> Result<()> {
        instructions::end_round::handler(ctx)
    }

    pub fn end_game(ctx: Context<EndGame>) -> Result<()> {
        instructions::end_game::handler(ctx)
    }
}
