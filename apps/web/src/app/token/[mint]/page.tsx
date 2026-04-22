import { notFound } from "next/navigation";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { PriceChart } from "@/components/priceChart";
import { TradePanel } from "@/components/tradePanel";
import { TradeFeed } from "@/components/tradeFeed";
import { CommentSection } from "@/components/commentSection";
import { HoldersList } from "@/components/holdersList";
import { formatNumber, shortAddress } from "@/lib/format";

export const revalidate = 5;

async function getToken(mint: string) {
  if (!isDatabaseConfigured) return null;
  try {
    return await prisma.token.findUnique({ where: { mint } });
  } catch {
    return null;
  }
}

export default async function TokenPage({ params }: { params: Promise<{ mint: string }> }) {
  const { mint } = await params;
  const token = await getToken(mint);
  if (!token) return notFound();

  const chain = (token.chain as "solana" | "bsc") ?? "solana";
  const threshold = chain === "solana" ? 85e9 : 85 * 1e18;
  const bondingProgress = Math.min(100, (Number(token.realSol) / threshold) * 100);
  const nativeSymbol = chain === "solana" ? "SOL" : "BNB";
  const graduationVenue = chain === "solana" ? "Raydium" : "PancakeSwap";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="comic-panel flex items-center gap-4 p-4">
          <div className="h-16 w-16 overflow-hidden rounded-intermediate border-2 border-[#2b1810] bg-black/20">
            {token.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={token.imageUrl} alt={token.name} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-display text-xl lowercase tracking-tight text-white md:text-2xl">
                {token.name}
              </h1>
              <span className="rounded-inner bg-black/25 px-1.5 py-0.5 font-mono text-caption text-white/80">
                ${token.symbol}
              </span>
              {token.graduated && (
                <span className="rounded-pill bg-[#10E68D]/25 px-2 py-0.5 text-caption font-medium lowercase text-[#a9ffdb]">
                  graduated
                </span>
              )}
            </div>
            <p className="truncate text-caption text-white/55">
              {shortAddress(token.mint, 6)} · created by {shortAddress(token.creator)}
            </p>
            {token.description && (
              <p className="mt-1 line-clamp-2 text-body-md text-white/70">{token.description}</p>
            )}
          </div>
          <div className="hidden text-right sm:block">
            <div className="flex items-center justify-end gap-1 text-caption text-white/55">
              <span className="rounded-pill border border-white/20 px-2 py-0.5 font-mono font-medium lowercase tracking-wide text-white">
                {chain === "solana" ? "solana" : "bnb chain"}
              </span>
              <span>market cap</span>
            </div>
            <div className="font-display text-xl lowercase text-white">
              {formatNumber(token.marketCapSol)} {nativeSymbol}
            </div>
          </div>
        </div>

        <PriceChart mint={token.mint} />
        <TradeFeed mint={token.mint} />
        <CommentSection mint={token.mint} />
      </div>

      <div className="space-y-4">
        <TradePanel mint={token.mint} symbol={token.symbol} graduated={token.graduated} chain={chain} />
        <div className="comic-panel p-4">
          <div className="mb-2 flex items-center justify-between text-body-md lowercase">
            <span className="text-white/65">bonding curve</span>
            <span className="font-mono font-medium text-[#a9ffdb]">{bondingProgress.toFixed(2)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-pill border border-[#2b1810] bg-black/25">
            <div
              className="h-full rounded-pill bg-gradient-to-r from-[#e6392a] to-[#10E68D]"
              style={{ width: `${bondingProgress}%` }}
            />
          </div>
          <p className="mt-2 text-caption lowercase text-white/60">
            at 85 {nativeSymbol} the curve graduates into a {graduationVenue} pool. lp gets torched. no soft launch
            excuses.
          </p>
        </div>
        <HoldersList mint={token.mint} />
      </div>
    </div>
  );
}
