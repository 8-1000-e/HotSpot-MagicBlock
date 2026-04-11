use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::*;
use crate::state::*;


pub fn handler(ctx: Context<InitGame>, game_id: u64, bet_amount: u64) -> Result<()> 
{
    require!(bet_amount > 0, GameError::InvalidBetAmount);

    let now = Clock::get()?.unix_timestamp;


    //init game_config
    ctx.accounts.game_config.game_id = game_id;
    ctx.accounts.game_config.status = 0;
    ctx.accounts.game_config.active_players = 0;
    ctx.accounts.game_config.current_round = 0;
    ctx.accounts.game_config.round_start_time = 0;
    ctx.accounts.game_config.lobby_end = now + LOBBY_DURATION;
    ctx.accounts.game_config.bet_amount = bet_amount;
    ctx.accounts.game_config.authority = ctx.accounts.authority.key();
    ctx.accounts.game_config.player_count = 0;
    ctx.accounts.game_config.players = [[0u8; 32]; MAX_PLAYERS];
    ctx.accounts.game_config.bump = ctx.bumps.game_config;


    // init vault (game ref, bump)
    ctx.accounts.vault.game = ctx.accounts.game_config.key();
    ctx.accounts.vault.total_pot = 0;
    ctx.accounts.vault.deposits_count = 0;
    ctx.accounts.vault.payout_status = 0;
    ctx.accounts.vault.bump = ctx.bumps.vault;

    //init leaderboard (game ref, bump)
    ctx.accounts.leaderboard.game = ctx.accounts.game_config.key();
    ctx.accounts.leaderboard.entries = [[0u8; 32]; MAX_PLAYERS];
    ctx.accounts.leaderboard.attempts = [0u16; MAX_PLAYERS];
    ctx.accounts.leaderboard.times = [0u64; MAX_PLAYERS];
    ctx.accounts.leaderboard.count = 0;
    ctx.accounts.leaderboard.bump = ctx.bumps.leaderboard;


    //init round_reveal (game ref, bump)
    ctx.accounts.round_reveal.game = ctx.accounts.game_config.key();
    ctx.accounts.round_reveal.targets = [0u16; MAX_ROUNDS as usize];
    ctx.accounts.round_reveal.player_attempts = [[0u8; MAX_PLAYERS]; MAX_ROUNDS as usize];
    ctx.accounts.round_reveal.player_found = [[false; MAX_PLAYERS]; MAX_ROUNDS as usize];
    ctx.accounts.round_reveal.last_revealed_round = 0;
    ctx.accounts.round_reveal.bump = ctx.bumps.round_reveal;


    //init round_secret (game ref, bump) — target stays 0 until start_game
    ctx.accounts.round_secret.game = ctx.accounts.game_config.key();
    ctx.accounts.round_secret.target_number = 0;
    ctx.accounts.round_secret.bump = ctx.bumps.round_secret;

    Ok(())
}

#[derive(Accounts)]
#[instruction(game_id: u64, bet_amount: u64)]
pub struct InitGame<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + GameConfig::INIT_SPACE,
        seeds = [GAME_SEED, &game_id.to_le_bytes()],
        bump,
    )]
    pub game_config: Account<'info, GameConfig>,

    #[account(
        init,
        payer = authority,
        space = 8 + Vault::INIT_SPACE,
        seeds = [VAULT_SEED, game_config.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init,
        payer = authority,
        space = 8 + Leaderboard::INIT_SPACE,
        seeds = [b"leaderboard", game_config.key().as_ref()],
        bump,
    )]
    pub leaderboard: Account<'info, Leaderboard>,

    #[account(
        init,
        payer = authority,
        space = 8 + RoundReveal::INIT_SPACE,
        seeds = [b"reveal", game_config.key().as_ref()],
        bump,
    )]
    pub round_reveal: Account<'info, RoundReveal>,

    #[account(
        init,
        payer = authority,
        space = 8 + RoundSecret::INIT_SPACE,
        seeds = [SECRET_SEED, game_config.key().as_ref()],
        bump,
    )]
    pub round_secret: Account<'info, RoundSecret>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
