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

export const assetIdentitySchema = z.object({
  chain: z.literal("solana"),
  mint: z.string().min(32),
});

export const assetEligibilitySchema = z.object({
  tradable: z.boolean(),
  executable: z.boolean(),
  reasonCodes: z.array(z.string().min(1)),
  policyVersion: z.string().min(1),
  checkedAt: z.string().datetime(),
});

export const marketDataStatusSchema = z.enum([
  "fresh",
  "stale",
  "degraded",
  "unavailable",
]);

export const marketSnapshotSchema = z.object({
  source: z.enum([
    "curated",
    "coingecko",
    "geckoterminal",
    "jupiter",
    "alchemy",
  ]),
  status: marketDataStatusSchema,
  asOf: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
});

const assetBaseSchema = z.object({
  chain: z.literal("solana"),
  symbol: z.string().min(1),
  name: z.string().min(1),
  rationale: z.string().min(1),
  riskLabel: z.enum(["lower", "medium", "higher"]),
  coingeckoId: z.string().min(1).nullable().optional(),
  iconUrl: z.string().url().nullable().optional(),
  priceUsd: z.number().nonnegative().nullable().optional(),
  marketCapUsd: z.number().nonnegative().nullable().optional(),
  volume24hUsd: z.number().nonnegative().nullable().optional(),
  priceChange24hPct: z.number().nullable().optional(),
  eligibility: assetEligibilitySchema,
  market: marketSnapshotSchema,
});

export const executableEligibilitySchema = assetEligibilitySchema.extend({
  tradable: z.literal(true),
  executable: z.literal(true),
  reasonCodes: z.array(z.string().min(1)).max(0),
});

export const nonExecutableEligibilitySchema = assetEligibilitySchema.extend({
  executable: z.literal(false),
  reasonCodes: z.array(z.string().min(1)).min(1),
});

export const tokenAssetSchema = assetBaseSchema.extend({
  assetType: z.literal("token"),
  mint: z.string().min(32),
  canonicalId: z.string().regex(/^solana:[1-9A-HJ-NP-Za-km-z]{32,}$/),
  eligibility: z.union([
    executableEligibilitySchema,
    nonExecutableEligibilitySchema,
  ]),
});

export const placeholderAssetSchema = assetBaseSchema.extend({
  assetType: z.literal("stock"),
  mint: z.null(),
  canonicalId: z.string().regex(/^product-placeholder:[a-z0-9-]+$/),
  eligibility: nonExecutableEligibilitySchema,
});

export const assetSchema = z.discriminatedUnion("assetType", [
  tokenAssetSchema,
  placeholderAssetSchema,
]);

const feedItemFields = {
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
  marketDataStatus: marketDataStatusSchema,
  marketDataAsOf: z.string().datetime().nullable(),
  marketDataExpiresAt: z.string().datetime().nullable(),
};

export const feedItemSchema = z
  .discriminatedUnion("assetType", [
    tokenAssetSchema.extend(feedItemFields),
    placeholderAssetSchema.extend(feedItemFields),
  ])
  .refine(
    (item: { id: string; canonicalId: string }) => item.id === item.canonicalId,
    {
      message: "Feed item id must match canonical asset id",
      path: ["id"],
    },
  );

export const ideaSourceSchema = z.object({
  type: z.enum(["curated", "partner", "user"]),
  label: z.string().min(1),
  url: z.string().url().nullable(),
});

export const ideaComponentSchema = z.object({
  assetId: z.string().regex(/^solana:[1-9A-HJ-NP-Za-km-z]{32,}$/),
  symbol: z.string().min(1),
  name: z.string().min(1),
  iconUrl: z.string().url().nullable().optional(),
  weightBps: z.number().int().min(1).max(10_000),
  order: z.number().int().nonnegative(),
  rationale: z.string().min(1).optional(),
});

export const ideaVersionSchema = z
  .object({
    id: z.string().min(1),
    version: z.number().int().positive(),
    effectiveAt: z.string().datetime(),
    totalWeightBps: z.literal(10_000),
    components: z.array(ideaComponentSchema).min(1).max(25),
  })
  .refine(
    (version) =>
      version.components.reduce(
        (total, component) => total + component.weightBps,
        0,
      ) === version.totalWeightBps,
    {
      message: "Idea component weights must sum to totalWeightBps",
      path: ["components"],
    },
  );

export const ideaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1).optional(),
  description: z.string().min(1),
  details: z.string().min(1).optional(),
  riskLabel: z.enum(["lower", "medium", "higher"]),
  status: z.enum(["active", "paused", "retired"]),
  minimumInvestmentCents: z.number().int().min(10),
  source: ideaSourceSchema,
  version: ideaVersionSchema,
});

export const feedResponseSchema = z.object({
  sessionId: z.string().uuid(),
  generatedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  items: z.array(feedItemSchema),
});
export const marketChartPeriodSchema = z.enum(["1", "7", "30", "365", "max"]);
export const marketChartResponseSchema = z.object({
  assetId: z.string().min(1),
  period: marketChartPeriodSchema,
  source: z.literal("coingecko"),
  status: marketDataStatusSchema,
  asOf: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime(),
  points: z.array(
    z.object({
      timestamp: z.string().datetime(),
      priceUsd: z.number().nonnegative(),
    }),
  ),
});
export const assetDetailsResponseSchema = z.object({
  assetId: z.string().min(1),
  source: z.literal("coingecko"),
  status: marketDataStatusSchema,
  asOf: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
  iconUrl: z.string().url().nullable(),
  categories: z.array(z.string()),
  marketCapUsd: z.number().nonnegative().nullable(),
  volume24hUsd: z.number().nonnegative().nullable(),
  websiteUrl: z.string().url().nullable(),
  updatedAt: z.string().datetime(),
});
export const ideasResponseSchema = z.object({ items: z.array(ideaSchema) });

export type Asset = z.infer<typeof assetSchema>;
export type AssetIdentity = z.infer<typeof assetIdentitySchema>;
export type AssetEligibility = z.infer<typeof assetEligibilitySchema>;
export type MarketDataStatus = z.infer<typeof marketDataStatusSchema>;
export type MarketSnapshot = z.infer<typeof marketSnapshotSchema>;
export type FeedItem = z.infer<typeof feedItemSchema>;
export type IdeaSource = z.infer<typeof ideaSourceSchema>;
export type IdeaComponent = z.infer<typeof ideaComponentSchema>;
export type IdeaVersion = z.infer<typeof ideaVersionSchema>;
export type Idea = z.infer<typeof ideaSchema>;
export type FeedResponse = z.infer<typeof feedResponseSchema>;
export type MarketChartPeriod = z.infer<typeof marketChartPeriodSchema>;
export type MarketChartResponse = z.infer<typeof marketChartResponseSchema>;
export type AssetDetailsResponse = z.infer<typeof assetDetailsResponseSchema>;
export type IdeasResponse = z.infer<typeof ideasResponseSchema>;

export const basketEntryRequestSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["asset", "idea"]),
  amountUsd: z.number().finite().min(0.1).max(1_000_000),
});

export const basketReviewRequestSchema = z.object({
  items: z.array(basketEntryRequestSchema).min(1).max(50),
});

export const basketDraftRequestSchema = z.object({
  items: z.array(basketEntryRequestSchema).max(50),
});

export const assetBasketSnapshotSchema = z.object({
  type: z.literal("asset"),
  assetId: z.string().min(1),
  symbol: z.string().min(1),
  name: z.string().min(1),
  eligibility: assetEligibilitySchema,
});

export const ideaBasketSnapshotSchema = z.object({
  type: z.literal("idea"),
  ideaId: z.string().min(1),
  ideaVersionId: z.string().min(1),
  title: z.string().min(1),
  riskLabel: z.enum(["lower", "medium", "higher"]),
  source: ideaSourceSchema,
  components: z.array(
    z.object({
      assetId: z.string().min(1),
      symbol: z.string().min(1),
      name: z.string().min(1),
      weightBps: z.number().int().min(1).max(10_000),
      order: z.number().int().nonnegative(),
    }),
  ),
});

export const basketSourceSnapshotSchema = z.discriminatedUnion("type", [
  assetBasketSnapshotSchema,
  ideaBasketSnapshotSchema,
]);

export const basketReviewResponseSchema = z.object({
  basket: z.object({
    id: z.string().uuid(),
    status: z.literal("draft"),
    totalUsd: z.number().nonnegative(),
    items: z.array(
      basketEntryRequestSchema.extend({
        title: z.string().min(1),
        sourceVersionId: z.string().min(1).nullable().optional(),
        sourceSnapshot: basketSourceSnapshotSchema.optional(),
      }),
    ),
  }),
  order: z.object({
    id: z.string().uuid(),
    status: z.literal("draft"),
    idempotencyKey: z.string().min(1),
  }),
});

export const basketDraftSchema = z.object({
  id: z.string().uuid(),
  status: z.literal("draft"),
  totalUsd: z.number().nonnegative(),
  items: z.array(
    basketEntryRequestSchema.extend({
      title: z.string().min(1),
      sourceVersionId: z.string().min(1).nullable().optional(),
      sourceSnapshot: basketSourceSnapshotSchema.optional(),
    }),
  ),
});

export const basketDraftResponseSchema = z.object({
  basket: basketDraftSchema.nullable(),
});

export type BasketEntryRequest = z.infer<typeof basketEntryRequestSchema>;
export type BasketSourceSnapshot = z.infer<typeof basketSourceSnapshotSchema>;
export type BasketReviewRequest = z.infer<typeof basketReviewRequestSchema>;
export type BasketReviewResponse = z.infer<typeof basketReviewResponseSchema>;
export type BasketDraft = z.infer<typeof basketDraftSchema>;
export type BasketDraftResponse = z.infer<typeof basketDraftResponseSchema>;

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
