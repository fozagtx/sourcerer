import { createDecart } from "@decartai/ai-sdk-provider";
import { generateImage } from "ai";
import { serverEnv } from "@/lib/env";

export async function generateImageBuffer(
  prompt: string,
  kind: "logo" | "poster" = "logo",
): Promise<{ buf: Buffer; mime: "image/png" | "image/svg+xml" } | null> {
  const key = serverEnv.DECART_API_KEY?.trim();
  if (!key) return generateSvgPlaceholder(prompt, kind);

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
    if (warnings?.length) console.warn("[decart] warnings", warnings);
    if (!image?.uint8Array?.length) return null;
    return { buf: Buffer.from(image.uint8Array), mime: "image/png" };
  } catch (e) {
    console.warn("[decart] image generation failed, using placeholder", e);
    return generateSvgPlaceholder(prompt, kind);
  }
}

function generateSvgPlaceholder(
  prompt: string,
  kind: "logo" | "poster",
): { buf: Buffer; mime: "image/svg+xml" } {
  const w = kind === "logo" ? 512 : 1024;
  const h = kind === "logo" ? 512 : 576;
  const label = prompt
    .slice(0, 60)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const hue = [...prompt].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:hsl(${hue},65%,22%)"/>
      <stop offset="100%" style="stop-color:hsl(${(hue + 40) % 360},55%,18%)"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)" rx="${kind === "logo" ? 64 : 24}"/>
  <text x="${w / 2}" y="${h / 2 - 16}" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-weight="bold" font-size="${kind === "logo" ? 120 : 80}" fill="hsl(${hue},80%,65%)" opacity="0.9">⚡</text>
  <text x="${w / 2}" y="${h / 2 + 80}" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="${kind === "logo" ? 20 : 22}" fill="white" opacity="0.7">${label}</text>
</svg>`;

  return { buf: Buffer.from(svg), mime: "image/svg+xml" };
}
