import OpenAI from "openai";
import { serverEnv } from "./env";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export type ConceptLlmProvider = "openrouter" | "openai";

export type ConceptLlm = {
  client: OpenAI;
  model: string;
  provider: ConceptLlmProvider;
};

/**
 * Chat model for token concepts: OpenRouter first (any OpenAI-compatible model slug), else direct OpenAI chat.
 * Images are Decart-only in {@link generateConceptImages} (see DECART_API_KEY).
 */
export function getConceptLlm(): ConceptLlm | null {
  const orKey = serverEnv.OPENROUTER_API_KEY?.trim();
  if (orKey) {
    const headers: Record<string, string> = {};
    if (serverEnv.OPENROUTER_HTTP_REFERER) {
      headers["HTTP-Referer"] = serverEnv.OPENROUTER_HTTP_REFERER;
    }
    if (serverEnv.OPENROUTER_APP_NAME) {
      headers["X-Title"] = serverEnv.OPENROUTER_APP_NAME;
    }
    return {
      client: new OpenAI({
        apiKey: orKey,
        baseURL: OPENROUTER_BASE,
        ...(Object.keys(headers).length > 0 ? { defaultHeaders: headers } : {}),
      }),
      model: serverEnv.OPENROUTER_MODEL,
      provider: "openrouter",
    };
  }

  const oaKey = serverEnv.OPENAI_API_KEY?.trim();
  if (!oaKey) return null;

  return {
    client: new OpenAI({ apiKey: oaKey }),
    model: "gpt-4o-mini",
    provider: "openai",
  };
}

export const CONCEPT_SYSTEM_PROMPT = `You are Sourcerer's token concept generator.
Given a keyword or news headline, produce a memecoin concept.

Return strict JSON with keys:
- name (string, <=28 chars, catchy, title case)
- symbol (string, 3-8 uppercase letters, no spaces, no $)
- description (string, 1-2 sentences, hype tone)
- logoPrompt (string, vivid image-generation prompt for a square sticker/logo, mention Pepe-like cartoon style if unclear)
- posterPrompts (array of 3-4 strings, each a distinct marketing image prompt)

Never include profanity, slurs, or real people's private addresses. Keep it punchy.`;
