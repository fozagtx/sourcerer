import { generateImageBuffer } from "@/lib/decart-image";

export interface ConceptImageInput {
  logoPrompt: string;
  posterPrompts: string[];
}

export interface ConceptImageResult {
  logoUrl: string;
  posterUrls: string[];
  warnings: string[];
}

function toDataUrl(buf: Buffer, mime: string): string {
  const prefix =
    mime === "image/svg+xml"
      ? "data:image/svg+xml;base64,"
      : "data:image/png;base64,";
  return `${prefix}${buf.toString("base64")}`;
}

export async function generateConceptImages(
  input: ConceptImageInput,
): Promise<ConceptImageResult> {
  const warnings: string[] = [];

  async function makeUrl(
    prompt: string,
    folder: "logos" | "posters",
  ): Promise<string> {
    const result = await generateImageBuffer(
      prompt,
      folder === "logos" ? "logo" : "poster",
    );
    if (!result) return "";
    return toDataUrl(result.buf, result.mime);
  }

  const logoUrl = await makeUrl(input.logoPrompt, "logos");
  if (!logoUrl) warnings.push("Logo generation failed.");

  const posterUrls = (
    await Promise.all(input.posterPrompts.map((p) => makeUrl(p, "posters")))
  ).filter(Boolean);

  if (input.posterPrompts.length > 0 && posterUrls.length === 0) {
    warnings.push("All poster generations failed.");
  }

  return { logoUrl, posterUrls, warnings };
}
