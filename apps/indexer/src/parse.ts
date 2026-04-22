import { BorshCoder, EventParser, Idl } from "@coral-xyz/anchor";
import { sourcererIdl as idl } from "@sourcerer/sdk";
import { PublicKey } from "@solana/web3.js";
import { programId } from "./solana";
import type {
  GraduatedEvent,
  TokenCreatedEvent,
  TradedEvent,
} from "./events";

const coder = new BorshCoder(idl as Idl);
const eventParser = new EventParser(programId, coder);

interface ParsedTx {
  signature: string;
  slot: bigint;
  logs: string[];
  blockTime?: number;
}

export interface ParsedEvents {
  created: TokenCreatedEvent[];
  traded: TradedEvent[];
  graduated: GraduatedEvent[];
}

export function parseTransaction(tx: ParsedTx): ParsedEvents {
  const out: ParsedEvents = { created: [], traded: [], graduated: [] };
  const ts = tx.blockTime ?? Math.floor(Date.now() / 1000);

  for (const ev of eventParser.parseLogs(tx.logs)) {
    const data = ev.data as any;
    switch (ev.name) {
      case "TokenCreated":
        out.created.push({
          mint: (data.mint as PublicKey).toBase58(),
          creator: (data.creator as PublicKey).toBase58(),
          name: data.name as string,
          symbol: data.symbol as string,
          uri: data.uri as string,
          timestamp: Number(data.timestamp),
        });
        break;
      case "Traded":
        out.traded.push({
          mint: (data.mint as PublicKey).toBase58(),
          trader: (data.trader as PublicKey).toBase58(),
          isBuy: data.isBuy as boolean,
          solAmount: BigInt(data.solAmount.toString()),
          tokenAmount: BigInt(data.tokenAmount.toString()),
          feeAmount: BigInt(data.feeAmount.toString()),
          virtualSolReserves: BigInt(data.virtualSolReserves.toString()),
          virtualTokenReserves: BigInt(data.virtualTokenReserves.toString()),
          realSolReserves: BigInt(data.realSolReserves.toString()),
          realTokenReserves: BigInt(data.realTokenReserves.toString()),
          timestamp: Number(data.timestamp),
          signature: tx.signature,
          slot: tx.slot,
        });
        break;
      case "Graduated":
        out.graduated.push({
          mint: (data.mint as PublicKey).toBase58(),
          solAmount: BigInt(data.solAmount.toString()),
          tokenAmount: BigInt(data.tokenAmount.toString()),
          timestamp: Number(data.timestamp),
          signature: tx.signature,
        });
        break;
    }
  }
  return out;
}
