/**
 * Virtual constant-product bonding curve math, mirrored from the on-chain program.
 * All inputs/outputs are in base units (lamports for SOL, 10^6 for tokens).
 */

export function tokensOutForSolIn(
  virtualSol: bigint,
  virtualTokens: bigint,
  solIn: bigint,
): bigint {
  if (solIn <= 0n) return 0n;
  const k = virtualSol * virtualTokens;
  const newVs = virtualSol + solIn;
  const newVt = k / newVs;
  return virtualTokens - newVt;
}

export function solOutForTokensIn(
  virtualSol: bigint,
  virtualTokens: bigint,
  tokensIn: bigint,
): bigint {
  if (tokensIn <= 0n) return 0n;
  const k = virtualSol * virtualTokens;
  const newVt = virtualTokens + tokensIn;
  const newVs = k / newVt;
  return virtualSol - newVs;
}

export function applyFeeBps(amount: bigint, feeBps: number): { net: bigint; fee: bigint } {
  const fee = (amount * BigInt(feeBps)) / 10_000n;
  return { net: amount - fee, fee };
}

export function priceInSolPerToken(virtualSol: bigint, virtualTokens: bigint): number {
  if (virtualTokens === 0n) return 0;
  return Number(virtualSol) / Number(virtualTokens);
}

export function marketCapLamports(
  virtualSol: bigint,
  virtualTokens: bigint,
  totalSupply: bigint,
): bigint {
  if (virtualTokens === 0n) return 0n;
  return (virtualSol * totalSupply) / virtualTokens;
}
