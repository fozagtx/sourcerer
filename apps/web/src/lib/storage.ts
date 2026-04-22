import { serverEnv } from "./env";

/** Store PNG bytes in Supabase when configured; otherwise a data URL (fine for local dev). */
export async function persistPngBytes(buf: Buffer, folder: "logos" | "posters"): Promise<string> {
  if (serverEnv.SUPABASE_URL && serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const key = `${folder}/${crypto.randomUUID()}.png`;
      const upload = await fetch(`${serverEnv.SUPABASE_URL}/storage/v1/object/sourcerer/${key}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serverEnv.SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: serverEnv.SUPABASE_SERVICE_ROLE_KEY,
          "content-type": "image/png",
        },
        body: new Uint8Array(buf),
      });
      if (upload.ok) {
        return `${serverEnv.SUPABASE_URL}/storage/v1/object/public/sourcerer/${key}`;
      }
      console.warn("[storage] supabase png upload failed", upload.status);
    } catch (e) {
      console.warn("[storage] supabase png upload error", e);
    }
  }
  return `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
}

/**
 * Uploads a remote image URL to Supabase Storage and returns a durable public URL.
 * Falls back to returning the source URL unchanged if Supabase isn't configured.
 */
export async function mirrorToSupabase(srcUrl: string, folder: "logos" | "posters"): Promise<string> {
  if (!serverEnv.SUPABASE_URL || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) return srcUrl;
  try {
    const res = await fetch(srcUrl);
    if (!res.ok) return srcUrl;
    const buf = Buffer.from(await res.arrayBuffer());
    const key = `${folder}/${crypto.randomUUID()}.png`;
    const upload = await fetch(`${serverEnv.SUPABASE_URL}/storage/v1/object/sourcerer/${key}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serverEnv.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: serverEnv.SUPABASE_SERVICE_ROLE_KEY,
        "content-type": "image/png",
      },
      body: buf,
    });
    if (!upload.ok) return srcUrl;
    return `${serverEnv.SUPABASE_URL}/storage/v1/object/public/sourcerer/${key}`;
  } catch {
    return srcUrl;
  }
}

/** Pin a JSON blob to web3.storage (IPFS). Returns an `ipfs://<cid>` URI. */
export async function pinJsonToIpfs(obj: unknown): Promise<string | null> {
  if (!serverEnv.WEB3_STORAGE_TOKEN) return null;
  try {
    const form = new FormData();
    const blob = new Blob([JSON.stringify(obj)], { type: "application/json" });
    form.append("file", blob, "metadata.json");
    const res = await fetch("https://api.web3.storage/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${serverEnv.WEB3_STORAGE_TOKEN}` },
      body: form,
    });
    if (!res.ok) return null;
    const j: any = await res.json();
    if (!j.cid) return null;
    return `ipfs://${j.cid}/metadata.json`;
  } catch {
    return null;
  }
}
