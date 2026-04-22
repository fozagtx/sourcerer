import { createPublicClient, http, type PublicClient } from "viem";
import { bsc, bscTestnet } from "viem/chains";
import { env } from "../env";

export function getBscClient(): PublicClient | null {
  if (!env.SOURCERER_BSC_FACTORY) return null;
  const chain = env.BSC_CHAIN_ID === 56 ? bsc : bscTestnet;
  return createPublicClient({ chain, transport: http(env.BSC_RPC_URL) });
}

export function getFactoryAddress(): `0x${string}` | null {
  return (env.SOURCERER_BSC_FACTORY as `0x${string}`) ?? null;
}
