import { ApiRouteError, apiErrors } from "@/lib/api/errors";
import type { ApiErrorResponseBody } from "@/lib/api/types";

const API_HEADERS = {
  "Cache-Control": "no-store",
} as const;

export function okJson(data: unknown, requestId: string, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      ...API_HEADERS,
      "X-Request-Id": requestId,
    },
  });
}

function errorJson(err: ApiRouteError, requestId: string): Response {
  const body: ApiErrorResponseBody = { error: err.payload };
  const headers = new Headers({ ...API_HEADERS, "X-Request-Id": requestId });
  for (const [k, v] of Object.entries(err.extraHeaders)) {
    headers.set(k, v);
  }
  return Response.json(body, { status: err.status, headers });
}

function handleCaught(e: unknown, requestId: string): Response {
  if (e instanceof ApiRouteError) {
    return errorJson(e, requestId);
  }
  console.error("[api] unhandled", e);
  return errorJson(apiErrors.internal(), requestId);
}

export async function apiPost(
  req: Request,
  run: (ctx: { req: Request; requestId: string }) => Promise<Response>,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  try {
    return await run({ req, requestId });
  } catch (e) {
    return handleCaught(e, requestId);
  }
}

export async function apiGetWithParams<TParams>(
  req: Request,
  context: { params: Promise<TParams> },
  run: (ctx: { req: Request; requestId: string; params: TParams }) => Promise<Response>,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  const params = await context.params;
  try {
    return await run({ req, requestId, params });
  } catch (e) {
    return handleCaught(e, requestId);
  }
}

export async function apiPostWithParams<TParams>(
  req: Request,
  context: { params: Promise<TParams> },
  run: (ctx: { req: Request; requestId: string; params: TParams }) => Promise<Response>,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  const params = await context.params;
  try {
    return await run({ req, requestId, params });
  } catch (e) {
    return handleCaught(e, requestId);
  }
}
