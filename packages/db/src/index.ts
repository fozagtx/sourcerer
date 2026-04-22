import { PrismaClient } from "@prisma/client";

declare global {
  var __sourcererPrisma: PrismaClient | undefined;
}

const rawDatabaseUrl = process.env.DATABASE_URL?.trim();
/** Set in `apps/web/next.config.mjs` so only the Next app honors skip (indexer/scripts still use DB). */
const isNextWeb = process.env.SOURCERER_RUNTIME === "web";
const databaseExplicitlyDisabled =
  process.env.SOURCERER_SKIP_DATABASE === "1" && isNextWeb;

/**
 * When false, Next.js should skip Prisma reads/writes (local UI without Postgres).
 * Set `SOURCERER_SKIP_DATABASE=1` in web env. Ignored for indexer / other Node workers.
 */
export const isDatabaseConfigured = Boolean(rawDatabaseUrl) && !databaseExplicitlyDisabled;

/** Non-routable URL so PrismaClient can construct without touching a real local Postgres. */
const fallbackEngineUrl =
  "postgresql://127.0.0.1:1/_sourcerer_dev_no_db?connect_timeout=1&schema=public";

const databaseUrl =
  isDatabaseConfigured && rawDatabaseUrl ? rawDatabaseUrl : fallbackEngineUrl;

// Prisma validates `env("DATABASE_URL")` against `process.env` — keep it aligned with the datasource URL.
process.env.DATABASE_URL = databaseUrl;

export const prisma: PrismaClient =
  global.__sourcererPrisma ??
  new PrismaClient({
    log:
      isDatabaseConfigured && process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : [],
    datasources: {
      db: { url: databaseUrl },
    },
  });

if (process.env.NODE_ENV !== "production") {
  global.__sourcererPrisma = prisma;
}

export * from "@prisma/client";
