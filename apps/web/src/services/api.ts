import {
  type BasketEntryRequest,
  type BasketReviewResponse,
  basketReviewResponseSchema,
  type FeedResponse,
  feedResponseSchema,
  type HealthResponse,
  healthResponseSchema,
  type IdeasResponse,
  ideasResponseSchema,
  type MarketChartPeriod,
  type MarketChartResponse,
  marketChartResponseSchema,
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

export function getMarketChart(
  assetId: string,
  period: MarketChartPeriod,
  signal?: AbortSignal,
): Promise<MarketChartResponse> {
  return getJson(
    `/api/feed/${encodeURIComponent(assetId)}/chart?days=${period}`,
    marketChartResponseSchema.parse,
    signal,
  );
}

export async function reviewBasket(
  items: BasketEntryRequest[],
  accessToken: string,
): Promise<BasketReviewResponse> {
  const response = await fetch("/api/baskets/review", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({ items }),
  });
  if (!response.ok) throw new Error("BASKET_REVIEW_FAILED");
  return basketReviewResponseSchema.parse(await response.json());
}
