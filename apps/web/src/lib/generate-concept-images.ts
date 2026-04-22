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

function toDataUrl(buf: Buffer): string {
  return `data:image/png;base64,${buf.toString("base64")}`;
}

export async function generateConceptImages(
  input: ConceptImageInput,
): Promise<ConceptImageResult> {
  const warnings: string[] = [];

  const logoBuf = await generateImageBuffer(input.logoPrompt, "logo");
  const logoUrl = logoBuf ? toDataUrl(logoBuf) : "";
  if (!logoUrl) warnings.push("Logo generation failed. Is DECART_API_KEY set?");

  const posterUrls = (
    await Promise.all(
      input.posterPrompts.map((p) => generateImageBuffer(p, "poster")),
    )
  )
    .filter((buf): buf is Buffer => buf !== null)
    .map(toDataUrl);

  if (input.posterPrompts.length > 0 && posterUrls.length === 0) {
    warnings.push("All poster generations failed. Is DECART_API_KEY set?");
  }

  return { logoUrl, posterUrls, warnings };
}
