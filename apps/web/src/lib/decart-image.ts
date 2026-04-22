import { createDecart } from "@decartai/ai-sdk-provider";
import { generateImage } from "ai";
import { serverEnv } from "@/lib/env";

/** Lucy Pro text-to-image; returns raw PNG/JPEG bytes from Decart. */
export async function generateDecartImageBuffer(
  prompt: string,
  kind: "logo" | "poster" = "logo",
): Promise<Buffer | null> {
  const key = serverEnv.DECART_API_KEY?.trim();
  if (!key) return null;

  /** Logos are square stickers; posters use widescreen. Wrong ratio can cause API errors or bad crops. */
  const aspectRatio = kind === "logo" ? "1:1" : "16:9";

  try {
    const decart = createDecart({
      apiKey: key,
      baseURL: "https://api.decart.ai",
    });

    const { image, warnings } = await generateImage({
      model: decart.image("lucy-pro-t2i"),
      prompt,
      aspectRatio,
    });

    if (warnings?.length) {
      console.warn("[decart] image warnings", warnings);
    }

    if (!image?.uint8Array?.length) return null;
    return Buffer.from(image.uint8Array);
  } catch (e) {
    console.warn("[decart] image generation failed", e);
    return null;
  }
}
