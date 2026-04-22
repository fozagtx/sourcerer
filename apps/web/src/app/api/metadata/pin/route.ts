import { pinJsonToIpfs } from "@/lib/storage";
import { parseJsonBody } from "@/lib/api/body";
import { metadataPinPostSchema } from "@/lib/api/contracts";
import { apiPost, okJson } from "@/lib/api/handler";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return apiPost(req, async ({ req, requestId }) => {
    const data = await parseJsonBody(req, metadataPinPostSchema);
    const meta = {
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      image: data.image,
      posters: data.posters,
      external_url: data.external_url,
      attributes: [{ trait_type: "launcher", value: "sourcerer" }],
    };

    const ipfsUri = await pinJsonToIpfs(meta);
    if (ipfsUri) {
      return okJson(
        {
          uri: ipfsUri,
          gateway: `https://ipfs.io/ipfs/${ipfsUri.replace("ipfs://", "")}`,
        },
        requestId,
      );
    }

    const encoded = Buffer.from(JSON.stringify(meta), "utf8").toString("base64");
    return okJson({ uri: `data:application/json;base64,${encoded}` }, requestId);
  });
}
