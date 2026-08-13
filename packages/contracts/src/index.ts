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
