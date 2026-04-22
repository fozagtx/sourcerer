import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { buildSignInMessage, issueToken, verifySignature } from "@/lib/auth";
import { parseJsonBody } from "@/lib/api/body";
import { authVerifyPostSchema } from "@/lib/api/contracts";
import { apiErrors } from "@/lib/api/errors";
import { apiPost, okJson } from "@/lib/api/handler";

export async function POST(req: Request) {
  return apiPost(req, async ({ req, requestId }) => {
    const { wallet, signature } = await parseJsonBody(req, authVerifyPostSchema);

    if (!isDatabaseConfigured) {
      throw apiErrors.serviceUnavailable(
        "Database is not configured.",
        "DATABASE_UNAVAILABLE",
        "Set DATABASE_URL and run migrations.",
      );
    }

    let row;
    try {
      row = await prisma.nonce.findUnique({ where: { wallet } });
    } catch {
      throw apiErrors.serviceUnavailable(
        "Could not read nonce.",
        "DATABASE_ERROR",
        "Check database connectivity.",
      );
    }

    if (!row || row.expiresAt < new Date()) {
      throw apiErrors.nonceExpired();
    }

    const message = buildSignInMessage(wallet, row.nonce);
    if (!verifySignature(wallet, message, signature)) {
      throw apiErrors.unauthorized("Invalid wallet signature.", "signature");
    }

    try {
      await prisma.nonce.delete({ where: { wallet } });
    } catch {
      throw apiErrors.serviceUnavailable(
        "Could not complete sign-in.",
        "DATABASE_ERROR",
        "Check database connectivity.",
      );
    }

    const token = await issueToken(wallet);
    return okJson({ token }, requestId);
  });
}
