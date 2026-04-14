import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey("CMncdtg37g7aDrszRyaUUhvtU8yia9JuNVrGJxnXbmWt");

export const DELEGATION_PROGRAM_ID = new PublicKey("DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh");
export const PERMISSION_PROGRAM_ID = new PublicKey("ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1");

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

// VRF — two queues in ephemeral-vrf-sdk 0.2.3:
//  DEFAULT_QUEUE           = Cuj97…XGh → base-layer requests (devnet/mainnet)
//  DEFAULT_EPHEMERAL_QUEUE = 5hBR5…R5Tc → ephemeral (PER/TEE) requests
// We run VRF on the PER, so use the ephemeral queue.
export const VRF_ORACLE_QUEUE = new PublicKey("5hBR571xnXppuCPveTrctfTU7tJLSN94nq7kv7FRK5Tc");
export const VRF_PROGRAM_ID = new PublicKey("Vrf1RNUjXmQGjmQrQLvJHs9SNkvDJEsRVFPkfSQUwGz");
export const VRF_PROGRAM_IDENTITY = new PublicKey("9irBy75QS2BN81FUgXuHcjqceJJRuc9oDkAe8TKVvvAw");
export const SLOT_HASHES = new PublicKey("SysvarS1otHashes111111111111111111111111111");
