import {
  type FeedResponse,
  feedResponseSchema,
  type HealthResponse,
  healthResponseSchema,
  type IdeasResponse,
  ideasResponseSchema,
} from "@invest4fun/contracts";

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch("/api/health", signal ? { signal } : undefined);
  if (!response.ok) throw new Error("API_UNAVAILABLE");
  return healthResponseSchema.parse(await response.json());
}

async function getJson<T>(
  path: string,
  parse: (value: unknown) => T,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path, signal ? { signal } : undefined);
  if (!response.ok) throw new Error("API_UNAVAILABLE");
  return parse(await response.json());
}

export function getFeed(signal?: AbortSignal): Promise<FeedResponse> {
  return getJson("/api/feed", feedResponseSchema.parse, signal);
}

export function getIdeas(signal?: AbortSignal): Promise<IdeasResponse> {
  return getJson("/api/ideas", ideasResponseSchema.parse, signal);
}
