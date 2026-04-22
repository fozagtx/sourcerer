# Sourcerer

**AI-native memecoin launcher on Solana and BNB Chain.**

Type an idea → GPT-4o drafts a full concept (name, ticker, description, logo, posters) → one click deploys an SPL Token-2022 (Solana) or ERC-20 (BNB Chain) and seeds a bonding-curve market. At 85 SOL / 85 BNB the curve auto-graduates to Raydium / PancakeSwap and LP is burned.

## Monorepo layout

```
sourcerer/
├─ apps/
│  ├─ web/                Next.js 14 app (home, /create, /token/[mint], /news)
│  └─ indexer/            Fastify + crons (Helius webhooks, BSC poller, news, graduator)
├─ packages/
│  ├─ sdk/                TypeScript client for the Solana Anchor program
│  ├─ sdk-evm/            viem client for the BNB Chain factory
│  └─ db/                 Prisma schema shared by web + indexer
├─ programs/
│  └─ sourcerer/          Anchor program: create_token / buy / sell / graduate
└─ contracts/
   └─ bsc/                Foundry project: SourcererFactory + SourcererToken
```

## One-command dev

```bash
pnpm install
pnpm -w db:generate
pnpm -w dev
```

`pnpm -w dev` runs the Next.js app, the indexer, and a Postgres container in parallel.

## Required env

Copy `.env.example` into `.env.local` at the repo root. Key vars:

```env
# Database
DATABASE_URL=postgresql://sourcerer:sourcerer@localhost:5432/sourcerer

# AI (optional; falls back to deterministic mock when missing)
OPENAI_API_KEY=sk-...
REPLICATE_API_TOKEN=r8_...

# Solana
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_SOURCERER_PROGRAM_ID=Sourcerer1111111111111111111111111111111111
SOURCERER_KEYPAIR=[...]                 # only needed for graduator cron

# BNB Chain
NEXT_PUBLIC_BSC_CHAIN_ID=97
NEXT_PUBLIC_BSC_RPC=https://bsc-testnet-rpc.publicnode.com
NEXT_PUBLIC_SOURCERER_BSC_FACTORY=0x...
NEXT_PUBLIC_WALLETCONNECT_ID=...
SOURCERER_BSC_PRIVATE_KEY=0x...         # only needed for graduator cron

# News + storage (optional)
NEWS_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
WEB3_STORAGE_TOKEN=...
AUTH_SECRET=change-me
```

## Deploy the programs

### Solana (devnet)

```bash
cd programs/sourcerer
anchor build
anchor deploy --provider.cluster devnet
anchor test --skip-local-validator
```

### BNB Chain testnet

```bash
cd contracts/bsc
forge install
forge test
DEPLOYER_PRIVATE_KEY=0x... forge script script/Deploy.s.sol --rpc-url bsc_testnet --broadcast --verify
```

Paste the deployed factory address into `NEXT_PUBLIC_SOURCERER_BSC_FACTORY` and `SOURCERER_BSC_FACTORY`.

## End-to-end smoke test

1. `pnpm --filter @sourcerer/db prisma migrate dev`
2. Boot the indexer: `pnpm --filter @sourcerer/indexer dev`
3. Boot the web app: `pnpm --filter @sourcerer/web dev`
4. Open `http://localhost:3000`, flip the chain switch in the header.
5. **Solana path:** connect Phantom (devnet), go to `/create`, enter a keyword, click **AI Generate**, edit if desired, click **Deploy on Solana**.
6. **BSC path:** flip switch to BNB, connect MetaMask (BSC testnet), run the same flow, click **Deploy on BNB Chain**.
7. Buy ~0.1 native units on the token page, then sell half. Verify the trade feed, holder list, and chart update.
8. (Optional) Run the graduator manually: `pnpm --filter @sourcerer/indexer cron:graduate`.

## Demo script (60 seconds)

1. *"An AI memecoin launcher that works on Solana **and** BNB Chain."*
2. Show `/news`: "GPT-4o scores news headlines for memeability across 20 countries every 30 minutes."
3. Click a card → auto-fills `/create` with name, ticker, prompt.
4. Click **AI Generate** → logo + 3 posters + concept appear.
5. Flip chain switch to BNB, deploy, buy 0.1 BNB, show price chart ticking live.
6. Flip switch back to Solana and repeat. "One product, two liquidity networks, zero configuration for the user."

## Testing

```bash
pnpm --filter @sourcerer/web test
pnpm --filter @sourcerer/indexer test
cd programs/sourcerer && anchor test
cd contracts/bsc && forge test
```
