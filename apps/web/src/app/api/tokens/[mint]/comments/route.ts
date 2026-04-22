import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { walletFromAuthHeader } from "@/lib/auth";

export async function GET(_req: Request, ctx: { params: Promise<{ mint: string }> }) {
  const { mint } = await ctx.params;
  if (!isDatabaseConfigured) return NextResponse.json([]);
  try {
    const comments = await prisma.comment.findMany({
      where: { mint },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(comments);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ mint: string }> }) {
  const { mint } = await ctx.params;
  const wallet = await walletFromAuthHeader(req.headers.get("authorization"));
  if (!wallet) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { body } = await req.json();
  const text = String(body ?? "").trim();
  if (!text || text.length > 1000) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (!isDatabaseConfigured) {
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }

  try {
    const token = await prisma.token.findUnique({ where: { mint } });
    if (!token) return NextResponse.json({ error: "token not found" }, { status: 404 });

    const comment = await prisma.comment.create({
      data: { mint, author: wallet, body: text },
    });
    return NextResponse.json(comment);
  } catch {
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}
