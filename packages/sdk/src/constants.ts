import { PublicKey } from "@solana/web3.js";

export const SOURCERER_PROGRAM_ID = new PublicKey(
  "Sourcerer1111111111111111111111111111111111",
);

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

export const TOKEN_DECIMALS = 6;
export const TOTAL_SUPPLY = 1_000_000_000n * 10n ** 6n;
export const CURVE_TOKEN_SUPPLY = 793_100_000n * 10n ** 6n;
export const VIRTUAL_SOL_RESERVES = 30n * 1_000_000_000n;
export const VIRTUAL_TOKEN_RESERVES = 1_073_000_000n * 10n ** 6n;

export const SEEDS = {
  config: Buffer.from("config"),
  bondingCurve: Buffer.from("bonding-curve"),
  curveVault: Buffer.from("curve-vault"),
};
