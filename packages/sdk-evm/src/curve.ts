export const TOTAL_SUPPLY = 1_000_000_000n * 10n ** 18n;
export const CURVE_TOKEN_SUPPLY = 793_100_000n * 10n ** 18n;
export const VIRTUAL_BNB_RESERVES = 30n * 10n ** 18n;
export const VIRTUAL_TOKEN_RESERVES = 1_073_000_000n * 10n ** 18n;
export const GRADUATION_THRESHOLD_BNB = 85n * 10n ** 18n;

export function tokensOutForBnbIn(
  virtualBnb: bigint,
  virtualTokens: bigint,
  bnbIn: bigint,
): bigint {
  if (bnbIn <= 0n) return 0n;
  const k = virtualBnb * virtualTokens;
  const newVb = virtualBnb + bnbIn;
  const newVt = k / newVb;
  return virtualTokens - newVt;
}

export function bnbOutForTokensIn(
  virtualBnb: bigint,
  virtualTokens: bigint,
  tokensIn: bigint,
): bigint {
  if (tokensIn <= 0n) return 0n;
  const k = virtualBnb * virtualTokens;
  const newVt = virtualTokens + tokensIn;
  const newVb = k / newVt;
  return virtualBnb - newVb;
}

export function applyFeeBps(amount: bigint, feeBps: number): { net: bigint; fee: bigint } {
  const fee = (amount * BigInt(feeBps)) / 10_000n;
  return { net: amount - fee, fee };
}

export function priceBnbPerToken(virtualBnb: bigint, virtualTokens: bigint): number {
  if (virtualTokens === 0n) return 0;
  return Number(virtualBnb) / Number(virtualTokens);
}
