import Fastify from "fastify";
import { env } from "./env";
import { parseTransaction } from "./parse";
import { handleGraduated, handleTokenCreated, handleTraded } from "./events";
import cron from "node-cron";
import { runNewsCron } from "./cron/news";
import { runGraduator } from "./cron/graduator";
import { pollBscOnce } from "./bsc/poll";

const app = Fastify({ logger: true });

app.get("/healthz", async () => ({ ok: true }));

/**
 * Helius Enhanced Webhooks delivers an array of transactions; we extract logs + signature
 * and run them through the Anchor event parser. Configure the webhook to filter by program id.
 */
app.post("/webhook/helius", async (req, reply) => {
  const secret = req.headers["authorization"];
  if (env.HELIUS_WEBHOOK_SECRET && secret !== env.HELIUS_WEBHOOK_SECRET) {
    return reply.code(401).send({ error: "unauthorized" });
  }

  const body = req.body as any[];
  if (!Array.isArray(body)) return reply.code(400).send({ error: "bad payload" });

  for (const tx of body) {
    const logs: string[] = tx.meta?.logMessages ?? tx.logs ?? [];
    if (!logs.length) continue;
    const signature: string = tx.signature ?? tx.transaction?.signatures?.[0] ?? "";
    const slot = BigInt(tx.slot ?? 0);
    const blockTime: number | undefined = tx.blockTime ?? tx.timestamp;

    const parsed = parseTransaction({ signature, slot, logs, blockTime });
    for (const ev of parsed.created) await handleTokenCreated(ev).catch((e) => app.log.error(e));
    for (const ev of parsed.traded) await handleTraded(ev).catch((e) => app.log.error(e));
    for (const ev of parsed.graduated) await handleGraduated(ev).catch((e) => app.log.error(e));
  }
  return { ok: true };
});

cron.schedule("*/30 * * * *", () => {
  runNewsCron().catch((e) => app.log.error({ err: e }, "news cron failed"));
});

cron.schedule("*/2 * * * *", () => {
  runGraduator().catch((e) => app.log.error({ err: e }, "graduator failed"));
});

cron.schedule("*/6 * * * * *", () => {
  pollBscOnce().catch((e) => app.log.error({ err: e }, "bsc poll failed"));
});

app
  .listen({ port: env.PORT, host: "0.0.0.0" })
  .then((addr) => app.log.info(`indexer listening on ${addr}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
