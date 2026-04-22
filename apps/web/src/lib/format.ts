export function formatSol(lamports: bigint | number, digits = 4): string {
  const n = typeof lamports === "bigint" ? Number(lamports) / 1e9 : lamports / 1e9;
  if (n === 0) return "0";
  if (n < 0.0001) return n.toExponential(2);
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function formatNumber(n: number | bigint, digits = 2): string {
  const x = typeof n === "bigint" ? Number(n) : n;
  if (Math.abs(x) >= 1e9) return `${(x / 1e9).toFixed(digits)}B`;
  if (Math.abs(x) >= 1e6) return `${(x / 1e6).toFixed(digits)}M`;
  if (Math.abs(x) >= 1e3) return `${(x / 1e3).toFixed(digits)}K`;
  return x.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function formatUsd(sol: number, solPrice = 150): string {
  return `$${formatNumber(sol * solPrice)}`;
}

export function shortAddress(addr: string, chars = 4): string {
  if (!addr) return "";
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}

export function formatTimeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86_400)}d ago`;
}
