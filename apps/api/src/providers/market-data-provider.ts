import type { FeedItem } from "@invest4fun/contracts";
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

export class CoinGeckoMarketDataProvider implements MarketDataProvider {
  constructor(
    private readonly apiKey: string,
    private readonly fetcher: typeof fetch = fetch,
    private readonly baseUrl = "https://pro-api.coingecko.com/api/v3",
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
      headers: { "x-cg-pro-api-key": this.apiKey },
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
}
