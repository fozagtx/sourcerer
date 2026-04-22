import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { mintParamSchema } from "@/lib/api/contracts";
import { apiErrors } from "@/lib/api/errors";
import { apiGetWithParams, okJson } from "@/lib/api/handler";

export async function GET(_req: Request, ctx: { params: Promise<{ mint: string }> }) {
  return apiGetWithParams(_req, ctx, async ({ requestId, params }) => {
    const p = mintParamSchema.safeParse(params);
    if (!p.success) throw apiErrors.validation(p.error.flatten());
    const { mint } = p.data;

    if (!isDatabaseConfigured) return okJson([], requestId);
    try {
      const trades = await prisma.trade.findMany({
        where: { mint },
        orderBy: { timestamp: "desc" },
        take: 50,
      });
      return okJson(
        trades.map((t) => ({
          signature: t.signature,
          trader: t.trader,
          isBuy: t.isBuy,
          solAmount: t.solAmount.toString(),
          tokenAmount: t.tokenAmount.toString(),
          timestamp: t.timestamp.toISOString(),
        })),
        requestId,
      );
    } catch {
      return okJson([], requestId);
    }
  });
}
