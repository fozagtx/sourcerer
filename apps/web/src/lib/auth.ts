import { SignJWT, jwtVerify } from "jose";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { serverEnv } from "./env";

const secret = new TextEncoder().encode(serverEnv.AUTH_SECRET);

export async function issueToken(wallet: string): Promise<string> {
  return new SignJWT({ sub: wallet })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

export function verifySignature(wallet: string, message: string, signatureBase58: string): boolean {
  try {
    const sig = bs58.decode(signatureBase58);
    const msg = new TextEncoder().encode(message);
    const pk = bs58.decode(wallet);
    return nacl.sign.detached.verify(msg, sig, pk);
  } catch {
    return false;
  }
}

export function buildSignInMessage(wallet: string, nonce: string): string {
  return `Sign in to Sourcerer\nwallet: ${wallet}\nnonce: ${nonce}`;
}

export async function walletFromAuthHeader(header: string | null): Promise<string | null> {
  if (!header?.startsWith("Bearer ")) return null;
  return verifyToken(header.slice("Bearer ".length));
}
