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
  symbol: z.string().min(1),
  name: z.string().min(1),
  assetType: z.enum(["token", "stock"]),
  rationale: z.string().min(1),
  riskLabel: z.enum(["lower", "medium", "higher"]),
});

export const feedItemSchema = assetSchema.extend({
  id: z.string().min(1),
  sourceLabel: z.string().min(1),
});

export const ideaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  riskLabel: z.enum(["lower", "medium", "higher"]),
  positions: z.array(assetSchema).min(1),
});

export const feedResponseSchema = z.object({ items: z.array(feedItemSchema) });
export const ideasResponseSchema = z.object({ items: z.array(ideaSchema) });

export type Asset = z.infer<typeof assetSchema>;
export type FeedItem = z.infer<typeof feedItemSchema>;
export type Idea = z.infer<typeof ideaSchema>;
export type FeedResponse = z.infer<typeof feedResponseSchema>;
export type IdeasResponse = z.infer<typeof ideasResponseSchema>;
