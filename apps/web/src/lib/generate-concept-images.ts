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

  const logo = await generateImageBuffer(input.logoPrompt, "logo");
  const logoUrl = logo.buffer.length > 0 ? toDataUrl(logo.buffer) : "";
  if (!logoUrl) warnings.push(logo.error ?? "Logo generation failed");

  const posterResults = await Promise.all(
    input.posterPrompts.map((p) => generateImageBuffer(p, "poster")),
  );
  const posterUrls = posterResults
    .filter((r) => r.buffer.length > 0)
    .map((r) => toDataUrl(r.buffer));

  const failedPosters = posterResults.filter(
    (r) => r.buffer.length === 0 && r.error,
  );
  failedPosters.forEach((r) => warnings.push(r.error!));

  return { logoUrl, posterUrls, warnings };
}
