# @sourcerer/indexer

Node worker that:

1. Receives Helius Enhanced Webhook POSTs at `/webhook/helius`, parses Anchor events, persists Solana trades, candles, holders to Postgres.
2. Listens to BSC bonding-curve contract events via viem and persists EVM trades.
3. Runs the news cron every 30m: fetches top headlines per country from NewsAPI, scores memeability with GPT-4o-mini, stores in `news_items`.
4. Runs the graduator cron every 2m: scans for curves that hit the graduation threshold, calls `graduate`, and seeds a Raydium / PancakeSwap pool.

## Run

```bash
pnpm --filter @sourcerer/indexer dev
```

## Required env

```env
DATABASE_URL=postgresql://...

# Solana
SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=...
HELIUS_WEBHOOK_SECRET=supersecret
SOURCERER_PROGRAM_ID=Sourcerer...
SOURCERER_KEYPAIR=[...]             # base58 or JSON array; only needed for graduator

# BSC
BSC_RPC_URL=https://bsc-testnet-rpc.publicnode.com
SOURCERER_BSC_FACTORY=0x...         # Sourcerer factory contract address
SOURCERER_BSC_PRIVATE_KEY=0x...     # hex private key; only needed for graduator

# AI / news
OPENAI_API_KEY=sk-...
NEWS_API_KEY=...
NEWS_COUNTRIES=us,gb,jp,kr,de,fr,br,in,au,ca,mx,es,it,nl,se,sg,hk,tw,za,ae
```

## Helius setup

1. Create an Enhanced Webhook in the Helius dashboard.
2. Set the account filter to the Sourcerer Solana program id.
3. Point URL to `https://<your-host>/webhook/helius`.
4. Add `Authorization: <HELIUS_WEBHOOK_SECRET>` header.
