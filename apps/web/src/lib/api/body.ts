import { z } from "zod";
import { apiErrors } from "@/lib/api/errors";

export async function parseJsonBody<T extends z.ZodTypeAny>(req: Request, schema: T): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw apiErrors.invalidJson();
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw apiErrors.validation(result.error.flatten());
  }
  return result.data;
}
