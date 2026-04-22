import Link from "next/link";
import { Flame, ExternalLink } from "lucide-react";
import { searchMemeCoinNews, type ExaResult } from "@/lib/exa";
import { formatTimeAgo } from "@/lib/format";

export const metadata = { title: "Hot News - Sourcerer" };
export const revalidate = 300;

async function getNews(query?: string) {
  return searchMemeCoinNews(query, 24);
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const items = await getNews(q);

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="eyebrow">headlines with torque</p>
        <h1 className="landing-section-title !inline-flex flex-wrap items-center gap-3 text-3xl md:text-4xl">
          <Flame className="h-9 w-9 text-[#ff3b2f]" aria-hidden />
          hot news
        </h1>
        <p className="max-w-2xl text-body-md lowercase text-white/70">
          live meme coin headlines powered by exa. tap a card, we pre-fill
          create. you are live before the thread dies.
        </p>
      </header>

      <form action="/news" method="get" className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="search meme coin news…"
          className="flex-1 rounded-pill border-2 border-white/25 bg-black/25 px-4 py-2 text-body-md lowercase text-white placeholder:text-white/40 focus:border-[#ff3b2f]/60 focus:outline-none"
        />
        <button type="submit" className="landing-pill px-4 py-2 text-caption">
          search
        </button>
      </form>

      {items.length === 0 ? (
        <div className="comic-panel !border-dashed !border-white/30 !bg-black/25 p-10 text-center text-body-md lowercase text-white/70">
          {serverEnvHasExa()
            ? "no results found. try a different search."
            : "set EXA_API_KEY in .env.local to enable live news."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((n) => (
            <NewsCard key={n.id} item={n} />
          ))}
        </div>
      )}
    </div>
  );
}

function NewsCard({ item }: { item: ExaResult }) {
  return (
    <div className="comic-panel group flex flex-col gap-2 p-3 transition-transform duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-[8px_8px_0_rgba(0,0,0,0.45)]">
      {item.image ? (
        <img
          src={item.image}
          alt=""
          className="h-32 w-full rounded-intermediate object-cover"
        />
      ) : (
        <div className="h-32 rounded-intermediate bg-gradient-to-br from-[#8b2e26]/60 to-[#135a52]/50" />
      )}
      <div className="flex items-center justify-between text-[11px] text-white/60">
        {item.publishedDate ? (
          <span>{formatTimeAgo(item.publishedDate)}</span>
        ) : (
          <span />
        )}
        {item.author ? (
          <span className="truncate text-white/50">{item.author}</span>
        ) : null}
      </div>
      <h3 className="line-clamp-3 text-body-md font-medium lowercase text-white">
        {item.title}
      </h3>
      {item.text ? (
        <p className="line-clamp-2 text-caption lowercase text-white/55">
          {item.text}
        </p>
      ) : null}
      <div className="mt-auto flex items-center gap-2 pt-1">
        <Link
          href={{
            pathname: "/create",
            query: { prompt: item.title },
          }}
          className="text-caption lowercase text-[#ffb49a] transition-colors hover:text-[#ff3b2f]"
        >
          meme this →
        </Link>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-caption text-white/40 transition-colors hover:text-white"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

function serverEnvHasExa() {
  try {
    const { serverEnv } = require("@/lib/env");
    return !!serverEnv.EXA_API_KEY?.trim();
  } catch {
    return false;
  }
}
