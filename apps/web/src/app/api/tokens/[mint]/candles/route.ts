import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { candleQuerySchema, mintParamSchema } from "@/lib/api/contracts";
import { apiErrors } from "@/lib/api/errors";
import { apiGetWithParams, okJson } from "@/lib/api/handler";

export async function GET(req: Request, ctx: { params: Promise<{ mint: string }> }) {
  return apiGetWithParams(req, ctx, async ({ req, requestId, params }) => {
    const p = mintParamSchema.safeParse(params);
    if (!p.success) throw apiErrors.validation(p.error.flatten());
    const { mint } = p.data;

    const url = new URL(req.url);
    const q = candleQuerySchema.safeParse({
      interval: url.searchParams.get("interval") ?? undefined,
    });
    if (!q.success) throw apiErrors.validation(q.error.flatten());
    const { interval } = q.data;

    if (!isDatabaseConfigured) return okJson([], requestId);
    try {
      const candles = await prisma.candle.findMany({
        where: { mint, interval },
        orderBy: { openTime: "asc" },
        take: 500,
      });
      return okJson(
        candles.map((c) => ({
          time: Math.floor(c.openTime.getTime() / 1000),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volumeSol,
        })),
        requestId,
      );
    } catch {
      return okJson([], requestId);
    }
  });
}
