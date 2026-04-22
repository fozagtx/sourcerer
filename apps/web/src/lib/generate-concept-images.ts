import { generateDecartImageBuffer } from "@/lib/decart-image";
import { serverEnv } from "@/lib/env";
import { persistPngBytes } from "@/lib/storage";

export interface ConceptImageInput {
  logoPrompt: string;
  posterPrompts: string[];
}

export interface ConceptImageResult {
  logoUrl: string;
  posterUrls: string[];
  /** Populated when no image backend produced output */
  warnings: string[];
}

async function generateRasterUrl(prompt: string, folder: "logos" | "posters"): Promise<string> {
  if (!serverEnv.DECART_API_KEY?.trim()) return "";

  const kind = folder === "logos" ? "logo" : "poster";
  const buf = await generateDecartImageBuffer(prompt, kind);
  if (!buf) return "";
  return persistPngBytes(buf, folder);
}

/** Server-only: logo + posters via Decart (`DECART_API_KEY`). */
export async function generateConceptImages(input: ConceptImageInput): Promise<ConceptImageResult> {
  const warnings: string[] = [];

  if (!serverEnv.DECART_API_KEY?.trim()) {
    warnings.push("DECART_API_KEY is not set — images require Decart.");
    return { logoUrl: "", posterUrls: [], warnings };
  }

  const logoUrl = await generateRasterUrl(input.logoPrompt, "logos");
  if (!logoUrl) {
    warnings.push("Logo empty: Decart did not return an image. Check DECART_API_KEY and server logs for [decart].");
  }

  const posterUrls = (
    await Promise.all(input.posterPrompts.map((p) => generateRasterUrl(p, "posters")))
  ).filter(Boolean);

  if (input.posterPrompts.length > 0 && posterUrls.length === 0) {
    warnings.push("Posters empty: Decart failed for all poster prompts — check logs for [decart].");
  }

  return { logoUrl, posterUrls, warnings };
}
