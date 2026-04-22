import type { ApiErrorEnvelope, ApiErrorType } from "@/lib/api/types";

const docs = (hash: string) =>
  process.env.NEXT_PUBLIC_API_DOCS_URL
    ? `${process.env.NEXT_PUBLIC_API_DOCS_URL.replace(/\/$/, "")}${hash}`
    : undefined;

export class ApiRouteError extends Error {
  constructor(
    readonly status: number,
    readonly payload: ApiErrorEnvelope,
    readonly extraHeaders: Record<string, string> = {},
  ) {
    super(payload.message);
    this.name = "ApiRouteError";
  }
}

function err(
  status: number,
  code: string,
  type: ApiErrorType,
  message: string,
  opts?: Partial<Pick<ApiErrorEnvelope, "suggestion" | "docs" | "param" | "details">>,
): ApiRouteError {
  return new ApiRouteError(status, {
    code,
    type,
    message,
    ...opts,
  });
}

export const apiErrors = {
  invalidJson: () =>
    err(400, "INVALID_JSON", "invalid_request", "Request body must be valid JSON.", {
      suggestion: 'Send JSON with header Content-Type: application/json.',
      docs: docs("#invalid-json"),
    }),

  validation: (details: unknown) =>
    err(400, "INVALID_REQUEST", "invalid_request", "Request validation failed.", {
      suggestion: "Fix the fields in `details` and retry. Unknown fields are rejected (.strict()).",
      details,
      docs: docs("#validation"),
    }),

  unauthorized: (message = "Authentication required.", param?: string) =>
    err(401, "UNAUTHORIZED", "authentication_error", message, {
      suggestion: "Provide a valid Authorization header.",
      param,
      docs: docs("#auth"),
    }),

  nonceExpired: () =>
    err(400, "NONCE_EXPIRED_OR_MISSING", "invalid_request", "Sign-in nonce is missing or expired.", {
      suggestion: "Request a fresh nonce via POST /api/auth/nonce, then sign the new message.",
      param: "wallet",
      docs: docs("#auth-nonce"),
    }),

  notFound: (resource: string, param?: string) =>
    err(404, "NOT_FOUND", "not_found", `${resource} was not found.`, {
      suggestion: "Check the identifier and try again.",
      param,
      docs: docs("#not-found"),
    }),

  serviceUnavailable: (message: string, code = "SERVICE_UNAVAILABLE", suggestion?: string) =>
    err(503, code, "service_unavailable", message, {
      suggestion: suggestion ?? "Try again later or verify server configuration.",
      docs: docs("#service-unavailable"),
    }),

  badGateway: (message: string, code = "UPSTREAM_ERROR", suggestion?: string) =>
    err(502, code, "bad_gateway", message, {
      suggestion: suggestion ?? "Retry once; if it persists, try a different model or check provider status.",
      docs: docs("#bad-gateway"),
    }),

  internal: () =>
    err(500, "INTERNAL_ERROR", "internal_error", "An unexpected error occurred.", {
      suggestion: "Retry later. Include the X-Request-Id response header if contacting support.",
      docs: docs("#internal"),
    }),
};
