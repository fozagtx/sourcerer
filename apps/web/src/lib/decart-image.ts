import { createDecart } from "@decartai/ai-sdk-provider";
import { generateImage } from "ai";
import { serverEnv } from "@/lib/env";

export async function generateImageBuffer(
  prompt: string,
  kind: "logo" | "poster" = "logo",
): Promise<{ buffer: Buffer; error?: string }> {
  const key = serverEnv.DECART_API_KEY?.trim();
  if (!key)
    return { buffer: Buffer.alloc(0), error: "DECART_API_KEY is not set" };

  try {
    const decart = createDecart({
      apiKey: key,
      baseURL: "https://api.decart.ai",
    });
    const { image } = await generateImage({
      model: decart.image("lucy-pro-t2i"),
      prompt,
      aspectRatio: kind === "logo" ? "9:16" : "16:9",
    });

    if (!image?.uint8Array?.length) {
      return { buffer: Buffer.alloc(0), error: "Decart returned empty image" };
    }
    return { buffer: Buffer.from(image.uint8Array) };
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    console.error("[decart] image generation failed:", msg);
    return { buffer: Buffer.alloc(0), error: `Decart API error: ${msg}` };
  }
}
