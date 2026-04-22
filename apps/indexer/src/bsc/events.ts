import { prisma } from "@sourcerer/db";

const ONE_ETH = 10n ** 18n;

function bnbToNumber(wei: bigint): number {
  return Number(wei) / Number(ONE_ETH);
}

function tokensToNumber(wei: bigint): number {
  return Number(wei) / Number(ONE_ETH);
}

function priceFromReserves(vb: bigint, vt: bigint): number {
  if (vt === 0n) return 0;
  return bnbToNumber(vb) / tokensToNumber(vt);
}

export interface BscTokenCreated {
  token: string;
  creator: string;
  name: string;
  symbol: string;
  uri: string;
  timestamp: number;
  txHash: string;
  blockNumber: bigint;
}

export interface BscTraded {
  token: string;
  trader: string;
  isBuy: boolean;
  bnbAmount: bigint;
  tokenAmount: bigint;
  feeAmount: bigint;
  virtualBnb: bigint;
  virtualTokens: bigint;
  realBnb: bigint;
  realTokens: bigint;
  timestamp: number;
  txHash: string;
  blockNumber: bigint;
  logIndex: number;
}

export interface BscGraduated {
  token: string;
  pair: string;
  bnbAmount: bigint;
  tokenAmount: bigint;
  timestamp: number;
  txHash: string;
}

export async function handleBscTokenCreated(ev: BscTokenCreated): Promise<void> {
  let posters: string[] = [];
  let description: string | null = null;
  let imageUrl: string | null = null;
  try {
    if (ev.uri.startsWith("http") || ev.uri.startsWith("ipfs://")) {
      const url = ev.uri.startsWith("ipfs://")
        ? `https://ipfs.io/ipfs/${ev.uri.replace("ipfs://", "")}`
        : ev.uri;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const meta: any = await res.json();
        description = meta.description ?? null;
        imageUrl = meta.image ?? null;
        posters = Array.isArray(meta.posters) ? meta.posters : [];
      }
    }
  } catch {
    // best-effort
  }

  await prisma.token.upsert({
    where: { mint: ev.token },
    create: {
      mint: ev.token,
      chain: "bsc",
      creator: ev.creator,
      name: ev.name,
      symbol: ev.symbol,
      metadataUri: ev.uri,
      description,
      imageUrl,
      posters,
      virtualSol: 30n * 10n ** 18n,
      virtualTokens: 1_073_000_000n * 10n ** 18n,
      realSol: 0n,
      realTokens: 793_100_000n * 10n ** 18n,
      createdAt: new Date(ev.timestamp * 1000),
    },
    update: {
      chain: "bsc",
      name: ev.name,
      symbol: ev.symbol,
      metadataUri: ev.uri,
      description: description ?? undefined,
      imageUrl: imageUrl ?? undefined,
      posters: posters.length ? posters : undefined,
    },
  });
}

export async function handleBscTraded(ev: BscTraded): Promise<void> {
  const price = priceFromReserves(ev.virtualBnb, ev.virtualTokens);
  const ts = new Date(ev.timestamp * 1000);
  const sigKey = `${ev.txHash}:${ev.logIndex}`;

  await prisma.$transaction([
    prisma.trade.upsert({
      where: { signature: sigKey },
      create: {
        signature: sigKey,
        mint: ev.token,
        trader: ev.trader,
        isBuy: ev.isBuy,
        solAmount: ev.bnbAmount,
        tokenAmount: ev.tokenAmount,
        feeAmount: ev.feeAmount,
        priceSol: price,
        virtualSol: ev.virtualBnb,
        virtualTokens: ev.virtualTokens,
        timestamp: ts,
        slot: ev.blockNumber,
      },
      update: {},
    }),
    prisma.token.update({
      where: { mint: ev.token },
      data: {
        virtualSol: ev.virtualBnb,
        virtualTokens: ev.virtualTokens,
        realSol: ev.realBnb,
        realTokens: ev.realTokens,
        priceSol: price,
        marketCapSol: price * 1_000_000_000,
      },
    }),
  ]);

  await updateCandles(ev.token, ts, price, bnbToNumber(ev.bnbAmount));
  await updateHolder(ev);
}

async function updateHolder(ev: BscTraded): Promise<void> {
  const delta = ev.isBuy ? ev.tokenAmount : -ev.tokenAmount;
  const existing = await prisma.holder.findUnique({
    where: { mint_owner: { mint: ev.token, owner: ev.trader } },
  });
  const next = (existing?.balance ?? 0n) + delta;
  if (next <= 0n) {
    if (existing) {
      await prisma.holder.delete({ where: { id: existing.id } });
      await prisma.token.update({
        where: { mint: ev.token },
        data: { holderCount: { decrement: 1 } },
      });
    }
    return;
  }
  await prisma.holder.upsert({
    where: { mint_owner: { mint: ev.token, owner: ev.trader } },
    create: { mint: ev.token, owner: ev.trader, balance: next },
    update: { balance: next },
  });
  if (!existing) {
    await prisma.token.update({
      where: { mint: ev.token },
      data: { holderCount: { increment: 1 } },
    });
  }
}

const INTERVALS: Array<{ name: string; ms: number }> = [
  { name: "1m", ms: 60_000 },
  { name: "5m", ms: 5 * 60_000 },
  { name: "1h", ms: 60 * 60_000 },
];

async function updateCandles(mint: string, ts: Date, price: number, volume: number): Promise<void> {
  for (const iv of INTERVALS) {
    const openTime = new Date(Math.floor(ts.getTime() / iv.ms) * iv.ms);
    const existing = await prisma.candle.findUnique({
      where: { mint_interval_openTime: { mint, interval: iv.name, openTime } },
    });
    if (existing) {
      await prisma.candle.update({
        where: { id: existing.id },
        data: {
          high: Math.max(existing.high, price),
          low: Math.min(existing.low, price),
          close: price,
          volumeSol: existing.volumeSol + volume,
        },
      });
    } else {
      await prisma.candle.create({
        data: { mint, interval: iv.name, openTime, open: price, high: price, low: price, close: price, volumeSol: volume },
      });
    }
  }
}

export async function handleBscGraduated(ev: BscGraduated): Promise<void> {
  await prisma.token.update({
    where: { mint: ev.token },
    data: { graduated: true, graduatedAt: new Date(ev.timestamp * 1000), pancakePair: ev.pair },
  });
}
