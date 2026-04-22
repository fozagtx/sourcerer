import Link from "next/link";
import type { Token } from "@sourcerer/db";
import { formatNumber, formatTimeAgo, shortAddress } from "@/lib/format";

export function TokenCard({ token }: { token: Token }) {
  const chain = (token.chain as "solana" | "bsc") ?? "solana";
  const threshold = chain === "solana" ? 85e9 : 85 * 1e18;
  const bondingProgress = Math.min(100, (Number(token.realSol) / threshold) * 100);
  const nativeSymbol = chain === "solana" ? "SOL" : "BNB";
  const chainLabel = chain === "solana" ? "SOL" : "BNB";
  const chainClass =
    chain === "solana"
      ? "border-white/25 bg-white/10 text-white"
      : "border-amber-300/50 bg-amber-500/15 text-amber-100";

  return (
    <Link
      href={`/token/${token.mint}`}
      className="comic-panel group flex flex-col gap-3 p-4 transition-transform duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-[8px_8px_0_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-intermediate bg-canvas-alt">
          {token.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={token.imageUrl} alt={token.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-2xl text-[#ff3b2f]">
              {token.symbol[0]}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-medium lowercase text-white group-hover:text-[#ffb49a]">{token.name}</h3>
            <span className="rounded-inner bg-black/25 px-1.5 py-0.5 font-mono text-caption text-white/75">
              ${token.symbol}
            </span>
            <span
              className={`rounded-pill border px-2 py-0.5 font-mono text-micro uppercase tracking-wider ${chainClass}`}
            >
              {chainLabel}
            </span>
          </div>
          <p className="line-clamp-2 text-body-md lowercase text-white/70">
            {token.description ?? "no description"}
          </p>
          <p className="mt-1 text-caption lowercase text-white/55">
            by {shortAddress(token.creator)} · {formatTimeAgo(token.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-caption lowercase">
        <div>
          <div className="text-white/55">market cap</div>
          <div className="font-medium text-white">
            {formatNumber(token.marketCapSol)} {nativeSymbol}
          </div>
        </div>
        <div className="text-right">
          <div className="text-white/55">holders</div>
          <div className="font-medium text-white">{token.holderCount}</div>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-caption text-white/55">
          <span>bonding curve</span>
          <span className="font-mono text-[#a9ffdb]">{bondingProgress.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-pill border border-[#2b1810] bg-black/25">
          <div
            className="h-full rounded-pill bg-gradient-to-r from-brand-500 to-flu-green"
            style={{ width: `${bondingProgress}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
