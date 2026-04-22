import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ mint: string }> }) {
  const { mint } = await ctx.params;
  if (!isDatabaseConfigured) return NextResponse.json([]);
  try {
    const holders = await prisma.holder.findMany({
      where: { mint },
      orderBy: { balance: "desc" },
      take: 25,
    });
    const total = holders.reduce((sum, h) => sum + h.balance, 0n);
    return NextResponse.json(
      holders.map((h) => ({
        owner: h.owner,
        balance: h.balance.toString(),
        pct: total > 0n ? Number((h.balance * 10_000n) / total) / 100 : 0,
      })),
    );
  } catch {
    return NextResponse.json([]);
  }
}
