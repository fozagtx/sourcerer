import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { buildSignInMessage } from "@/lib/auth";

export async function POST(req: Request) {
  const { wallet } = await req.json();
  if (!wallet || typeof wallet !== "string") {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }
  if (!isDatabaseConfigured) {
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
  const nonce = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60_000);
  try {
    await prisma.nonce.upsert({
      where: { wallet },
      create: { wallet, nonce, expiresAt },
      update: { nonce, expiresAt },
    });
  } catch {
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
  return NextResponse.json({ message: buildSignInMessage(wallet, nonce), nonce });
}
