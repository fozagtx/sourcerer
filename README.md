# Sourcerer

**AI-native memecoin launcher on Solana and BNB Chain.**

Type an idea → GPT-4o drafts a full concept (name, ticker, description, logo, posters) → one click deploys an SPL Token-2022 (Solana) or ERC-20 (BNB Chain) and seeds a bonding-curve market. At 85 SOL / 85 BNB the curve auto-graduates to Raydium / PancakeSwap and LP is burned.

## Architecture

```mermaid
graph TB
    subgraph Frontend
        WEB["apps/web<br/>Next.js 15"]
    end

    subgraph Smart Contracts
        SOL["programs/sourcerer<br/>Anchor (Solana)<br/>create_token / buy / sell / graduate"]
        BSC["contracts/bsc<br/>Foundry (Solidity)<br/>SourcererFactory + SourcererToken"]
    end

    subgraph SDKs
        SDK_SOL["packages/sdk<br/>Anchor TS Client"]
        SDK_BSC["packages/sdk-evm<br/>viem Client"]
    end

    subgraph Indexer
        IDX["apps/indexer<br/>Fastify + Crons"]
        NEWS["Exa Search API<br/>memecoin news"]
        GRAD["Graduator Cron<br/>auto-graduate + LP burn"]
    end

    subgraph Storage
        DB[("packages/db<br/>Prisma / Postgres")]
    end

    WEB -->|"create / trade"| SDK_SOL
    WEB -->|"create / trade"| SDK_BSC
    SDK_SOL -->|"TX"| SOL
    SDK_BSC -->|"TX"| BSC

    IDX -->|"Helius webhook"| SOL
    IDX -->|"Block poller"| BSC
    IDX -->|"fetch headlines"| NEWS
    IDX -->|"write"| DB
    GRAD -->|"graduate + seed Raydium/PancakeSwap"| SOL
    GRAD -->|"graduate"| BSC

    WEB -->|"read tokens, trades"| DB
```

```mermaid
sequenceDiagram
    participant User
    participant Web as Next.js Frontend
    participant AI as AI (GPT-4o / Decart)
    participant Chain as Solana / BSC

    User->>Web: type idea or pick news headline
    Web->>AI: generate concept (name, ticker, logo, lore)
    AI-->>Web: JSON concept + images
    User->>Web: review & click Deploy
    Web->>Chain: create token + seed bonding curve
    Chain-->>Web: token address

    Note over User,Chain: Trading phase
    User->>Web: buy / sell on bonding curve
    Web->>Chain: trade TX (buy / sell)

    Note over Chain: curve reaches 85 SOL/BNB
    Note over Chain: auto-graduate → Raydium / PancakeSwap
    Note over Chain: LP burned
```

```mermaid
flowchart LR
    subgraph News Flow
        EXA["Exa Search API"] -->|"live headlines"| NEWS_PAGE["/news page"]
        NEWS_PAGE -->|"meme this →"| CREATE["/create"]
    end

    subgraph Token Lifecycle
        CREATE -->|"deploy"| CURVE["Bonding Curve<br/>buy / sell"]
        CURVE -->|"≥ 85 native"| GRADUATE["Graduate"]
        GRADUATE --> AMM["Raydium / PancakeSwap"]
        GRADUATE -->|"burn"| BURN["LP Burned 🔥"]
    end
```

## Monorepo layout

```
sourcerer/
├─ apps/
│  ├─ web/                Next.js 15 app (home, /create, /token/[mint], /news)
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

# AI (optional — requires keys below for real concepts / images)
# Images: Decart only — DECART_API_KEY
DECART_API_KEY=
# OPENAI_API_KEY: GPT concepts when OpenRouter is not set (not used for images)
OPENAI_API_KEY=sk-...

# News (optional — Exa search for live meme coin headlines)
EXA_API_KEY=

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

# Storage + auth (optional)
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

1. _"An AI memecoin launcher that works on Solana **and** BNB Chain."_
2. Show `/news`: "Live meme coin headlines from Exa search — pick any story, meme it in seconds."
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
