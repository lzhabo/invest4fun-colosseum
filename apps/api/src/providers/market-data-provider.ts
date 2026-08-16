import type {
  FeedItem,
  MarketChartPeriod,
  MarketChartResponse,
} from "@invest4fun/contracts";
import { z } from "zod";
import type { FeedCatalogProvider } from "./catalog-provider.js";

const simplePriceSchema = z.record(
  z.string(),
  z.object({
    usd: z.number().nonnegative().optional(),
    usd_market_cap: z.number().nonnegative().optional(),
    usd_24h_vol: z.number().nonnegative().optional(),
    usd_24h_change: z.number().optional(),
    last_updated_at: z.number().int().positive().optional(),
  }),
);

export interface MarketDataProvider {
  enrich(items: FeedItem[]): Promise<FeedItem[]>;
}

export interface MarketChartProvider {
  getHistory(
    assetId: string,
    period: MarketChartPeriod,
  ): Promise<MarketChartResponse>;
}

export class CachedMarketDataProvider implements MarketDataProvider {
  private cached:
    | { key: string; expiresAt: number; items: FeedItem[] }
    | undefined;
  private inFlight: { key: string; promise: Promise<FeedItem[]> } | undefined;

  constructor(
    private readonly provider: MarketDataProvider,
    private readonly ttlMs = 60_000,
    private readonly now: () => number = Date.now,
  ) {}

  enrich(items: FeedItem[]) {
    const key = items
      .map((item) => item.coingeckoId ?? item.id)
      .sort()
      .join(",");

    if (
      this.cached &&
      this.cached.key === key &&
      this.cached.expiresAt > this.now()
    ) {
      return Promise.resolve(this.cached.items.map((item) => ({ ...item })));
    }

    if (this.inFlight?.key === key) return this.inFlight.promise;

    const promise = this.provider
      .enrich(items)
      .then((enriched) => {
        this.cached = {
          key,
          expiresAt: this.now() + this.ttlMs,
          items: enriched.map((item) => ({ ...item })),
        };
        return enriched;
      })
      .finally(() => {
        if (this.inFlight?.key === key) this.inFlight = undefined;
      });

    this.inFlight = { key, promise };
    return promise;
  }
}

export class ResilientMarketDataProvider implements MarketDataProvider {
  constructor(private readonly provider: MarketDataProvider) {}

  async enrich(items: FeedItem[]) {
    try {
      return await this.provider.enrich(items);
    } catch {
      return items.map((item) => ({ ...item }));
    }
  }
}

export class EnrichedCatalogProvider implements FeedCatalogProvider {
  constructor(
    private readonly catalog: FeedCatalogProvider,
    private readonly marketData: MarketDataProvider,
  ) {}

  async getItems() {
    const items = await this.catalog.getItems();
    return this.marketData.enrich(items);
  }
}

const marketChartSchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number().nonnegative()])),
});

export class CoinGeckoMarketDataProvider
  implements MarketDataProvider, MarketChartProvider
{
  constructor(
    private readonly apiKey: string | undefined,
    private readonly fetcher: typeof fetch = fetch,
    private readonly baseUrl = "https://api.coingecko.com/api/v3",
  ) {}

  async enrich(items: FeedItem[]) {
    const ids = items.flatMap((item) =>
      item.coingeckoId ? [item.coingeckoId] : [],
    );
    if (!ids.length) return items;

    const url = new URL(`${this.baseUrl}/simple/price`);
    url.searchParams.set("ids", ids.join(","));
    url.searchParams.set("vs_currencies", "usd");
    url.searchParams.set("include_market_cap", "true");
    url.searchParams.set("include_24hr_vol", "true");
    url.searchParams.set("include_24hr_change", "true");
    url.searchParams.set("include_last_updated_at", "true");

    const response = await this.fetcher(url, {
      ...(this.apiKey ? { headers: { "x-cg-demo-api-key": this.apiKey } } : {}),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`COINGECKO_MARKET_${response.status}`);

    const marketData = simplePriceSchema.parse(await response.json());
    return items.map((item) => {
      const snapshot = item.coingeckoId
        ? marketData[item.coingeckoId]
        : undefined;
      if (!snapshot) return item;
      return {
        ...item,
        marketDataSource: "coingecko" as const,
        marketDataUpdatedAt: snapshot.last_updated_at
          ? new Date(snapshot.last_updated_at * 1_000).toISOString()
          : new Date().toISOString(),
        priceUsd: snapshot.usd ?? null,
        marketCapUsd: snapshot.usd_market_cap ?? null,
        volume24hUsd: snapshot.usd_24h_vol ?? null,
        priceChange24hPct: snapshot.usd_24h_change ?? null,
      };
    });
  }

  async getHistory(assetId: string, period: MarketChartPeriod) {
    const url = new URL(`${this.baseUrl}/coins/${assetId}/market_chart`);
    url.searchParams.set("vs_currency", "usd");
    url.searchParams.set("days", period);
    if (period === "max") url.searchParams.set("interval", "daily");

    const response = await this.fetcher(url, {
      ...(this.apiKey ? { headers: { "x-cg-demo-api-key": this.apiKey } } : {}),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`COINGECKO_CHART_${response.status}`);

    const { prices } = marketChartSchema.parse(await response.json());
    const step = Math.max(1, Math.ceil(prices.length / 240));
    const points = prices
      .filter((_, index) => index % step === 0)
      .map(([timestamp, priceUsd]) => ({
        timestamp: new Date(timestamp).toISOString(),
        priceUsd,
      }));

    return {
      assetId,
      period,
      source: "coingecko" as const,
      updatedAt: new Date().toISOString(),
      points,
    };
  }
}
