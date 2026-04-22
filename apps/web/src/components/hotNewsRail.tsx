import Link from "next/link";
import { Flame } from "lucide-react";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

async function getNews() {
  if (!isDatabaseConfigured) return [];
  try {
    return await prisma.newsItem.findMany({
      where: { used: false, memeScore: { gte: 0.5 } },
      orderBy: [{ memeScore: "desc" }, { publishedAt: "desc" }],
      take: 8,
    });
  } catch {
    return [];
  }
}

export async function HotNewsRail() {
  const items = await getNews();
  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-caption font-medium uppercase tracking-wider text-[#ff3b2f]">meme radar</p>
          <h2 className="flex items-center gap-2 font-display text-2xl lowercase tracking-tight text-white md:text-3xl">
            <Flame className="h-7 w-7 text-[#ff3b2f]" aria-hidden />
            hot right now
          </h2>
        </div>
        <Link
          href="/news"
          className="text-caption font-medium text-white/75 transition-colors hover:text-[#ff3b2f]"
        >
          browse all →
        </Link>
      </div>
      <div className="rail flex gap-3 overflow-x-auto pb-2">
        {items.map((n) => (
          <Link
            key={n.id}
            href={{
              pathname: "/create",
              query: {
                name: n.suggestedName ?? "",
                symbol: n.suggestedSymbol ?? "",
                prompt: n.suggestedPrompt ?? n.title,
                newsId: n.id,
              },
            }}
            className="comic-panel flex min-w-[260px] max-w-[260px] flex-col gap-2 p-3 transition-transform duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-[8px_8px_0_rgba(0,0,0,0.45)]"
          >
            {n.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={n.imageUrl} alt="" className="h-28 w-full rounded-intermediate object-cover" />
            ) : (
              <div className="h-28 rounded-intermediate bg-gradient-to-br from-[#8b2e26]/60 to-[#135a52]/50" />
            )}
            <div className="flex items-center gap-2 text-caption text-white/65">
              <span className="rounded-inner bg-black/25 px-1.5 py-0.5 font-mono uppercase text-white/90">
                {n.country}
              </span>
              <span className="flex items-center gap-1 font-mono text-[#ff3b2f]">
                <Flame className="h-3 w-3" aria-hidden />
                {(n.memeScore * 100).toFixed(0)}
              </span>
            </div>
            <h3 className="line-clamp-2 text-body-md font-medium lowercase text-white">{n.title}</h3>
            {n.suggestedName ? (
              <p className="text-caption text-[#ffb49a]">
                → ${n.suggestedSymbol} {n.suggestedName}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
