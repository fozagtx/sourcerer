import { serverEnv } from "./env";

export type ExaResult = {
  id: string;
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  image?: string;
  text?: string;
  score?: number;
};

export type ExaSearchResponse = {
  results: ExaResult[];
};

const EXA_API = "https://api.exa.ai/search";

export async function searchMemeCoinNews(
  query?: string,
  count = 20,
): Promise<ExaResult[]> {
  const key = serverEnv.EXA_API_KEY?.trim();
  if (!key) return [];

  const body = {
    query: query ?? "memecoin crypto meme coin trending news today",
    type: "auto",
    numResults: count,
    useAutoprompt: true,
    contents: {
      text: { maxCharacters: 600 },
    },
  };

  const res = await fetch(EXA_API, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    console.error(
      "Exa API error:",
      res.status,
      await res.text().catch(() => ""),
    );
    return [];
  }

  const data = (await res.json()) as ExaSearchResponse;
  return data.results ?? [];
}
