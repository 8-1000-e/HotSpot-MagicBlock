"use client";

import { FC, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";

const WalletMultiButtonDynamic = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import {
  DELEGATION_PROGRAM_ID,
  delegateBufferPdaFromDelegatedAccountAndOwnerProgram,
  delegationRecordPdaFromDelegatedAccount,
  delegationMetadataPdaFromDelegatedAccount,
} from "@magicblock-labs/ephemeral-rollups-sdk";
import {
  getProgram,
  getGameConfigPda,
  getVaultPda,
  getLeaderboardPda,
  getRoundRevealPda,
  getRoundSecretPda,
  getPlayerStatePda,
  getPlayerGuessPda,
  getPermissionPda,
} from "../lib/program";
import {
  PROGRAM_ID, TEE_RPC_BASE, TEE_WS_BASE,
  VRF_ORACLE_QUEUE, VRF_PROGRAM_ID, SLOT_HASHES,
} from "../lib/constants";
import {
  getAuthToken,
} from "@magicblock-labs/ephemeral-rollups-sdk";

type Phase = "menu" | "lobby" | "playing" | "finished";

// Helper: build TX, sign with wallet, send on a specific connection
async function buildSignSend(
  program: any,
  method: any,
  accounts: any,
  conn: Connection,
  wallet: any,
  opts?: { remainingAccounts?: any[] }
) {
  let builder = method.accountsPartial(accounts);
  if (opts?.remainingAccounts) builder = builder.remainingAccounts(opts.remainingAccounts);
  const tx = await builder.transaction();
  tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
  tx.feePayer = wallet.publicKey;
  const signed = await wallet.signTransaction(tx);
  // Debug: skipPreflight=false surfaces on-chain errors instead of hiding them
  const sig = await conn.sendRawTransaction(signed.serialize(), { skipPreflight: false });
  await conn.confirmTransaction(sig, "confirmed");
  return sig;
}

export const Game: FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [phase, setPhase] = useState<Phase>("menu");
  const [gameId, setGameId] = useState<string>("");
  const [joinGameId, setJoinGameId] = useState<string>("");
  const [betAmount, setBetAmount] = useState<string>("0.01");
  const [guess, setGuess] = useState<string>("");
  const [loading, setLoading] = useState<string>("");

  const [gameState, setGameState] = useState<any>(null);
  const [playerState, setPlayerState] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [gameConfigPda, setGameConfigPda] = useState<PublicKey | null>(null);
  const [erConnection, setErConnection] = useState<Connection | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [guessHistory, setGuessHistory] = useState<{ guess: number; proximity: string; direction: string }[]>([]);
  const [otherPlayers, setOtherPlayers] = useState<any[]>([]);

  const log = useCallback((msg: string) => {
    console.log(msg);
    setLogs((prev) => [...prev.slice(-50), `${new Date().toLocaleTimeString()} ${msg}`]);
  }, []);

  const getL1Program = useCallback(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) return null;
    return getProgram(new AnchorProvider(connection, wallet as any, { commitment: "confirmed" }));
  }, [connection, wallet]);

  const getErProgram = useCallback(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions || !erConnection) return null;
    return getProgram(new AnchorProvider(erConnection, wallet as any, { commitment: "confirmed" }));
  }, [wallet, erConnection]);

  // ─── Authenticate to TEE PER ───
  const handleAuthTee = useCallback(async () => {
    if (!wallet.publicKey || !wallet.signMessage) return;
    setLoading("Authenticating to TEE...");
    try {
      const result = await getAuthToken(
        TEE_RPC_BASE,
        wallet.publicKey,
        (message: Uint8Array) => wallet.signMessage!(message)
      );
      log(`TEE token expires in ${Math.round((result.expiresAt - Date.now()) / 1000)}s`);
      const conn = new Connection(`${TEE_RPC_BASE}?token=${result.token}`, {
        wsEndpoint: `${TEE_WS_BASE}?token=${result.token}`,
      });
      setErConnection(conn);
      log("TEE authenticated!");
    } catch (e: any) {
      log(`TEE auth error: ${e.message}`);
    }
    setLoading("");
  }, [wallet, log]);

  // ─── Refresh state from ER (primary) or L1 (fallback) ───
  const refreshGameState = useCallback(async (pda?: PublicKey) => {
    const target = pda || gameConfigPda;
    if (!target) return;
    for (const program of [getErProgram(), getL1Program()].filter(Boolean)) {
      if (!program) continue;
      try {
        const state = await program.account.gameConfig.fetch(target);
        setGameState(state);
        // Only auto-switch to finished, never to playing (that's manual via "Enter Game")
        if (state.status?.finished !== undefined) setPhase("finished");
        return;
      } catch {}
    }
  }, [gameConfigPda, getErProgram, getL1Program]);

  const refreshPlayerState = useCallback(async () => {
    if (!gameConfigPda || !wallet.publicKey) return;
    for (const program of [getErProgram(), getL1Program()].filter(Boolean)) {
      if (!program) continue;
      try {
        const state = await program.account.playerState.fetch(
          getPlayerStatePda(gameConfigPda, wallet.publicKey)
        );
        setPlayerState(state);
        return;
      } catch {}
    }
  }, [gameConfigPda, wallet.publicKey, getErProgram, getL1Program]);

  const getDelegationPdas = useCallback((account: PublicKey) => ({
    buffer: delegateBufferPdaFromDelegatedAccountAndOwnerProgram(account, PROGRAM_ID),
    record: delegationRecordPdaFromDelegatedAccount(account),
    metadata: delegationMetadataPdaFromDelegatedAccount(account),
  }), []);

  // ─── CREATE GAME + AUTO-JOIN (L1) ───
  const handleCreateGame = useCallback(async () => {
    const program = getL1Program();
    if (!program || !wallet.publicKey) return;
    setLoading("Creating game...");
    try {
      const id = new BN(gameId || Math.floor(Math.random() * 1000000).toString());
      const bet = new BN(Number(betAmount) * 1e9);
      const gameConfig = getGameConfigPda(id);

      await program.methods.initGame(id, bet)
        .accountsPartial({ authority: wallet.publicKey })
        .rpc({ skipPreflight: true });
      log(`Game ${id.toString()} created!`);
      setGameConfigPda(gameConfig);
      setGameId(id.toString());

      await new Promise((r) => setTimeout(r, 2000));

      log("Auto-joining...");
      await program.methods.spawnPlayer()
        .accountsPartial({ gameConfig, player: wallet.publicKey, payer: wallet.publicKey })
        .rpc({ skipPreflight: true });
      log("Joined!");

      await refreshGameState(gameConfig);
      setPhase("lobby");
    } catch (e: any) { log(`Error: ${e.message}`); }
    setLoading("");
  }, [getL1Program, wallet.publicKey, gameId, betAmount, log, refreshGameState]);

  // ─── JOIN GAME (L1) ───
  const handleJoinGame = useCallback(async () => {
    const program = getL1Program();
    if (!program || !wallet.publicKey) return;
    setLoading("Joining game...");
    try {
      const id = new BN(joinGameId || gameId);
      const gamePda = getGameConfigPda(id);

      await program.methods.spawnPlayer()
        .accountsPartial({ gameConfig: gamePda, player: wallet.publicKey, payer: wallet.publicKey })
        .rpc({ skipPreflight: true });

      log(`Joined game ${id.toString()}!`);
      setGameConfigPda(gamePda);
      setGameId(id.toString());
      await refreshGameState(gamePda);
      setPhase("lobby");
    } catch (e: any) { log(`Error: ${e.message}`); }
    setLoading("");
  }, [getL1Program, wallet.publicKey, joinGameId, gameId, log, refreshGameState]);

  // ─── Sign all TXs in 1 popup, send sequentially on L1 ───
  const signAndSendAll = useCallback(async (txs: any[], label: string) => {
    if (!wallet.signAllTransactions) return;
    const { blockhash } = await connection.getLatestBlockhash();
    for (const tx of txs) { tx.recentBlockhash = blockhash; tx.feePayer = wallet.publicKey!; }
    log(`Signing ${txs.length} txs (1 approval)...`);
    const signed = await wallet.signAllTransactions(txs);
    for (let i = 0; i < signed.length; i++) {
      const sig = await connection.sendRawTransaction(signed[i].serialize(), { skipPreflight: true });
      await connection.confirmTransaction(sig, "confirmed");
      log(`${label} ${i + 1}/${signed.length} confirmed`);
    }
  }, [connection, wallet, log]);

  // ─── DELEGATE CREATOR (L1 → ER) ───
  const handleDelegateCreator = useCallback(async () => {
    const program = getL1Program();
    if (!program || !wallet.publicKey || !gameConfigPda) return;
    setLoading("Delegating...");
    try {
      const v = getVaultPda(gameConfigPda), rs = getRoundSecretPda(gameConfigPda);
      const lb = getLeaderboardPda(gameConfigPda), rr = getRoundRevealPda(gameConfigPda);
      const ps = getPlayerStatePda(gameConfigPda, wallet.publicKey);
      const pg = getPlayerGuessPda(gameConfigPda, wallet.publicKey);
      const d = (a: PublicKey) => getDelegationPdas(a);

      const tx1 = await program.methods.delegateGame().accountsPartial({
        gameConfig: gameConfigPda, vault: v, roundSecret: rs, payer: wallet.publicKey,
        bufferGameConfig: d(gameConfigPda).buffer, delegationRecordGameConfig: d(gameConfigPda).record, delegationMetadataGameConfig: d(gameConfigPda).metadata,
        bufferVault: d(v).buffer, delegationRecordVault: d(v).record, delegationMetadataVault: d(v).metadata,
        bufferRoundSecret: d(rs).buffer, delegationRecordRoundSecret: d(rs).record, delegationMetadataRoundSecret: d(rs).metadata,
        ownerProgram: PROGRAM_ID, delegationProgram: DELEGATION_PROGRAM_ID,
      }).transaction();

      const tx2 = await program.methods.delegateMeta().accountsPartial({
        gameConfig: gameConfigPda, leaderboard: lb, roundReveal: rr, payer: wallet.publicKey,
        bufferLeaderboard: d(lb).buffer, delegationRecordLeaderboard: d(lb).record, delegationMetadataLeaderboard: d(lb).metadata,
        bufferRoundReveal: d(rr).buffer, delegationRecordRoundReveal: d(rr).record, delegationMetadataRoundReveal: d(rr).metadata,
        ownerProgram: PROGRAM_ID, delegationProgram: DELEGATION_PROGRAM_ID,
      }).transaction();

      const tx3 = await program.methods.delegatePlayer().accountsPartial({
        gameConfig: gameConfigPda, playerAuthority: wallet.publicKey, playerState: ps, playerGuess: pg, payer: wallet.publicKey,
        bufferPlayerState: d(ps).buffer, delegationRecordPlayerState: d(ps).record, delegationMetadataPlayerState: d(ps).metadata,
        bufferPlayerGuess: d(pg).buffer, delegationRecordPlayerGuess: d(pg).record, delegationMetadataPlayerGuess: d(pg).metadata,
        ownerProgram: PROGRAM_ID, delegationProgram: DELEGATION_PROGRAM_ID,
      }).transaction();

      await signAndSendAll([tx1, tx2, tx3], "delegate");
      log("All delegated!");
    } catch (e: any) { log(`Delegation error: ${e.message}`); }
    setLoading("");
  }, [getL1Program, wallet.publicKey, gameConfigPda, log, getDelegationPdas, signAndSendAll]);

  // ─── DELEGATE PLAYER (L1 → ER) ───
  const handleDelegatePlayer = useCallback(async () => {
    const program = getL1Program();
    if (!program || !wallet.publicKey || !gameConfigPda) return;
    setLoading("Delegating player...");
    try {
      const ps = getPlayerStatePda(gameConfigPda, wallet.publicKey);
      const pg = getPlayerGuessPda(gameConfigPda, wallet.publicKey);
      const d = (a: PublicKey) => getDelegationPdas(a);

      const tx = await program.methods.delegatePlayer().accountsPartial({
        gameConfig: gameConfigPda, playerAuthority: wallet.publicKey, playerState: ps, playerGuess: pg, payer: wallet.publicKey,
        bufferPlayerState: d(ps).buffer, delegationRecordPlayerState: d(ps).record, delegationMetadataPlayerState: d(ps).metadata,
        bufferPlayerGuess: d(pg).buffer, delegationRecordPlayerGuess: d(pg).record, delegationMetadataPlayerGuess: d(pg).metadata,
        ownerProgram: PROGRAM_ID, delegationProgram: DELEGATION_PROGRAM_ID,
      }).transaction();

      await signAndSendAll([tx], "delegate player");
      log("Player delegated!");
    } catch (e: any) { log(`Delegation error: ${e.message}`); }
    setLoading("");
  }, [getL1Program, wallet.publicKey, gameConfigPda, log, getDelegationPdas, signAndSendAll]);

  // ─── CREATE PLAYER PERMISSION (ER) — restricts PlayerGuess reads to the player ───
  const handleCreatePlayerPermission = useCallback(async () => {
    const program = getErProgram();
    if (!program || !wallet.publicKey || !gameConfigPda || !erConnection) return;
    setLoading("Creating player permission...");
    try {
      const playerGuess = getPlayerGuessPda(gameConfigPda, wallet.publicKey);
      await buildSignSend(program, program.methods.createPlayerPermission(), {
        gameConfig: gameConfigPda,
        playerAuthority: wallet.publicKey,
        playerGuess,
        permission: getPermissionPda(playerGuess),
        payer: wallet.publicKey,
      }, erConnection, wallet);
      log("PlayerGuess is now private (reads restricted to you).");
    } catch (e: any) { log(`Permission error: ${e.message}`); }
    setLoading("");
  }, [getErProgram, wallet, gameConfigPda, erConnection, log]);

  // ─── CREATE ROUND SECRET PERMISSION (ER) — blocks all RPC reads of target_number ───
  const handleCreateRoundSecretPermission = useCallback(async () => {
    const program = getErProgram();
    if (!program || !wallet.publicKey || !gameConfigPda || !erConnection) return;
    setLoading("Creating round secret permission...");
    try {
      const roundSecret = getRoundSecretPda(gameConfigPda);
      await buildSignSend(program, program.methods.createRoundSecretPermission(), {
        gameConfig: gameConfigPda,
        roundSecret,
        permission: getPermissionPda(roundSecret),
        payer: wallet.publicKey,
      }, erConnection, wallet);
      log("RoundSecret is now private (target_number hidden from RPC).");
    } catch (e: any) { log(`Permission error: ${e.message}`); }
    setLoading("");
  }, [getErProgram, wallet, gameConfigPda, erConnection, log]);

  // ─── START GAME + VRF (PER) — runs AFTER delegation + auth + permissions ───
  // Target generated on the PER only, protected by RoundSecret permission. Never leaks to L1.
  const handleStartGame = useCallback(async () => {
    const program = getErProgram();
    if (!program || !wallet.publicKey || !gameConfigPda || !erConnection) return;
    setLoading("Starting game on PER...");
    try {
      // 1. start_game on PER — set status Playing (requires delegated game_config + vault)
      await buildSignSend(program, program.methods.startGame(), {
        gameConfig: gameConfigPda,
        vault: getVaultPda(gameConfigPda),
        payer: wallet.publicKey,
      }, erConnection, wallet);
      log("Status set to Playing!");

      // 2. request_target on PER — VRF writes target_number inside the TEE
      setLoading("Requesting VRF target on PER...");
      const [programIdentity] = PublicKey.findProgramAddressSync([Buffer.from("identity")], PROGRAM_ID);
      await buildSignSend(program, program.methods.requestTarget(), {
        gameConfig: gameConfigPda,
        roundSecret: getRoundSecretPda(gameConfigPda),
        payer: wallet.publicKey,
        oracleQueue: VRF_ORACLE_QUEUE,
        programIdentity,
        vrfProgram: VRF_PROGRAM_ID,
        slotHashes: SLOT_HASHES,
        systemProgram: SystemProgram.programId,
      }, erConnection, wallet);
      log("VRF requested! Waiting for callback...");

      // 3. Poll for VRF callback — don't try to read target_number (permission blocks it).
      //    Wait a few seconds for the oracle to respond inside the TEE.
      setLoading("Waiting for VRF callback...");
      await new Promise((r) => setTimeout(r, 5000));

      log("Game started! Target is sealed in the TEE.");
      await refreshGameState();
    } catch (e: any) { log(`Error: ${e.message}`); }
    setLoading("");
  }, [getErProgram, wallet, gameConfigPda, erConnection, log, refreshGameState]);

  // ─── SUBMIT GUESS (ER) — all accounts explicit ───
  const handleSubmitGuess = useCallback(async () => {
    const program = getErProgram();
    if (!program || !wallet.publicKey || !gameConfigPda || !guess) return;

    // Block if already at max attempts
    if (playerState && playerState.roundAttempts >= 15) {
      log("Max attempts reached (15/15)");
      return;
    }

    setLoading("Guessing...");
    try {
      const guessNum = parseInt(guess);
      const playerStatePda = getPlayerStatePda(gameConfigPda, wallet.publicKey);
      const playerGuessPda = getPlayerGuessPda(gameConfigPda, wallet.publicKey);

      // Fetch current attempts BEFORE sending TX (avoid stale closure)
      const currentState = await program.account.playerState.fetch(playerStatePda);
      const attemptsBefore = currentState.roundAttempts;

      const sig = await buildSignSend(program, program.methods.submitGuess(guessNum), {
        playerState: playerStatePda,
        playerGuess: playerGuessPda,
        gameConfig: gameConfigPda,
        roundSecret: getRoundSecretPda(gameConfigPda),
        authority: wallet.publicKey,
      }, erConnection!, wallet);

      // Fetch TX logs for debug
      try {
        await new Promise((r) => setTimeout(r, 1500));
        const txInfo = await erConnection!.getTransaction(sig, { maxSupportedTransactionVersion: 0 });
        if (txInfo?.meta?.logMessages) {
          const guessLog = txInfo.meta.logMessages.find((l: string) => l.includes("guess="));
          if (guessLog) log(`[debug] ${guessLog.replace("Program log: ", "")}`);
        }
        if (txInfo?.meta?.err) log(`[debug] TX error: ${JSON.stringify(txInfo.meta.err)}`);
      } catch {}

      // Poll until roundAttempts increases from the value we read BEFORE the TX
      let pState: any = null;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 200));
        const fetched = await program.account.playerState.fetch(playerStatePda);
        if (fetched.roundAttempts > attemptsBefore) {
          pState = fetched;
          break;
        }
      }
      if (!pState) pState = await program.account.playerState.fetch(playerStatePda);
      setPlayerState(pState);

      const proximityLabels = ["None", "Glacial", "Froid", "Tiede", "Chaud", "Bouillant", "Trouve!"];
      const proxLabel = pState.foundThisRound ? "Trouve!" : (proximityLabels[pState.proximity] || "?");
      const dirLabel = pState.foundThisRound ? "" :
        pState.direction?.higher !== undefined ? " +" : " -";

      setGuessHistory(prev => [...prev, { guess: guessNum, proximity: proxLabel, direction: dirLabel }]);
      log(`${guessNum} → ${proxLabel}${dirLabel}`);
      if (pState.foundThisRound) log(`FOUND in ${pState.roundAttempts} attempts!`);
      setGuess("");
    } catch (e: any) { log(`Error: ${e.message}`); }
    setLoading("");
  }, [getErProgram, wallet, gameConfigPda, guess, log]);

  // ─── END ROUND (ER) ───
  const handleEndRound = useCallback(async () => {
    const program = getErProgram();
    if (!program || !wallet.publicKey || !gameConfigPda || !gameState) return;
    setLoading("Ending round...");
    try {
      const playerCount = gameState.playerCount || 0;
      const remainingAccounts = [];
      for (let i = 0; i < playerCount; i++) {
        remainingAccounts.push({ pubkey: new PublicKey(gameState.players[i]), isSigner: false, isWritable: true });
      }

      const [programIdentity] = PublicKey.findProgramAddressSync([Buffer.from("identity")], PROGRAM_ID);

      await buildSignSend(program, program.methods.endRound(), {
        gameConfig: gameConfigPda,
        leaderboard: getLeaderboardPda(gameConfigPda),
        roundReveal: getRoundRevealPda(gameConfigPda),
        roundSecret: getRoundSecretPda(gameConfigPda),
        payer: wallet.publicKey,
        oracleQueue: VRF_ORACLE_QUEUE,
        programIdentity,
        vrfProgram: VRF_PROGRAM_ID,
        slotHashes: SLOT_HASHES,
        systemProgram: SystemProgram.programId,
      }, erConnection!, wallet, { remainingAccounts });

      log("Round ended!");
      setGuessHistory([]);
      await refreshGameState();
      await refreshPlayerState();
    } catch (e: any) { log(`Error: ${e.message}`); }
    setLoading("");
  }, [getErProgram, wallet, gameConfigPda, gameState, log, refreshGameState, refreshPlayerState]);

  // ─── DEBUG: inspect VRF queue on PER vs L1 ───
  const handleDebugVrfQueue = useCallback(async () => {
    if (!wallet.publicKey) return;
    setLoading("Inspecting VRF queue...");
    try {
      const l1 = connection;
      const er = erConnection;
      const check = async (label: string, conn: Connection, queue: PublicKey) => {
        const info = await conn.getAccountInfo(queue).catch((e: any) => ({ __err: e.message }));
        if (!info) { log(`[${label}] queue ${queue.toBase58().slice(0,8)}…: NULL (account does not exist)`); return; }
        if ((info as any).__err) { log(`[${label}] queue ${queue.toBase58().slice(0,8)}…: ERR ${(info as any).__err}`); return; }
        log(`[${label}] queue ${queue.toBase58().slice(0,8)}…: owner=${(info as any).owner.toBase58().slice(0,8)}… dataLen=${(info as any).data.length}`);
      };
      // Both possible queues on both chains
      await check("L1 ", l1, new PublicKey("Cuj97ggrhhidhbu39TijNVqE74xvKJ69gDervRUXAxGh"));
      await check("L1 ", l1, VRF_ORACLE_QUEUE);
      if (er) {
        await check("PER", er, new PublicKey("Cuj97ggrhhidhbu39TijNVqE74xvKJ69gDervRUXAxGh"));
        await check("PER", er, VRF_ORACLE_QUEUE);
      } else {
        log("[PER] no ER connection — auth TEE first");
      }

      // Fetch validator identities of both MagicBlock endpoints
      const idTee = await (er || l1).getSlotLeaders(0, 1).then((x) => x[0]?.toBase58()).catch(() => "err");
      log(`[PER] current slot leader (tee): ${idTee}`);
      try {
        const standardEr = new Connection("https://devnet-as.magicblock.app", "confirmed");
        const idStd = await standardEr.getSlotLeaders(0, 1).then((x) => x[0]?.toBase58());
        log(`[ER standard] current slot leader: ${idStd}`);
      } catch (e: any) { log(`standard ER err: ${e.message}`); }

      // delegation_metadata PDA contains the validator/rent_payer info
      const delegationMetadata = delegationMetadataPdaFromDelegatedAccount(VRF_ORACLE_QUEUE);
      log(`[L1] delegation_metadata for ${VRF_ORACLE_QUEUE.toBase58().slice(0,8)}…: ${delegationMetadata.toBase58()}`);
      const metaInfo = await l1.getAccountInfo(delegationMetadata);
      if (!metaInfo) { log(`[L1] delegation_metadata NOT FOUND`); }
      else {
        const bytes = Buffer.from(metaInfo.data);
        log(`[L1] delegation_metadata dataLen=${bytes.length}`);
        // Aligned 32-byte pubkeys only (103 bytes = 3 pubkeys + 7 bytes tail)
        for (const off of [0, 32, 64]) {
          if (bytes.length >= off + 32) {
            const pk = new PublicKey(bytes.subarray(off, off + 32)).toBase58();
            log(`  +${off} ${pk}`);
          }
        }
      }
    } catch (e: any) { log(`Debug error: ${e.message}`); }
    setLoading("");
  }, [wallet.publicKey, connection, erConnection, log]);

  // ─── END GAME (ER) ───
  const handleEndGame = useCallback(async () => {
    const program = getErProgram();
    if (!program || !wallet.publicKey || !gameConfigPda) return;
    setLoading("Distributing payouts...");
    try {
      const lb = await program.account.leaderboard.fetch(getLeaderboardPda(gameConfigPda));
      const remainingAccounts = [];
      for (let i = 0; i < lb.count; i++) {
        const pState = await program.account.playerState.fetch(new PublicKey(lb.entries[i]));
        remainingAccounts.push({ pubkey: pState.authority, isSigner: false, isWritable: true });
      }

      await buildSignSend(program, program.methods.endGame(), {
        gameConfig: gameConfigPda,
        leaderboard: getLeaderboardPda(gameConfigPda),
        vault: getVaultPda(gameConfigPda),
        authority: wallet.publicKey,
      }, erConnection!, wallet, { remainingAccounts });

      log("Payouts distributed!");
      setLeaderboard(lb);
      setPhase("finished");
    } catch (e: any) { log(`Error: ${e.message}`); }
    setLoading("");
  }, [getErProgram, wallet, gameConfigPda, log]);

  // ─── Lobby countdown ───
  useEffect(() => {
    if (!gameState?.lobbyEnd || gameState.status?.waiting === undefined) { setCountdown(0); return; }
    const tick = () => {
      const r = gameState.lobbyEnd.toNumber() - Math.floor(Date.now() / 1000);
      setCountdown(r > 0 ? r : 0);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // ─── Fetch other players' states ───
  const refreshOtherPlayers = useCallback(async () => {
    if (!gameConfigPda || !wallet.publicKey || !gameState) return;
    const program = getErProgram() || getL1Program();
    if (!program) return;
    const proximityLabels = ["None", "Glacial", "Froid", "Tiede", "Chaud", "Bouillant", "Trouve!"];
    const players: any[] = [];
    for (let i = 0; i < (gameState.playerCount || 0); i++) {
      try {
        const pda = new PublicKey(gameState.players[i]);
        const state = await program.account.playerState.fetch(pda);
        const isMe = state.authority.toBase58() === wallet.publicKey.toBase58();
        players.push({
          address: state.authority.toBase58().slice(0, 8) + "...",
          proximity: proximityLabels[state.proximity] || "?",
          direction: state.direction?.none !== undefined ? "" :
            state.direction?.higher !== undefined ? "+" : "-",
          attempts: state.roundAttempts,
          totalAttempts: state.totalAttempts,
          found: state.foundThisRound,
          alive: state.alive,
          isMe,
        });
      } catch {}
    }
    setOtherPlayers(players);
  }, [gameConfigPda, wallet.publicKey, gameState, getErProgram, getL1Program]);

  // ─── Auto-refresh every 3s ───
  useEffect(() => {
    if (phase !== "playing" && phase !== "lobby") return;
    const interval = setInterval(() => {
      refreshGameState();
      refreshPlayerState();
      if (phase === "playing") refreshOtherPlayers();
    }, 3000);
    return () => clearInterval(interval);
  }, [phase, refreshGameState, refreshPlayerState, refreshOtherPlayers]);

  const proximityColors: Record<string, string> = {
    "Glacial": "text-blue-300", "Froid": "text-cyan-400", "Tiede": "text-yellow-400",
    "Chaud": "text-orange-400", "Bouillant": "text-red-400", "Trouve!": "text-green-400",
  };

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Number Rush</h1>
        <WalletMultiButtonDynamic />
      </div>

      {loading && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-yellow-300 text-sm animate-pulse">
          {loading}
        </div>
      )}

      {/* ═══ MENU ═══ */}
      {phase === "menu" && (
        <>
          <div className="bg-gray-900 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold">Create Game</h2>
            <div className="flex gap-3 items-end">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Game ID</label>
                <div className="flex gap-1">
                  <input type="number" value={gameId} onChange={(e) => setGameId(e.target.value)}
                    className="bg-gray-800 rounded px-3 py-2 w-28 text-sm" placeholder="Auto" />
                  <button onClick={() => setGameId(Math.floor(Math.random() * 1000000).toString())}
                    className="bg-gray-700 hover:bg-gray-600 px-2 rounded text-sm">🎲</button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Bet (SOL)</label>
                <input type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)}
                  className="bg-gray-800 rounded px-3 py-2 w-28 text-sm" />
              </div>
              <button onClick={handleCreateGame} disabled={!wallet.publicKey || !!loading}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 px-5 py-2 rounded font-medium text-sm">
                Create
              </button>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold">Join Game</h2>
            <div className="flex gap-3 items-end">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Game ID</label>
                <input type="number" value={joinGameId} onChange={(e) => setJoinGameId(e.target.value)}
                  className="bg-gray-800 rounded px-3 py-2 w-40 text-sm" placeholder="Enter game ID" />
              </div>
              <button onClick={handleJoinGame} disabled={!wallet.publicKey || !joinGameId || !!loading}
                className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 px-5 py-2 rounded font-medium text-sm">
                Join
              </button>
            </div>
          </div>
        </>
      )}

      {/* ═══ LOBBY ═══ */}
      {phase === "lobby" && gameState && (
        <div className="bg-gray-900 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Lobby</h2>
            <span className={`text-2xl font-mono font-bold ${countdown > 10 ? "text-blue-400" : "text-red-400"}`}>
              {countdown > 0 ? `${countdown}s` : "Ready!"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-800 rounded p-3">
              <div className="text-gray-400 text-xs">Players</div>
              <div className="text-xl font-bold">{gameState.playerCount}/10</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-gray-400 text-xs">Bet</div>
              <div className="text-xl font-bold">{(gameState.betAmount?.toNumber() / 1e9).toFixed(4)} SOL</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-800 rounded p-3">
            <span className="text-gray-400 text-sm">Share:</span>
            <span className="font-mono text-lg font-bold">{gameState.gameId?.toString()}</span>
            <button onClick={() => { navigator.clipboard.writeText(gameState.gameId?.toString()); log("Copied!"); }}
              className="ml-auto bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-xs">Copy</button>
          </div>

          {gameState.playerCount < 2 ? (
            <p className="text-yellow-500 text-sm text-center py-2">Waiting for players to join...</p>
          ) : (
            <div className="space-y-2">
              <p className="text-green-400 text-sm text-center">{gameState.playerCount} players ready!</p>

              {/* Step 1: Delegate to PER */}
              <div className="flex gap-2">
                <button onClick={handleDelegateCreator} disabled={!!loading}
                  className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 py-2 rounded font-medium text-sm">
                  1. Delegate (Creator)
                </button>
                <button onClick={handleDelegatePlayer} disabled={!!loading}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 py-2 rounded font-medium text-sm">
                  1. Delegate (Player)
                </button>
              </div>

              {/* Step 2: Auth TEE */}
              <button onClick={handleAuthTee} disabled={!!loading || !!erConnection}
                className={`w-full py-2 rounded font-medium text-sm ${erConnection ? "bg-green-800 text-green-300" : "bg-teal-600 hover:bg-teal-500 disabled:bg-gray-700"}`}>
                {erConnection ? "2. TEE Authenticated ✓" : "2. Auth TEE"}
              </button>

              {/* Step 3: Permissions (privacy) — each TX signed alone, see permission bundle bug */}
              <div className="flex gap-2">
                <button onClick={handleCreatePlayerPermission} disabled={!!loading || !erConnection}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 py-2 rounded font-medium text-sm">
                  3a. Privacy (Guess)
                </button>
                <button onClick={handleCreateRoundSecretPermission} disabled={!!loading || !erConnection}
                  className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-gray-700 py-2 rounded font-medium text-sm">
                  3b. Privacy (Secret, creator)
                </button>
              </div>

              {/* Step 4: Start Game + VRF on PER (creator only) — must run AFTER permissions */}
              <button onClick={handleStartGame} disabled={!!loading || !erConnection || gameState.status?.playing !== undefined}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 py-2 rounded font-medium text-sm">
                {gameState.status?.playing !== undefined ? "Game Started ✓" : "4. Start Game + VRF (PER, creator)"}
              </button>

              {/* Step 5: Enter game (switch to playing phase) */}
              <button onClick={async () => {
                if (!erConnection || !gameConfigPda) return;
                const program = getErProgram();
                if (!program) return;
                try {
                  const state = await program.account.gameConfig.fetch(gameConfigPda);
                  if (state.status?.playing !== undefined) {
                    setGameState(state);
                    setPhase("playing");
                    log("Entering game!");
                    await refreshPlayerState();
                  } else {
                    log(`Not ready: status=${JSON.stringify(state.status)}`);
                  }
                } catch (e: any) { log(`Error: ${e.message}`); }
              }} disabled={!erConnection}
                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 py-2 rounded font-medium text-sm">
                5. Enter Game
              </button>

              <p className="text-gray-500 text-xs text-center">Creator: 1→2→3a→3b→4→5 | Player: 1→2→3a→5</p>

              <button onClick={handleDebugVrfQueue} disabled={!!loading}
                className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 py-1 rounded text-xs text-gray-300">
                Debug VRF queue (L1 + PER)
              </button>
              <button onClick={async () => {
                const program = getErProgram();
                if (!program || !gameConfigPda) return;
                try {
                  const state = await program.account.gameConfig.fetch(gameConfigPda);
                  setGameState(state);
                  log(`ER status: ${JSON.stringify(state.status)}`);
                  if (state.status?.playing !== undefined) {
                    setPhase("playing");
                    log("Switching to playing!");
                  } else if (state.status?.finished !== undefined) {
                    setPhase("finished");
                  }
                } catch (e: any) {
                  log(`ER fetch failed: ${e.message}`);
                }
              }} disabled={!!loading}
                className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 py-1 rounded text-xs text-gray-300">
                Refresh Status
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ PLAYING ═══ */}
      {phase === "playing" && (
        <>
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Round {gameState?.currentRound || "?"}/5</h2>
              <span className="text-sm text-gray-400">
                Attempts: {playerState?.roundAttempts || 0}/15
              </span>
            </div>

            {!playerState?.foundThisRound && (
              <div className="flex gap-2 mb-4">
                <input type="number" min="0" max="1000" value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmitGuess()}
                  placeholder="0 - 1000"
                  className="bg-gray-800 rounded px-4 py-3 flex-1 text-lg text-center font-mono" autoFocus />
                <button onClick={handleSubmitGuess} disabled={!guess || !!loading}
                  className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 px-6 py-3 rounded font-bold text-lg">
                  Go
                </button>
              </div>
            )}

            {playerState?.foundThisRound && (
              <div className="text-center py-4">
                <div className="text-green-400 text-3xl font-bold mb-1">FOUND!</div>
                <div className="text-gray-400 text-sm">in {playerState.roundAttempts} attempts</div>
              </div>
            )}

            {guessHistory.length > 0 && (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {[...guessHistory].reverse().map((g, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-800 rounded px-3 py-2 text-sm">
                    <span className="font-mono w-12 text-right">{g.guess}</span>
                    <span className={`font-medium ${proximityColors[g.proximity] || "text-gray-400"}`}>{g.proximity}</span>
                    <span className="text-gray-400">{g.direction}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Other players */}
          {otherPlayers.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-400">Players</h3>
              {otherPlayers.map((p, i) => (
                <div key={i} className={`flex items-center gap-3 rounded px-3 py-2 text-sm ${p.isMe ? "bg-gray-700" : "bg-gray-800"}`}>
                  <span className="font-mono text-xs w-20">{p.isMe ? "You" : p.address}</span>
                  <span className={`font-medium ${proximityColors[p.proximity] || "text-gray-400"}`}>
                    {p.proximity}
                  </span>
                  <span className="text-gray-400">{p.direction}</span>
                  <span className="ml-auto text-xs text-gray-500">{p.attempts}/15</span>
                  {p.found && <span className="text-green-400 text-xs">FOUND</span>}
                  {!p.alive && <span className="text-red-400 text-xs">OUT</span>}
                </div>
              ))}
            </div>
          )}

          <button onClick={handleEndRound} disabled={!!loading}
            className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 py-2 rounded text-sm text-gray-300">
            End Round (admin)
          </button>
        </>
      )}

      {/* ═══ FINISHED ═══ */}
      {phase === "finished" && (
        <div className="bg-gray-900 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-center">Game Over</h2>
          {leaderboard && leaderboard.count > 0 ? (
            <div className="space-y-2">
              {Array.from({ length: leaderboard.count }).map((_, i) => (
                <div key={i} className={`flex items-center gap-3 rounded p-3 ${i === 0 ? "bg-yellow-900/30" : "bg-gray-800"}`}>
                  <span className="text-xl w-8">{["🥇","🥈","🥉"][i] || `#${i+1}`}</span>
                  <span className="font-mono text-xs flex-1">{new PublicKey(leaderboard.entries[i]).toBase58().slice(0,12)}...</span>
                  <span className="text-sm">{leaderboard.attempts[i]} attempts</span>
                </div>
              ))}
            </div>
          ) : (
            <button onClick={handleEndGame} disabled={!!loading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 py-3 rounded font-medium">
              Distribute Payouts
            </button>
          )}
          <button onClick={() => { setPhase("menu"); setGameState(null); setPlayerState(null); setGuessHistory([]); setLeaderboard(null); }}
            className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm">New Game</button>
        </div>
      )}

      {/* Logs */}
      <details className="bg-gray-900 rounded-xl">
        <summary className="p-3 text-sm text-gray-400 cursor-pointer">Logs ({logs.length})</summary>
        <div className="px-3 pb-3 h-32 overflow-y-auto text-xs font-mono space-y-0.5">
          {logs.map((l, i) => <div key={i} className="text-gray-500">{l}</div>)}
        </div>
      </details>
    </div>
  );
};
