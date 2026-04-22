import { getOpenAI, LOGO_SIZE, POSTER_SIZE } from "@/lib/ai";
import { generateDecartImageBuffer } from "@/lib/decart-image";
import { serverEnv } from "@/lib/env";
import { mirrorToSupabase, persistPngBytes } from "@/lib/storage";

export type PosterProvider = "openai" | "replicate";

export interface ConceptImageInput {
  logoPrompt: string;
  posterPrompts: string[];
  posterProvider?: PosterProvider;
}

export interface ConceptImageResult {
  logoUrl: string;
  posterUrls: string[];
  /** Populated when no image backend produced output */
  warnings: string[];
}

async function generateOpenAIImage(prompt: string, size: string): Promise<string | null> {
  const openai = getOpenAI();
  if (!openai) return null;
  try {
    const r = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: size as "1024x1024",
      response_format: "url",
    });
    return r.data?.[0]?.url ?? null;
  } catch (e) {
    console.warn("[ai/image] openai failed", e);
    return null;
  }
}

async function generateReplicateImage(prompt: string): Promise<string | null> {
  if (!serverEnv.REPLICATE_API_TOKEN) return null;
  try {
    const res = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${serverEnv.REPLICATE_API_TOKEN}`,
        Prefer: "wait",
      },
      body: JSON.stringify({
        version: "7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
        input: { prompt, width: 1024, height: 1024, num_outputs: 1 },
      }),
    });
    if (!res.ok) return null;
    const j: unknown = await res.json();
    const out = (j as { output?: string | string[] }).output;
    return Array.isArray(out) ? out[0] ?? null : out ?? null;
  } catch (e) {
    console.warn("[ai/image] replicate failed", e);
    return null;
  }
}

async function generateRasterUrl(
  prompt: string,
  folder: "logos" | "posters",
  posterProvider: PosterProvider,
): Promise<string> {
  if (serverEnv.DECART_API_KEY?.trim()) {
    const buf = await generateDecartImageBuffer(prompt);
    if (buf) return persistPngBytes(buf, folder);
  }

  if (folder === "posters" && posterProvider === "replicate") {
    const raw = await generateReplicateImage(prompt);
    if (raw) return mirrorToSupabase(raw, folder);
  }

  const size = folder === "logos" ? LOGO_SIZE : POSTER_SIZE;
  const rawUrl = await generateOpenAIImage(prompt, size);
  return rawUrl ? mirrorToSupabase(rawUrl, folder) : "";
}

/** Server-only: generates logo + poster URLs (Decart → OpenAI / Replicate). */
export async function generateConceptImages(input: ConceptImageInput): Promise<ConceptImageResult> {
  const posterProvider = input.posterProvider ?? "openai";
  const warnings: string[] = [];

  const hasImageBackend =
    !!serverEnv.DECART_API_KEY?.trim() || !!getOpenAI() || !!serverEnv.REPLICATE_API_TOKEN;
  if (!hasImageBackend) {
    warnings.push(
      "No image backend configured (set DECART_API_KEY and/or OPENAI_API_KEY, or REPLICATE_API_TOKEN for posters).",
    );
    return { logoUrl: "", posterUrls: [], warnings };
  }

  const logoUrl = await generateRasterUrl(input.logoPrompt, "logos", posterProvider);
  if (!logoUrl) warnings.push("Logo image generation returned empty — check API keys and logs.");

  const posterUrls = (
    await Promise.all(input.posterPrompts.map((p) => generateRasterUrl(p, "posters", posterProvider)))
  ).filter(Boolean);

  if (input.posterPrompts.length > 0 && posterUrls.length === 0) {
    warnings.push("Poster generation returned no images — check API keys and logs.");
  }

  return { logoUrl, posterUrls, warnings };
}
