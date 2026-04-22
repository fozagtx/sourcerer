import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { buildSignInMessage, issueToken, verifySignature } from "@/lib/auth";

export async function POST(req: Request) {
  const { wallet, signature } = await req.json();
  if (!wallet || !signature) {
    return NextResponse.json({ error: "wallet and signature required" }, { status: 400 });
  }
  if (!isDatabaseConfigured) {
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }

  let row;
  try {
    row = await prisma.nonce.findUnique({ where: { wallet } });
  } catch {
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
  if (!row || row.expiresAt < new Date()) {
    return NextResponse.json({ error: "nonce expired" }, { status: 400 });
  }

  const message = buildSignInMessage(wallet, row.nonce);
  if (!verifySignature(wallet, message, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  try {
    await prisma.nonce.delete({ where: { wallet } });
  } catch {
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
  const token = await issueToken(wallet);
  return NextResponse.json({ token });
}
