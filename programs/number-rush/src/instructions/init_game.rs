use anchor_lang::prelude::*;
use crate::constants::*;
use crate::state::*;

pub fn handler(ctx: Context<InitGame>, game_id: u64, bet_amount: u64) -> Result<()> {
    // TODO: init game_config fields (status=0, bet_amount, lobby_end=now+LOBBY_DURATION, authority, etc.)
    // TODO: init vault (game ref, bump)
    // TODO: init leaderboard (game ref, bump)
    // TODO: init round_reveal (game ref, bump)
    // TODO: init round_secret (game ref, bump) — target stays 0 until start_game
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
