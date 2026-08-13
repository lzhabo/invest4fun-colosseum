import {
  type HealthResponse,
  healthResponseSchema,
} from "@invest4fun/contracts";

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch("/api/health", signal ? { signal } : undefined);
  if (!response.ok) throw new Error("API_UNAVAILABLE");
  return healthResponseSchema.parse(await response.json());
}
