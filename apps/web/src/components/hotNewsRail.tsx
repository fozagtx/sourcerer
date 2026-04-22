import Link from "next/link";
import { Flame, ExternalLink } from "lucide-react";
import { searchMemeCoinNews } from "@/lib/exa";

export async function HotNewsRail() {
  const items = await searchMemeCoinNews(undefined, 8);
  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-caption font-medium uppercase tracking-wider text-[#ff3b2f]">
            meme radar
          </p>
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
          <div
            key={n.id}
            className="comic-panel group flex min-w-[260px] max-w-[260px] flex-col gap-2 p-3 transition-transform duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-[8px_8px_0_rgba(0,0,0,0.45)]"
          >
            {n.image ? (
              <img
                src={n.image}
                alt=""
                className="h-28 w-full rounded-intermediate object-cover"
              />
            ) : (
              <div className="h-28 rounded-intermediate bg-gradient-to-br from-[#8b2e26]/60 to-[#135a52]/50" />
            )}
            <h3 className="line-clamp-2 text-body-md font-medium lowercase text-white">
              {n.title}
            </h3>
            <div className="mt-auto flex items-center gap-2 pt-1">
              <Link
                href={{ pathname: "/create", query: { prompt: n.title } }}
                className="text-caption text-[#ffb49a] transition-colors hover:text-[#ff3b2f]"
              >
                meme this →
              </Link>
              <a
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-caption text-white/40 transition-colors hover:text-white"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
