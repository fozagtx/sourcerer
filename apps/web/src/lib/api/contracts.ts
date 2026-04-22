import { z } from "zod";

/** Strict request bodies — unknown fields → 400 (article: Stripe-style boundaries). */

export const tokenConceptPostSchema = z
  .object({
    keyword: z.string().min(1).max(240),
    newsId: z.string().optional(),
    includeImages: z.boolean().default(true),
  })
  .strict();

export const aiImagePostSchema = z
  .object({
    logoPrompt: z.string().min(1),
    posterPrompts: z.array(z.string()).max(4).default([]),
  })
  .strict();

export const metadataPinPostSchema = z
  .object({
    name: z.string().min(1).max(64),
    symbol: z.string().min(1).max(16),
    description: z.string().optional().default(""),
    image: z.string().optional().default(""),
    posters: z.array(z.string()).optional().default([]),
    external_url: z.string().optional(),
  })
  .strict();

export const authNoncePostSchema = z
  .object({
    wallet: z.string().min(1),
  })
  .strict();

export const authVerifyPostSchema = z
  .object({
    wallet: z.string().min(1),
    signature: z.string().min(1),
  })
  .strict();

export const commentPostSchema = z
  .object({
    body: z.string().min(1).max(1000),
  })
  .strict();

export const candleQuerySchema = z
  .object({
    interval: z.enum(["1m", "5m", "15m", "1h", "4h", "1d"]).default("1m"),
  })
  .strict();

export const mintParamSchema = z.object({
  mint: z.string().min(1),
});
