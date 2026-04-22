# @sourcerer/db

Prisma schema + client for the Sourcerer Postgres (Supabase).

## Setup

1. Provision a Postgres DB (Supabase project recommended).
2. Set `DATABASE_URL` in `.env` at the repo root (e.g. `postgresql://postgres:...@db.xxxx.supabase.co:5432/postgres`).
3. Push the schema:

   ```bash
   pnpm --filter @sourcerer/db push
   ```

## Models

- `Token` – token metadata and cached curve state
- `Trade` – every buy/sell from the indexer
- `Holder` – per-mint token balances
- `Comment` – user comments on a token page
- `Candle` – OHLCV aggregates (1m/5m/1h)
- `NewsItem` – scored news headlines
- `AiConcept` – cached AI token-concept generations
- `Nonce` – wallet sign-in nonces
