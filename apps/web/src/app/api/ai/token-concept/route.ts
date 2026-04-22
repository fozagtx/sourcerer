import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { getConceptLlm, CONCEPT_SYSTEM_PROMPT } from "@/lib/ai";
import { generateConceptImages } from "@/lib/generate-concept-images";
import { parseConceptJson } from "@/lib/parse-concept-json";
import { parseJsonBody } from "@/lib/api/body";
import { tokenConceptPostSchema } from "@/lib/api/contracts";
import { apiErrors } from "@/lib/api/errors";
import { apiPost, okJson } from "@/lib/api/handler";

export const runtime = "nodejs";

interface Concept {
  name: string;
  symbol: string;
  description: string;
  logoPrompt: string;
  posterPrompts: string[];
}

function conceptFromLlm(parsedConcept: Record<string, unknown>): Concept | null {
  const name = typeof parsedConcept.name === "string" ? parsedConcept.name.trim().slice(0, 32) : "";
  const symbolRaw = typeof parsedConcept.symbol === "string" ? parsedConcept.symbol.trim() : "";
  const symbol = symbolRaw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  const description = typeof parsedConcept.description === "string" ? parsedConcept.description.trim() : "";
  const logoPrompt = typeof parsedConcept.logoPrompt === "string" ? parsedConcept.logoPrompt.trim() : "";
  const posterPromptsRaw = parsedConcept.posterPrompts;
  const posterPrompts = Array.isArray(posterPromptsRaw)
    ? posterPromptsRaw.slice(0, 4).map((x) => String(x).trim()).filter(Boolean)
    : [];

  if (!name || !symbol || !logoPrompt || posterPrompts.length === 0) {
    return null;
  }

  return { name, symbol, description, logoPrompt, posterPrompts };
}

export async function POST(req: Request) {
  return apiPost(req, async ({ req, requestId }) => {
    const { keyword, newsId, includeImages } = await parseJsonBody(req, tokenConceptPostSchema);

    const warnings: string[] = [];
    const llm = getConceptLlm();

    if (!llm) {
      throw apiErrors.serviceUnavailable(
        "No LLM configured for token concepts.",
        "LLM_NOT_CONFIGURED",
        "Set OPENROUTER_API_KEY (recommended) or OPENAI_API_KEY.",
      );
    }

    let content: string;
    try {
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
    } catch (err) {
      console.error("[ai/token-concept] LLM error", err);
      const message = err instanceof Error ? err.message : "Concept generation failed";
      throw apiErrors.badGateway(message, "LLM_ERROR");
    }

    const parsedConcept = parseConceptJson(content);
    const concept = conceptFromLlm(parsedConcept);
    if (!concept) {
      throw apiErrors.badGateway(
        "The model returned an invalid concept (need name, symbol, logoPrompt, and at least one poster prompt).",
        "INVALID_CONCEPT_PAYLOAD",
        "Try again or switch model. Ensure the model returns strict JSON with all required fields.",
      );
    }

    const conceptSource = llm.provider;

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
      if (pinRes.ok) {
        const raw = await pinRes.text();
        try {
          const j = JSON.parse(raw) as { uri?: string };
          metadataUri = j.uri ?? "";
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* best-effort */
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
        /* don't block user on db write */
      }
    }

    return okJson(
      {
        ...concept,
        logoUrl,
        posterUrls,
        metadataUri,
        conceptSource,
        warnings,
      },
      requestId,
    );
  });
}
