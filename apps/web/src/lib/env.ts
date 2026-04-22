import { z } from "zod";

const server = z.object({
  DATABASE_URL: z.string().url().optional(),
  OPENAI_API_KEY: z.string().optional(),
  /** OpenRouter (https://openrouter.ai) — used for token concept LLM when set; takes priority over direct OpenAI. */
  OPENROUTER_API_KEY: z.string().optional(),
  /** Model id on OpenRouter, e.g. openai/gpt-4o-mini, anthropic/claude-3.5-haiku */
  OPENROUTER_MODEL: z.string().default("openai/gpt-4o-mini"),
  /** Optional site URL for OpenRouter rankings (HTTP-Referer). */
  OPENROUTER_HTTP_REFERER: z.string().url().optional(),
  OPENROUTER_APP_NAME: z.string().optional(),
  /** Decart Lucy text-to-image (https://platform.decart.ai) — used for logos/posters when set. */
  DECART_API_KEY: z.string().optional(),
  REPLICATE_API_TOKEN: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  WEB3_STORAGE_TOKEN: z.string().optional(),
  AUTH_SECRET: z.string().default("dev-only-change-me"),
  SOURCERER_PROGRAM_ID: z.string().optional(),
  SOURCERER_BSC_FACTORY: z.string().optional(),
  /**
   * When true, missing/failing LLM falls back to placeholder concept copy (not for production).
   * Real deployments should leave this unset and configure OPENROUTER_API_KEY or OPENAI_API_KEY (+ image keys).
   */
  SOURCERER_AI_DEMO_MODE: z
    .preprocess((v) => v === "1" || v === "true" || v === true, z.boolean())
    .default(false),
});

const client = z.object({
  NEXT_PUBLIC_SOLANA_RPC: z.string().url().default("https://api.devnet.solana.com"),
  NEXT_PUBLIC_SOLANA_CLUSTER: z.enum(["devnet", "mainnet-beta"]).default("devnet"),
  NEXT_PUBLIC_SOURCERER_PROGRAM_ID: z.string().optional(),
  NEXT_PUBLIC_BSC_CHAIN_ID: z.coerce.number().default(97),
  NEXT_PUBLIC_BSC_RPC: z.string().url().default("https://bsc-testnet-rpc.publicnode.com"),
  NEXT_PUBLIC_SOURCERER_BSC_FACTORY: z.string().optional(),
  NEXT_PUBLIC_WALLETCONNECT_ID: z.string().default(""),
});

export const serverEnv = server.parse(process.env);
export const clientEnv = client.parse({
  NEXT_PUBLIC_SOLANA_RPC: process.env.NEXT_PUBLIC_SOLANA_RPC,
  NEXT_PUBLIC_SOLANA_CLUSTER: process.env.NEXT_PUBLIC_SOLANA_CLUSTER,
  NEXT_PUBLIC_SOURCERER_PROGRAM_ID: process.env.NEXT_PUBLIC_SOURCERER_PROGRAM_ID,
  NEXT_PUBLIC_BSC_CHAIN_ID: process.env.NEXT_PUBLIC_BSC_CHAIN_ID,
  NEXT_PUBLIC_BSC_RPC: process.env.NEXT_PUBLIC_BSC_RPC,
  NEXT_PUBLIC_SOURCERER_BSC_FACTORY: process.env.NEXT_PUBLIC_SOURCERER_BSC_FACTORY,
  NEXT_PUBLIC_WALLETCONNECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_ID,
});
