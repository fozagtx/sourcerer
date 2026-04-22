import { prisma } from "@sourcerer/db";
import OpenAI from "openai";
import { env } from "../env";

interface NewsApiArticle {
  source: { name: string };
  url: string;
  title: string;
  description: string | null;
  urlToImage: string | null;
  publishedAt: string;
}

interface NewsApiResponse {
  status: string;
  articles: NewsApiArticle[];
}

async function fetchTopHeadlines(country: string): Promise<NewsApiArticle[]> {
  if (!env.NEWS_API_KEY) return [];
  const url = new URL("https://newsapi.org/v2/top-headlines");
  url.searchParams.set("country", country);
  url.searchParams.set("pageSize", "15");
  const res = await fetch(url.toString(), {
    headers: { "X-Api-Key": env.NEWS_API_KEY },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as NewsApiResponse;
  return data.articles ?? [];
}

interface MemeScore {
  memeScore: number;
  suggestedName: string;
  suggestedSymbol: string;
  suggestedPrompt: string;
}

async function scoreArticle(
  openai: OpenAI,
  article: NewsApiArticle,
): Promise<MemeScore | null> {
  const sys = `You rate news headlines for memecoin potential. Return JSON with keys:
memeScore (0-1 float), suggestedName (<=24 chars), suggestedSymbol (<=8 uppercase chars), suggestedPrompt (image description for logo).
High memeScore (>0.6) for quirky, viral, absurd, or widely-shareable stories. Low for dry business/political news.`;

  const user = `Headline: ${article.title}\nSummary: ${article.description ?? ""}`;

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
  });
  const content = resp.choices[0]?.message?.content;
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    return {
      memeScore: Math.max(0, Math.min(1, Number(parsed.memeScore) || 0)),
      suggestedName: String(parsed.suggestedName ?? "").slice(0, 24),
      suggestedSymbol: String(parsed.suggestedSymbol ?? "").toUpperCase().slice(0, 8),
      suggestedPrompt: String(parsed.suggestedPrompt ?? ""),
    };
  } catch {
    return null;
  }
}

export async function runNewsCron(): Promise<void> {
  if (!env.NEWS_API_KEY || !env.OPENAI_API_KEY) {
    console.log("[news-cron] skipped (missing NEWS_API_KEY or OPENAI_API_KEY)");
    return;
  }
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const countries = env.NEWS_COUNTRIES.split(",").map((c) => c.trim()).filter(Boolean);

  let ingested = 0;
  for (const country of countries) {
    const articles = await fetchTopHeadlines(country);
    for (const art of articles) {
      const existing = await prisma.newsItem.findUnique({ where: { url: art.url } });
      if (existing) continue;
      const score = await scoreArticle(openai, art);
      if (!score) continue;
      if (score.memeScore < 0.35) continue;

      await prisma.newsItem.create({
        data: {
          country,
          source: art.source?.name ?? "unknown",
          url: art.url,
          title: art.title,
          summary: art.description ?? "",
          imageUrl: art.urlToImage,
          publishedAt: new Date(art.publishedAt),
          memeScore: score.memeScore,
          suggestedName: score.suggestedName,
          suggestedSymbol: score.suggestedSymbol,
          suggestedPrompt: score.suggestedPrompt,
        },
      });
      ingested += 1;
    }
  }
  console.log(`[news-cron] ingested ${ingested} items across ${countries.length} countries`);
}

if (require.main === module) {
  runNewsCron().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
