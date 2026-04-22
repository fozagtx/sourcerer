import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(8787),
  DATABASE_URL: z.string().url(),
  SOLANA_RPC_URL: z.string().url().default("https://api.devnet.solana.com"),
  HELIUS_WEBHOOK_SECRET: z.string().optional(),
  SOURCERER_PROGRAM_ID: z.string().optional(),
  SOURCERER_KEYPAIR: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  NEWS_API_KEY: z.string().optional(),
  NEWS_COUNTRIES: z.string().default("us,gb,jp,kr,de,fr,br,in,au,ca,mx,es,it,nl,se,sg,hk,tw,za,ae"),
  BSC_RPC_URL: z.string().url().default("https://bsc-testnet-rpc.publicnode.com"),
  BSC_CHAIN_ID: z.coerce.number().default(97),
  SOURCERER_BSC_FACTORY: z.string().optional(),
  SOURCERER_BSC_PRIVATE_KEY: z.string().optional(),
  BSC_START_BLOCK: z.coerce.bigint().optional(),
});

export const env = schema.parse(process.env);
