import { z } from "zod";

export const serviceNameSchema = z.enum(["api", "worker"]);

export const healthResponseSchema = z.object({
  service: serviceNameSchema,
  status: z.enum(["ok", "degraded"]),
  version: z.string(),
  timestamp: z.string().datetime(),
});

export const readinessResponseSchema = healthResponseSchema.extend({
  checks: z.object({
    database: z.enum(["ok", "unavailable"]),
  }),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;

export const assetSchema = z.object({
  chain: z.literal("solana"),
  mint: z.string().min(32).nullable(),
  symbol: z.string().min(1),
  name: z.string().min(1),
  assetType: z.enum(["token", "stock"]),
  rationale: z.string().min(1),
  riskLabel: z.enum(["lower", "medium", "higher"]),
  coingeckoId: z.string().min(1).nullable().optional(),
  priceUsd: z.number().nonnegative().nullable().optional(),
  marketCapUsd: z.number().nonnegative().nullable().optional(),
  volume24hUsd: z.number().nonnegative().nullable().optional(),
  priceChange24hPct: z.number().nullable().optional(),
});

export const feedItemSchema = assetSchema.extend({
  id: z.string().min(1),
  sourceLabel: z.string().min(1),
  marketDataSource: z.enum([
    "curated",
    "coingecko",
    "geckoterminal",
    "jupiter",
    "alchemy",
  ]),
  marketDataUpdatedAt: z.string().datetime().nullable(),
});

export const ideaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  riskLabel: z.enum(["lower", "medium", "higher"]),
  positions: z.array(assetSchema).min(1),
});

export const feedResponseSchema = z.object({
  sessionId: z.string().uuid(),
  generatedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  items: z.array(feedItemSchema),
});
export const ideasResponseSchema = z.object({ items: z.array(ideaSchema) });

export type Asset = z.infer<typeof assetSchema>;
export type FeedItem = z.infer<typeof feedItemSchema>;
export type Idea = z.infer<typeof ideaSchema>;
export type FeedResponse = z.infer<typeof feedResponseSchema>;
export type IdeasResponse = z.infer<typeof ideasResponseSchema>;

export const walletSummarySchema = z.object({
  id: z.string().uuid(),
  chain: z.literal("solana"),
  address: z.string().min(32),
  role: z.enum(["embedded", "external"]),
  provider: z.string().min(1),
  label: z.string().nullable(),
  active: z.boolean(),
});

export const accountBootstrapResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    status: z.enum(["active", "suspended", "deleted"]),
  }),
  identity: z.object({
    provider: z.string().min(1),
    externalSubject: z.string().min(1),
  }),
  wallets: z.array(walletSummarySchema),
});

export type WalletSummary = z.infer<typeof walletSummarySchema>;
export type AccountBootstrapResponse = z.infer<
  typeof accountBootstrapResponseSchema
>;
