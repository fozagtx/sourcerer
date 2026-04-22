import { NextResponse } from "next/server";
import { z } from "zod";
import { pinJsonToIpfs } from "@/lib/storage";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().min(1).max(64),
  symbol: z.string().min(1).max(16),
  description: z.string().optional().default(""),
  image: z.string().optional().default(""),
  posters: z.array(z.string()).optional().default([]),
  external_url: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const meta = {
    name: parsed.data.name,
    symbol: parsed.data.symbol,
    description: parsed.data.description,
    image: parsed.data.image,
    posters: parsed.data.posters,
    external_url: parsed.data.external_url,
    attributes: [
      { trait_type: "launcher", value: "sourcerer" },
    ],
  };

  const ipfsUri = await pinJsonToIpfs(meta);
  if (ipfsUri) return NextResponse.json({ uri: ipfsUri, gateway: `https://ipfs.io/ipfs/${ipfsUri.replace("ipfs://", "")}` });

  const encoded = Buffer.from(JSON.stringify(meta), "utf8").toString("base64");
  return NextResponse.json({ uri: `data:application/json;base64,${encoded}` });
}
