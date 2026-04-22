import Link from "next/link";
import { Flame } from "lucide-react";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { formatTimeAgo } from "@/lib/format";

export const metadata = { title: "Hot News - Sourcerer" };
export const revalidate = 30;

async function getNews(country?: string) {
  if (!isDatabaseConfigured) return [];
  try {
    return await prisma.newsItem.findMany({
      where: {
        ...(country ? { country } : {}),
        memeScore: { gte: 0.3 },
      },
      orderBy: [{ memeScore: "desc" }, { publishedAt: "desc" }],
      take: 60,
    });
  } catch {
    return [];
  }
}

async function getCountries(): Promise<string[]> {
  if (!isDatabaseConfigured) return [];
  try {
    const rows = await prisma.newsItem.findMany({
      distinct: ["country"],
      select: { country: true },
      take: 40,
    });
    return rows.map((r) => r.country).sort();
  } catch {
    return [];
  }
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const { country: active } = await searchParams;
  const [items, countries] = await Promise.all([getNews(active), getCountries()]);

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="eyebrow">headlines with torque</p>
        <h1 className="landing-section-title !inline-flex flex-wrap items-center gap-3 text-3xl md:text-4xl">
          <Flame className="h-9 w-9 text-[#ff3b2f]" aria-hidden />
          hot news
        </h1>
        <p className="max-w-2xl text-body-md lowercase text-white/70">
          scored for memeability. tap a card, we pre-fill create. you are live before the thread dies.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <CountryPill href="/news" label="All" active={!active} />
        {countries.map((c) => (
          <CountryPill
            key={c}
            href={`/news?country=${c}`}
            label={c.toUpperCase()}
            active={active === c}
          />
        ))}
      </div>

      {items.length === 0 ? (
        <div className="comic-panel !border-dashed !border-white/30 !bg-black/25 p-10 text-center text-body-md lowercase text-white/70">
          no news items indexed yet. the cron runs every 30 minutes in the indexer.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              className="comic-panel group flex flex-col gap-2 p-3 transition-transform duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-[8px_8px_0_rgba(0,0,0,0.45)]"
            >
              {n.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={n.imageUrl} alt="" className="h-32 w-full rounded-intermediate object-cover" />
              ) : (
                <div className="h-32 rounded-intermediate bg-gradient-to-br from-[#8b2e26]/60 to-[#135a52]/50" />
              )}
              <div className="flex items-center justify-between text-[11px] text-white/60">
                <span className="rounded-inner bg-black/25 px-1.5 py-0.5 font-mono uppercase text-white/90">
                  {n.country}
                </span>
                <span>{formatTimeAgo(n.publishedAt)}</span>
                <span className="flex items-center gap-1 font-mono text-[#ff3b2f]">
                  <Flame className="h-3 w-3" aria-hidden />
                  {(n.memeScore * 100).toFixed(0)}
                </span>
              </div>
              <h3 className="line-clamp-3 text-body-md font-medium lowercase text-white">{n.title}</h3>
              {n.suggestedName ? (
                <p className="mt-auto text-caption lowercase text-[#ffb49a]">
                  meme it → ${n.suggestedSymbol} {n.suggestedName}
                </p>
              ) : (
                <p className="mt-auto text-caption lowercase text-white/55 group-hover:text-[#ffb49a]">
                  meme this story →
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CountryPill({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "landing-pill px-3 py-1.5 text-caption"
          : "rounded-pill border-2 border-white/35 bg-black/20 px-3 py-1.5 text-caption font-medium lowercase text-white/75 shadow-[3px_3px_0_rgba(0,0,0,0.35)] transition-all hover:border-[#ff3b2f]/60 hover:text-white"
      }
    >
      {label}
    </Link>
  );
}
