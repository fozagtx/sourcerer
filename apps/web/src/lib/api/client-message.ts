import type { ApiErrorEnvelope, ApiErrorResponseBody } from "@/lib/api/types";

/** Turn a failed `fetch` response body into a user-visible string (supports structured `{ error: { message } }`). */
export function messageFromApiErrorBody(text: string): string {
  try {
    const o = JSON.parse(text) as ApiErrorResponseBody | { error?: string | ApiErrorEnvelope };
    if (typeof o.error === "string") return o.error;
    if (o.error && typeof o.error === "object" && "message" in o.error) {
      const e = o.error as ApiErrorEnvelope;
      if (e.suggestion) return `${e.message} — ${e.suggestion}`;
      return e.message;
    }
    return text;
  } catch {
    return text;
  }
}
