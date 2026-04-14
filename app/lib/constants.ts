import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey("r8DW7ECLY6zhpYzYUazULHUyHCas3A2j1Ecfvzd1xRa");

export const DELEGATION_PROGRAM_ID = new PublicKey("DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh");
// Magicblock permission program (matches magicblock-permission-client::ID in our vendored crate).
// The OLD ID ACLseoPoy… belongs to ephemeral_rollups_sdk::access_control which we no longer use.
export const PERMISSION_PROGRAM_ID = new PublicKey("BTWAqWNBmF2TboMh3fxMJfgR16xGHYD7Kgr2dPwbRPBi");

// Devnet endpoints (Helius)
export const L1_RPC = "https://devnet.helius-rpc.com/?api-key=f9ec4abd-caee-4752-84d6-82d8fcc1705d";
export const L1_WS = "wss://devnet.helius-rpc.com/?api-key=f9ec4abd-caee-4752-84d6-82d8fcc1705d";
// TEE endpoints — use devnet-tee (more stable, has VRF enabled per MagicBlock admin)
export const TEE_RPC_BASE = "https://devnet-tee.magicblock.app";
export const TEE_WS_BASE = "wss://devnet-tee.magicblock.app";

// Seeds (must match program constants)
export const GAME_SEED = Buffer.from("game");
export const PLAYER_SEED = Buffer.from("player");
export const GUESS_SEED = Buffer.from("guess");
export const VAULT_SEED = Buffer.from("vault");
export const SECRET_SEED = Buffer.from("secret");
export const LEADERBOARD_SEED = Buffer.from("leaderboard");
export const REVEAL_SEED = Buffer.from("reveal");

// GPL Session program (magicblock-labs/gum-program-library)
export const SESSION_PROGRAM_ID = new PublicKey("KeyspM2ssCJbqUhQ4k7sveSiY4WjnYsrXkC8oDbwde5");

// VRF — two queues in ephemeral-vrf-sdk 0.2.3:
//  DEFAULT_QUEUE           = Cuj97…XGh → base-layer requests (devnet/mainnet)
//  DEFAULT_EPHEMERAL_QUEUE = 5hBR5…R5Tc → ephemeral (PER/TEE) requests
// We run VRF on the PER, so use the ephemeral queue.
export const VRF_ORACLE_QUEUE = new PublicKey("5hBR571xnXppuCPveTrctfTU7tJLSN94nq7kv7FRK5Tc");
export const VRF_PROGRAM_ID = new PublicKey("Vrf1RNUjXmQGjmQrQLvJHs9SNkvDJEsRVFPkfSQUwGz");
export const VRF_PROGRAM_IDENTITY = new PublicKey("9irBy75QS2BN81FUgXuHcjqceJJRuc9oDkAe8TKVvvAw");
export const SLOT_HASHES = new PublicKey("SysvarS1otHashes111111111111111111111111111");
