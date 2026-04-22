import { z } from "zod";

const server = z.object({
  /** Postgres for Prisma. Env: `DATABASE_URL`. */
  DATABASE_URL: z.string().url().optional(),
  /**
   * OpenAI GPT chat for concepts when `OPENROUTER_API_KEY` is unset. Images use Decart only (`DECART_API_KEY`).
   * Env: `OPENAI_API_KEY`.
   */
  OPENAI_API_KEY: z.string().optional(),
  /**
   * OpenRouter (https://openrouter.ai) — token concept LLM when set; takes priority over `OPENAI_API_KEY`.
   * Env names: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, optional `OPENROUTER_HTTP_REFERER`, `OPENROUTER_APP_NAME`.
   */
  OPENROUTER_API_KEY: z.string().optional(),
  /** OpenRouter model id, e.g. `openai/gpt-4o-mini`, `anthropic/claude-3.5-haiku`. Env: `OPENROUTER_MODEL`. */
  OPENROUTER_MODEL: z.string().default("openai/gpt-4o-mini"),
  /** Optional `HTTP-Referer` for OpenRouter. Env: `OPENROUTER_HTTP_REFERER`. */
  OPENROUTER_HTTP_REFERER: z.string().url().optional(),
  /** Optional app label for OpenRouter. Env: `OPENROUTER_APP_NAME`. */
  OPENROUTER_APP_NAME: z.string().optional(),
  /**
   * Decart Lucy text-to-image (https://platform.decart.ai) for logos/posters.
   * Set the `DECART_API_KEY` environment variable (API key from Decart).
   */
  DECART_API_KEY: z.string().optional(),
  /** Env: `SUPABASE_URL` */
  SUPABASE_URL: z.string().url().optional(),
  /** Env: `SUPABASE_SERVICE_ROLE_KEY` */
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  /** Env: `WEB3_STORAGE_TOKEN` */
  WEB3_STORAGE_TOKEN: z.string().optional(),
  /** Env: `AUTH_SECRET` */
  AUTH_SECRET: z.string().default("dev-only-change-me"),
  /** Env: `SOURCERER_PROGRAM_ID` */
  SOURCERER_PROGRAM_ID: z.string().optional(),
  /** Env: `SOURCERER_BSC_FACTORY` */
  SOURCERER_BSC_FACTORY: z.string().optional(),
  /** Exa search API key for meme coin news. Env: `EXA_API_KEY`. */
  EXA_API_KEY: z.string().optional(),
});

const client = z.object({
  /** Env: `NEXT_PUBLIC_SOLANA_RPC` */
  NEXT_PUBLIC_SOLANA_RPC: z
    .string()
    .url()
    .default("https://api.devnet.solana.com"),
  /** Env: `NEXT_PUBLIC_SOLANA_CLUSTER` */
  NEXT_PUBLIC_SOLANA_CLUSTER: z
    .enum(["devnet", "mainnet-beta"])
    .default("devnet"),
  /** Env: `NEXT_PUBLIC_SOURCERER_PROGRAM_ID` */
  NEXT_PUBLIC_SOURCERER_PROGRAM_ID: z.string().optional(),
  /** Env: `NEXT_PUBLIC_BSC_CHAIN_ID` */
  NEXT_PUBLIC_BSC_CHAIN_ID: z.coerce.number().default(97),
  /** Env: `NEXT_PUBLIC_BSC_RPC` */
  NEXT_PUBLIC_BSC_RPC: z
    .string()
    .url()
    .default("https://bsc-testnet-rpc.publicnode.com"),
  /** Env: `NEXT_PUBLIC_SOURCERER_BSC_FACTORY` */
  NEXT_PUBLIC_SOURCERER_BSC_FACTORY: z.string().optional(),
  /** Env: `NEXT_PUBLIC_WALLETCONNECT_ID` */
  NEXT_PUBLIC_WALLETCONNECT_ID: z.string().default(""),
});

export const serverEnv = server.parse(process.env);
export const clientEnv = client.parse({
  NEXT_PUBLIC_SOLANA_RPC: process.env.NEXT_PUBLIC_SOLANA_RPC,
  NEXT_PUBLIC_SOLANA_CLUSTER: process.env.NEXT_PUBLIC_SOLANA_CLUSTER,
  NEXT_PUBLIC_SOURCERER_PROGRAM_ID:
    process.env.NEXT_PUBLIC_SOURCERER_PROGRAM_ID,
  NEXT_PUBLIC_BSC_CHAIN_ID: process.env.NEXT_PUBLIC_BSC_CHAIN_ID,
  NEXT_PUBLIC_BSC_RPC: process.env.NEXT_PUBLIC_BSC_RPC,
  NEXT_PUBLIC_SOURCERER_BSC_FACTORY:
    process.env.NEXT_PUBLIC_SOURCERER_BSC_FACTORY,
  NEXT_PUBLIC_WALLETCONNECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_ID,
});
