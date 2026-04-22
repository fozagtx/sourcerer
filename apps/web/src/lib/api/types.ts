/** Structured API errors (Stripe-style envelope). Success responses stay a flat JSON body. */
export type ApiErrorType =
  | "invalid_request"
  | "authentication_error"
  | "not_found"
  | "conflict"
  | "rate_limit"
  | "internal_error"
  | "service_unavailable"
  | "bad_gateway";

export type ApiErrorEnvelope = {
  code: string;
  type: ApiErrorType;
  message: string;
  suggestion?: string;
  docs?: string;
  param?: string;
  details?: unknown;
};

export type ApiErrorResponseBody = { error: ApiErrorEnvelope };
