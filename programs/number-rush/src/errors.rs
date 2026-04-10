use anchor_lang::prelude::*;

#[error_code]
pub enum GameError {
    #[msg("Game is not in Waiting state")]
    GameNotWaiting,
    #[msg("Game is not in Playing state")]
    GameNotPlaying,
    #[msg("Game is already finished")]
    GameFinished,
    #[msg("Too many players")]
    TooManyPlayers,
    #[msg("Player is eliminated")]
    PlayerEliminated,
    #[msg("Player already found the number this round")]
    AlreadyFound,
    #[msg("Guess out of range (0-1000)")]
    GuessOutOfRange,
    #[msg("Max attempts reached for this round")]
    MaxAttemptsReached,
    #[msg("Timer expired for this attempt")]
    TimerExpired,
    #[msg("Round is not over yet")]
    RoundNotOver,
    #[msg("All rounds completed")]
    AllRoundsCompleted,
    #[msg("Lobby not over yet")]
    LobbyNotOver,
    #[msg("Not enough players")]
    NotEnoughPlayers,
    #[msg("Payout already distributed")]
    AlreadyDistributed,
    #[msg("Unauthorized")]
    Unauthorized,
}
