import { createDecart } from "@decartai/ai-sdk-provider";
import { generateImage } from "ai";
import { serverEnv } from "@/lib/env";

export async function generateImageBuffer(
  prompt: string,
  kind: "logo" | "poster" = "logo",
): Promise<Buffer | null> {
  const key = serverEnv.DECART_API_KEY?.trim();
  if (!key) return null;

  const aspectRatio = kind === "logo" ? "1:1" : "16:9";

  const decart = createDecart({
    apiKey: key,
    baseURL: "https://api.decart.ai",
  });
  const { image } = await generateImage({
    model: decart.image("lucy-pro-t2i"),
    prompt,
    aspectRatio,
  });

  if (!image?.uint8Array?.length) return null;
  return Buffer.from(image.uint8Array);
}
