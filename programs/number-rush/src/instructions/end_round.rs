use anchor_lang::prelude::*;
use ephemeral_vrf_sdk::instructions::{create_request_randomness_ix, RequestRandomnessParams};
use ephemeral_vrf_sdk::types::SerializableAccountMeta;
use anchor_lang::solana_program::program::invoke;
use crate::constants::*;
use crate::errors::*;
use crate::state::*;

pub fn handler(ctx: Context<EndRound>) -> Result<()>
{
    require!(ctx.accounts.game_config.status == GameStatus::Playing, GameError::InvalidGameStatus);

    let round = ctx.accounts.game_config.current_round;
    require!(round >= 1 && round <= MAX_ROUNDS, GameError::AllRoundsCompleted);
    let round_idx = (round - 1) as usize;
    let player_count = ctx.accounts.game_config.player_count as usize;

    ctx.accounts.round_reveal.targets[round_idx] = ctx.accounts.round_secret.target_number;
    ctx.accounts.round_reveal.last_revealed_round = round;

    // Iterate remaining_accounts = PlayerState PDAs (in game_config.players order)
    for (i, acc) in ctx.remaining_accounts.iter().enumerate().take(player_count) {
        let mut data = acc.try_borrow_mut_data()?;
        // Skip 8-byte discriminator
        let player_state = PlayerState::try_deserialize(&mut &data[..])?;

        // Populate reveal
        ctx.accounts.round_reveal.player_attempts[round_idx][i] = player_state.round_attempts;
        ctx.accounts.round_reveal.player_found[round_idx][i] = player_state.found_this_round;

        // Update leaderboard
        ctx.accounts.leaderboard.entries[i] = acc.key().to_bytes();
        ctx.accounts.leaderboard.attempts[i] = player_state.total_attempts;
        ctx.accounts.leaderboard.times[i] = player_state.total_time_slot;

        // Reset per-round state
        let mut player_state_mut = PlayerState::try_deserialize(&mut &data[..])?;
        player_state_mut.round_attempts = 0;
        player_state_mut.found_this_round = false;
        player_state_mut.proximity = PROXIMITY_NONE;
        player_state_mut.direction = Direction::None;
        player_state_mut.try_serialize(&mut &mut data[8..])?;
    }
    ctx.accounts.leaderboard.count = player_count as u8;

    // Sort leaderboard by attempts asc, tiebreak times asc (insertion sort)
    let count = player_count;
    for i in 1..count {
        let mut j = i;
        while j > 0
            && (ctx.accounts.leaderboard.attempts[j] < ctx.accounts.leaderboard.attempts[j - 1]
                || (ctx.accounts.leaderboard.attempts[j] == ctx.accounts.leaderboard.attempts[j - 1]
                    && ctx.accounts.leaderboard.times[j] < ctx.accounts.leaderboard.times[j - 1]))
        {
            ctx.accounts.leaderboard.entries.swap(j, j - 1);
            ctx.accounts.leaderboard.attempts.swap(j, j - 1);
            ctx.accounts.leaderboard.times.swap(j, j - 1);
            j -= 1;
        }
    }

    if round >= MAX_ROUNDS {
        ctx.accounts.game_config.status = GameStatus::Finished;
    } else {
        ctx.accounts.game_config.current_round = round + 1;
        ctx.accounts.game_config.round_found_count = 0;
        ctx.accounts.game_config.round_start_slot = Clock::get()?.slot;

        // Request VRF for next round target
        let game_key = ctx.accounts.game_config.key();
        let callback_accounts = vec![
            SerializableAccountMeta {
                pubkey: ctx.accounts.round_secret.key(),
                is_signer: false,
                is_writable: true,
            },
        ];

        let ix = create_request_randomness_ix(RequestRandomnessParams {
            payer: ctx.accounts.payer.key(),
            oracle_queue: ctx.accounts.oracle_queue.key(),
            callback_program_id: crate::ID,
            callback_discriminator: crate::instruction::VrfCallbackSetTarget::DISCRIMINATOR.to_vec(),
            accounts_metas: Some(callback_accounts),
            caller_seed: {
                let mut seed = [0u8; 32];
                seed[..31].copy_from_slice(&game_key.to_bytes()[..31]);
                seed[31] = round + 1; // next round number
                seed
            },
            ..Default::default()
        });

        invoke(&ix, ctx.remaining_accounts)?;
    }

    Ok(())
}

#[derive(Accounts)]
pub struct EndRound<'info> {
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
        seeds = [REVEAL_SEED, game_config.key().as_ref()],
        bump = round_reveal.bump,
    )]
    pub round_reveal: Box<Account<'info, RoundReveal>>,

    #[account(
        mut,
        seeds = [SECRET_SEED, game_config.key().as_ref()],
        bump = round_secret.bump,
    )]
    pub round_secret: Box<Account<'info, RoundSecret>>,

    /// Server wallet — pays for VRF request (next round)
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: VRF oracle queue
    #[account(mut)]
    pub oracle_queue: UncheckedAccount<'info>,
    // remaining_accounts: PlayerState PDAs for all players (in game_config.players order)
}
