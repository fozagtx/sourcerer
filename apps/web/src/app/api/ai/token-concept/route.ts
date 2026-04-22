import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { getConceptLlm, CONCEPT_SYSTEM_PROMPT } from "@/lib/ai";
import { generateConceptImages } from "@/lib/generate-concept-images";
import { serverEnv } from "@/lib/env";
import { parseConceptJson } from "@/lib/parse-concept-json";

export const runtime = "nodejs";

const bodySchema = z.object({
  keyword: z.string().min(1).max(240),
  newsId: z.string().optional(),
  includeImages: z.boolean().default(true),
});

interface Concept {
  name: string;
  symbol: string;
  description: string;
  logoPrompt: string;
  posterPrompts: string[];
}

function fallback(keyword: string): Concept {
  const base = keyword.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "PEPE";
  return {
    name: `${keyword.slice(0, 24)} Coin`,
    symbol: base,
    description: `The internet won't shut up about ${keyword}. Now you can trade it.`,
    logoPrompt: `A pepe-style cartoon sticker about "${keyword}", bright colors, white background, high contrast`,
    posterPrompts: [
      `Viral meme poster about ${keyword}, crypto rocket aesthetic`,
      `Cyberpunk poster referencing ${keyword}, neon type`,
      `Retro comic-book cover about ${keyword}`,
    ],
  };
}

function normalizeConcept(parsedConcept: Record<string, unknown>, keyword: string): Concept {
  const fb = fallback(keyword);
  const posterPromptsRaw = parsedConcept.posterPrompts;
  const posterPrompts = Array.isArray(posterPromptsRaw)
    ? posterPromptsRaw.slice(0, 4).map((x) => String(x))
    : fb.posterPrompts;

  return {
    name: String(parsedConcept.name ?? fb.name).slice(0, 32),
    symbol: String(parsedConcept.symbol ?? fb.symbol)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10),
    description: String(parsedConcept.description ?? ""),
    logoPrompt: String(parsedConcept.logoPrompt ?? fb.logoPrompt),
    posterPrompts,
  };
}

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { keyword, newsId, includeImages } = parsed.data;
  const demoMode = serverEnv.SOURCERER_AI_DEMO_MODE;

  const warnings: string[] = [];
  const llm = getConceptLlm();

  if (!llm && !demoMode) {
    return NextResponse.json(
      {
        error:
          "No LLM API key configured. Set OPENROUTER_API_KEY (recommended) or OPENAI_API_KEY for real AI concepts. " +
          "For local placeholder text only, set SOURCERER_AI_DEMO_MODE=1.",
      },
      { status: 503 },
    );
  }

  let concept: Concept;
  let conceptSource: "openrouter" | "openai" | "demo" = "demo";

  if (!llm) {
    concept = fallback(keyword);
    warnings.push("Demo mode: using placeholder concept copy (no LLM API key).");
  } else {
    try {
      let content: string;
      try {
        const completion = await llm.client.chat.completions.create({
          model: llm.model,
          response_format: { type: "json_object" },
          temperature: 0.9,
          messages: [
            { role: "system", content: CONCEPT_SYSTEM_PROMPT },
            { role: "user", content: `Keyword / headline: ${keyword}` },
          ],
        });
        content = completion.choices[0]?.message?.content ?? "{}";
      } catch (innerErr) {
        if (llm.provider !== "openrouter") throw innerErr;
        console.warn("[ai/token-concept] json_object mode unsupported or failed, retrying", innerErr);
        const completion = await llm.client.chat.completions.create({
          model: llm.model,
          temperature: 0.9,
          messages: [
            {
              role: "system",
              content: `${CONCEPT_SYSTEM_PROMPT}\n\nOutput only one JSON object. No markdown fences, no extra text.`,
            },
            { role: "user", content: `Keyword / headline: ${keyword}` },
          ],
        });
        content = completion.choices[0]?.message?.content ?? "{}";
      }
      const parsedConcept = parseConceptJson(content);
      concept = normalizeConcept(parsedConcept, keyword);
      conceptSource = llm.provider;
    } catch (err) {
      console.error("[ai/token-concept] LLM error", err);
      if (!demoMode) {
        const message = err instanceof Error ? err.message : "Concept generation failed";
        return NextResponse.json({ error: message }, { status: 502 });
      }
      concept = fallback(keyword);
      warnings.push("LLM request failed; demo fallback concept was used.");
    }
  }

  let logoUrl = "";
  let posterUrls: string[] = [];
  if (includeImages) {
    const img = await generateConceptImages({
      logoPrompt: concept.logoPrompt,
      posterPrompts: concept.posterPrompts,
    });
    logoUrl = img.logoUrl;
    posterUrls = img.posterUrls;
    warnings.push(...img.warnings);
  }

  let metadataUri = "";
  try {
    const pinRes = await fetch(new URL("/api/metadata/pin", req.url), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: concept.name,
        symbol: concept.symbol,
        description: concept.description,
        image: logoUrl,
        posters: posterUrls,
      }),
    });
    if (pinRes.ok) metadataUri = (await pinRes.json()).uri ?? "";
  } catch {
    // best-effort
  }

  if (isDatabaseConfigured) {
    try {
      await prisma.aiConcept.create({
        data: {
          keyword,
          name: concept.name,
          symbol: concept.symbol,
          description: concept.description,
          logoPrompt: concept.logoPrompt,
          posterPrompts: concept.posterPrompts,
          logoUrl: logoUrl || null,
          posterUrls,
        },
      });
      if (newsId) {
        await prisma.newsItem
          .update({
            where: { id: newsId },
            data: { used: true },
          })
          .catch(() => null);
      }
    } catch {
      // don't block user on db write
    }
  }

  return NextResponse.json({
    ...concept,
    logoUrl,
    posterUrls,
    metadataUri,
    conceptSource,
    warnings,
  });
}
