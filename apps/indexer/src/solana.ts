import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { SourcererClient, SOURCERER_PROGRAM_ID } from "@sourcerer/sdk";
import bs58 from "bs58";
import { env } from "./env";

export const connection = new Connection(env.SOLANA_RPC_URL, "confirmed");

export const programId = env.SOURCERER_PROGRAM_ID
  ? new PublicKey(env.SOURCERER_PROGRAM_ID)
  : SOURCERER_PROGRAM_ID;

export function loadKeypair(): Keypair | null {
  if (!env.SOURCERER_KEYPAIR) return null;
  const raw = env.SOURCERER_KEYPAIR.trim();
  if (raw.startsWith("[")) {
    return Keypair.fromSecretKey(new Uint8Array(JSON.parse(raw)));
  }
  return Keypair.fromSecretKey(bs58.decode(raw));
}

export function getClient(): SourcererClient | null {
  const kp = loadKeypair();
  if (!kp) return null;
  const provider = new AnchorProvider(connection, new Wallet(kp), { commitment: "confirmed" });
  return new SourcererClient(provider, programId);
}
