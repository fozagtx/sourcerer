import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { buildSignInMessage } from "@/lib/auth";
import { parseJsonBody } from "@/lib/api/body";
import { authNoncePostSchema } from "@/lib/api/contracts";
import { apiErrors } from "@/lib/api/errors";
import { apiPost, okJson } from "@/lib/api/handler";

export async function POST(req: Request) {
  return apiPost(req, async ({ req, requestId }) => {
    const { wallet } = await parseJsonBody(req, authNoncePostSchema);

    if (!isDatabaseConfigured) {
      throw apiErrors.serviceUnavailable(
        "Database is not configured.",
        "DATABASE_UNAVAILABLE",
        "Set DATABASE_URL and run migrations, or run with a configured Postgres.",
      );
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
      throw apiErrors.serviceUnavailable(
        "Could not persist nonce.",
        "DATABASE_ERROR",
        "Check database connectivity and try again.",
      );
    }

    return okJson({ message: buildSignInMessage(wallet, nonce), nonce }, requestId);
  });
}
