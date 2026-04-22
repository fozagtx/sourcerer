import { prisma } from "@sourcerer/db";
import { sourcererFactoryAbi } from "@sourcerer/sdk-evm";
import { parseEventLogs } from "viem";
import { getBscClient, getFactoryAddress } from "./client";
import { handleBscGraduated, handleBscTokenCreated, handleBscTraded } from "./events";
import { env } from "../env";

const BATCH = 3_000n;

export async function pollBscOnce(): Promise<void> {
  const client = getBscClient();
  const factory = getFactoryAddress();
  if (!client || !factory) {
    return;
  }

  const cursor = await prisma.chainCursor.upsert({
    where: { chain: "bsc" },
    create: { chain: "bsc", lastBlock: env.BSC_START_BLOCK ?? 0n },
    update: {},
  });

  const head = await client.getBlockNumber();
  let from = cursor.lastBlock + 1n;
  if (from > head) return;
  const to = from + BATCH > head ? head : from + BATCH;

  const logs = await client.getLogs({
    address: factory,
    fromBlock: from,
    toBlock: to,
  });

  const parsed = parseEventLogs({ abi: sourcererFactoryAbi, logs });
  for (const ev of parsed) {
    const block = await client.getBlock({ blockNumber: ev.blockNumber });
    const ts = Number(block.timestamp);
    try {
      if (ev.eventName === "TokenCreated") {
        const a = ev.args as any;
        await handleBscTokenCreated({
          token: a.token,
          creator: a.creator,
          name: a.name,
          symbol: a.symbol,
          uri: a.uri,
          timestamp: ts,
          txHash: ev.transactionHash,
          blockNumber: ev.blockNumber,
        });
      } else if (ev.eventName === "Traded") {
        const a = ev.args as any;
        await handleBscTraded({
          token: a.token,
          trader: a.trader,
          isBuy: a.isBuy,
          bnbAmount: a.bnbAmount,
          tokenAmount: a.tokenAmount,
          feeAmount: a.feeAmount,
          virtualBnb: a.virtualBnb,
          virtualTokens: a.virtualTokens,
          realBnb: a.realBnb,
          realTokens: a.realTokens,
          timestamp: ts,
          txHash: ev.transactionHash,
          blockNumber: ev.blockNumber,
          logIndex: Number(ev.logIndex),
        });
      } else if (ev.eventName === "Graduated") {
        const a = ev.args as any;
        await handleBscGraduated({
          token: a.token,
          pair: a.pair,
          bnbAmount: a.bnbAmount,
          tokenAmount: a.tokenAmount,
          timestamp: ts,
          txHash: ev.transactionHash,
        });
      }
    } catch (err) {
      console.warn(`[bsc] failed to index ${ev.eventName} @${ev.transactionHash}`, err);
    }
  }

  await prisma.chainCursor.update({
    where: { chain: "bsc" },
    data: { lastBlock: to },
  });

  console.log(`[bsc] indexed ${from}..${to} (${parsed.length} events)`);
}

if (require.main === module) {
  (async () => {
    for (;;) {
      try {
        await pollBscOnce();
      } catch (err) {
        console.error("[bsc] poll failed", err);
      }
      await new Promise((r) => setTimeout(r, 5_000));
    }
  })();
}
