import { PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { permissionPdaFromAccount } from "@magicblock-labs/ephemeral-rollups-sdk";
import type { NumberRush } from "./number_rush_types";
import {
  PROGRAM_ID,
  GAME_SEED,
  PLAYER_SEED,
  GUESS_SEED,
  VAULT_SEED,
  SECRET_SEED,
  LEADERBOARD_SEED,
  REVEAL_SEED,
  PERMISSION_PROGRAM_ID,
  SESSION_PROGRAM_ID,
} from "./constants";

// Import IDL
import idl from "./number_rush.json";

// ─── PDA derivations ───

export function getGameConfigPda(gameId: BN): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [GAME_SEED, gameId.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
  return pda;
}

export function getVaultPda(gameConfig: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [VAULT_SEED, gameConfig.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function getLeaderboardPda(gameConfig: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [LEADERBOARD_SEED, gameConfig.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function getRoundRevealPda(gameConfig: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [REVEAL_SEED, gameConfig.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function getRoundSecretPda(gameConfig: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [SECRET_SEED, gameConfig.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function getPlayerStatePda(gameConfig: PublicKey, player: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [PLAYER_SEED, gameConfig.toBuffer(), player.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function getPlayerGuessPda(gameConfig: PublicKey, player: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [GUESS_SEED, gameConfig.toBuffer(), player.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function getPermissionPda(account: PublicKey): PublicKey {
  // magicblock-permission-client uses seed "permission:" (same as sdk helper)
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("permission:"), account.toBuffer()],
    PERMISSION_PROGRAM_ID
  );
  return pda;
}

export function getGroupPda(id: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("group:"), id.toBuffer()],
    PERMISSION_PROGRAM_ID
  );
  return pda;
}

export function getSessionTokenPda(
  sessionSigner: PublicKey,
  authority: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("session_token"),
      PROGRAM_ID.toBuffer(),
      sessionSigner.toBuffer(),
      authority.toBuffer(),
    ],
    SESSION_PROGRAM_ID
  );
  return pda;
}

// ─── Program instance ───

export function getProgram(provider: AnchorProvider): Program<NumberRush> {
  return new Program(idl as any, provider);
}
