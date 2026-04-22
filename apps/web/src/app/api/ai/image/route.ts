import { NextResponse } from "next/server";
import { z } from "zod";
import { generateConceptImages } from "@/lib/generate-concept-images";

export const runtime = "nodejs";
export const maxDuration = 120;

const bodySchema = z.object({
  logoPrompt: z.string().min(1),
  posterPrompts: z.array(z.string()).max(4).default([]),
  posterProvider: z.enum(["openai", "replicate"]).default("openai"),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { logoPrompt, posterPrompts, posterProvider } = parsed.data;

  const { logoUrl, posterUrls, warnings } = await generateConceptImages({
    logoPrompt,
    posterPrompts,
    posterProvider,
  });

  return NextResponse.json({ logoUrl, posterUrls, warnings });
}
