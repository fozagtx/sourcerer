import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { walletFromAuthHeader } from "@/lib/auth";
import { parseJsonBody } from "@/lib/api/body";
import { commentPostSchema, mintParamSchema } from "@/lib/api/contracts";
import { ApiRouteError, apiErrors } from "@/lib/api/errors";
import { apiGetWithParams, apiPostWithParams, okJson } from "@/lib/api/handler";

export async function GET(_req: Request, ctx: { params: Promise<{ mint: string }> }) {
  return apiGetWithParams(_req, ctx, async ({ requestId, params }) => {
    const p = mintParamSchema.safeParse(params);
    if (!p.success) throw apiErrors.validation(p.error.flatten());
    const { mint } = p.data;

    if (!isDatabaseConfigured) return okJson([], requestId);
    try {
      const comments = await prisma.comment.findMany({
        where: { mint },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return okJson(comments, requestId);
    } catch {
      return okJson([], requestId);
    }
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ mint: string }> }) {
  return apiPostWithParams(req, ctx, async ({ req, requestId, params }) => {
    const p = mintParamSchema.safeParse(params);
    if (!p.success) throw apiErrors.validation(p.error.flatten());
    const { mint } = p.data;

    const wallet = await walletFromAuthHeader(req.headers.get("authorization"));
    if (!wallet) throw apiErrors.unauthorized();

    const { body: text } = await parseJsonBody(req, commentPostSchema);

    if (!isDatabaseConfigured) {
      throw apiErrors.serviceUnavailable(
        "Database is not configured.",
        "DATABASE_UNAVAILABLE",
        "Set DATABASE_URL for comments.",
      );
    }

    try {
      const token = await prisma.token.findUnique({ where: { mint } });
      if (!token) throw apiErrors.notFound("Token", "mint");

      const comment = await prisma.comment.create({
        data: { mint, author: wallet, body: text },
      });
      return okJson(comment, requestId);
    } catch (e) {
      if (e instanceof ApiRouteError) throw e;
      throw apiErrors.serviceUnavailable(
        "Could not create comment.",
        "DATABASE_ERROR",
        "Check database connectivity.",
      );
    }
  });
}
