import { generateConceptImages } from "@/lib/generate-concept-images";
import { parseJsonBody } from "@/lib/api/body";
import { aiImagePostSchema } from "@/lib/api/contracts";
import { apiPost, okJson } from "@/lib/api/handler";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  return apiPost(req, async ({ req, requestId }) => {
    const { logoPrompt, posterPrompts } = await parseJsonBody(req, aiImagePostSchema);
    const { logoUrl, posterUrls, warnings } = await generateConceptImages({
      logoPrompt,
      posterPrompts,
    });
    return okJson({ logoUrl, posterUrls, warnings }, requestId);
  });
}
