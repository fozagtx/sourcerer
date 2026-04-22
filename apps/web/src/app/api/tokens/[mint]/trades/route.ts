import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ mint: string }> }) {
  const { mint } = await ctx.params;
  if (!isDatabaseConfigured) return NextResponse.json([]);
  try {
    const trades = await prisma.trade.findMany({
      where: { mint },
      orderBy: { timestamp: "desc" },
      take: 50,
    });
    return NextResponse.json(
      trades.map((t) => ({
        signature: t.signature,
        trader: t.trader,
        isBuy: t.isBuy,
        solAmount: t.solAmount.toString(),
        tokenAmount: t.tokenAmount.toString(),
        timestamp: t.timestamp.toISOString(),
      })),
    );
  } catch {
    return NextResponse.json([]);
  }
}
