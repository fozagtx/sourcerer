import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export async function GET(req: Request, ctx: { params: Promise<{ mint: string }> }) {
  const { mint } = await ctx.params;
  const url = new URL(req.url);
  const interval = url.searchParams.get("interval") ?? "1m";
  if (!isDatabaseConfigured) return NextResponse.json([]);
  try {
    const candles = await prisma.candle.findMany({
      where: { mint, interval },
      orderBy: { openTime: "asc" },
      take: 500,
    });
    return NextResponse.json(
      candles.map((c) => ({
        time: Math.floor(c.openTime.getTime() / 1000),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volumeSol,
      })),
    );
  } catch {
    return NextResponse.json([]);
  }
}
