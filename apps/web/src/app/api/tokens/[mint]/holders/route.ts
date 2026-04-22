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
      const holders = await prisma.holder.findMany({
        where: { mint },
        orderBy: { balance: "desc" },
        take: 25,
      });
      const total = holders.reduce((sum, h) => sum + h.balance, 0n);
      return okJson(
        holders.map((h) => ({
          owner: h.owner,
          balance: h.balance.toString(),
          pct: total > 0n ? Number((h.balance * 10_000n) / total) / 100 : 0,
        })),
        requestId,
      );
    } catch {
      return okJson([], requestId);
    }
  });
}
