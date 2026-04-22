import { prisma } from "@sourcerer/db";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const TOKENS_PER_UI = 10n ** 6n;

function lamportsToSol(l: bigint): number {
  return Number(l) / LAMPORTS_PER_SOL;
}

function tokensToUi(t: bigint): number {
  return Number(t) / Number(TOKENS_PER_UI);
}

function priceFromReserves(vs: bigint, vt: bigint): number {
  if (vt === 0n) return 0;
  return lamportsToSol(vs) / tokensToUi(vt);
}

export interface TokenCreatedEvent {
  mint: string;
  creator: string;
  name: string;
  symbol: string;
  uri: string;
  timestamp: number;
}

export interface TradedEvent {
  mint: string;
  trader: string;
  isBuy: boolean;
  solAmount: bigint;
  tokenAmount: bigint;
  feeAmount: bigint;
  virtualSolReserves: bigint;
  virtualTokenReserves: bigint;
  realSolReserves: bigint;
  realTokenReserves: bigint;
  timestamp: number;
  signature: string;
  slot: bigint;
}

export interface GraduatedEvent {
  mint: string;
  solAmount: bigint;
  tokenAmount: bigint;
  timestamp: number;
  signature: string;
}

export async function handleTokenCreated(ev: TokenCreatedEvent): Promise<void> {
  let posters: string[] = [];
  let description: string | null = null;
  let imageUrl: string | null = null;
  try {
    if (ev.uri.startsWith("http")) {
      const res = await fetch(ev.uri, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const meta: any = await res.json();
        description = meta.description ?? null;
        imageUrl = meta.image ?? null;
        posters = Array.isArray(meta.posters) ? meta.posters : [];
      }
    }
  } catch {
    // metadata fetch best-effort
  }

  await prisma.token.upsert({
    where: { mint: ev.mint },
    create: {
      mint: ev.mint,
      creator: ev.creator,
      name: ev.name,
      symbol: ev.symbol,
      metadataUri: ev.uri,
      description,
      imageUrl,
      posters,
      createdAt: new Date(ev.timestamp * 1000),
    },
    update: {
      name: ev.name,
      symbol: ev.symbol,
      metadataUri: ev.uri,
      description: description ?? undefined,
      imageUrl: imageUrl ?? undefined,
      posters: posters.length ? posters : undefined,
    },
  });
}

export async function handleTraded(ev: TradedEvent): Promise<void> {
  const price = priceFromReserves(ev.virtualSolReserves, ev.virtualTokenReserves);
  const ts = new Date(ev.timestamp * 1000);

  await prisma.$transaction([
    prisma.trade.upsert({
      where: { signature: ev.signature },
      create: {
        signature: ev.signature,
        mint: ev.mint,
        trader: ev.trader,
        isBuy: ev.isBuy,
        solAmount: ev.solAmount,
        tokenAmount: ev.tokenAmount,
        feeAmount: ev.feeAmount,
        priceSol: price,
        virtualSol: ev.virtualSolReserves,
        virtualTokens: ev.virtualTokenReserves,
        timestamp: ts,
        slot: ev.slot,
      },
      update: {},
    }),
    prisma.token.update({
      where: { mint: ev.mint },
      data: {
        virtualSol: ev.virtualSolReserves,
        virtualTokens: ev.virtualTokenReserves,
        realSol: ev.realSolReserves,
        realTokens: ev.realTokenReserves,
        priceSol: price,
        marketCapSol: price * 1_000_000_000,
      },
    }),
  ]);

  await updateCandles(ev.mint, ts, price, lamportsToSol(ev.solAmount));
  await updateHolder(ev);
}

async function updateHolder(ev: TradedEvent): Promise<void> {
  const delta = ev.isBuy ? ev.tokenAmount : -ev.tokenAmount;
  const existing = await prisma.holder.findUnique({
    where: { mint_owner: { mint: ev.mint, owner: ev.trader } },
  });
  const next = (existing?.balance ?? 0n) + delta;
  if (next <= 0n) {
    if (existing) {
      await prisma.holder.delete({ where: { id: existing.id } });
      await prisma.token.update({
        where: { mint: ev.mint },
        data: { holderCount: { decrement: 1 } },
      });
    }
    return;
  }
  await prisma.holder.upsert({
    where: { mint_owner: { mint: ev.mint, owner: ev.trader } },
    create: { mint: ev.mint, owner: ev.trader, balance: next },
    update: { balance: next },
  });
  if (!existing) {
    await prisma.token.update({
      where: { mint: ev.mint },
      data: { holderCount: { increment: 1 } },
    });
  }
}

const INTERVALS: Array<{ name: string; ms: number }> = [
  { name: "1m", ms: 60_000 },
  { name: "5m", ms: 5 * 60_000 },
  { name: "1h", ms: 60 * 60_000 },
];

async function updateCandles(
  mint: string,
  ts: Date,
  price: number,
  volumeSol: number,
): Promise<void> {
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
          volumeSol: existing.volumeSol + volumeSol,
        },
      });
    } else {
      await prisma.candle.create({
        data: {
          mint,
          interval: iv.name,
          openTime,
          open: price,
          high: price,
          low: price,
          close: price,
          volumeSol,
        },
      });
    }
  }
}

export async function handleGraduated(ev: GraduatedEvent): Promise<void> {
  await prisma.token.update({
    where: { mint: ev.mint },
    data: { graduated: true, graduatedAt: new Date(ev.timestamp * 1000) },
  });
}
