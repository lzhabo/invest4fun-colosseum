import type { FeedItem } from "@invest4fun/contracts";
import { describe, expect, it, vi } from "vitest";
import {
  CachedMarketDataProvider,
  CoinGeckoMarketDataProvider,
  ResilientMarketDataProvider,
} from "./market-data-provider.js";

const item: FeedItem = {
  id: "solana:So11111111111111111111111111111111111111112",
  canonicalId: "solana:So11111111111111111111111111111111111111112",
  chain: "solana",
  mint: "So11111111111111111111111111111111111111112",
  coingeckoId: "solana",
  symbol: "SOL",
  name: "Solana",
  assetType: "token",
  rationale: "Core network asset.",
  riskLabel: "higher",
  sourceLabel: "Curated ecosystem data",
  marketDataSource: "curated",
  marketDataUpdatedAt: null,
  marketDataStatus: "unavailable",
  marketDataAsOf: null,
  marketDataExpiresAt: null,
  eligibility: {
    tradable: true,
    executable: true,
    reasonCodes: [],
    policyVersion: "test",
    checkedAt: "2026-08-20T00:00:00.000Z",
  },
  market: {
    source: "curated",
    status: "unavailable",
    asOf: null,
    expiresAt: null,
  },
};

describe("CoinGeckoMarketDataProvider", () => {
  it("maps a simple price response into Feed market data", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          solana: {
            usd: 180.5,
            usd_market_cap: 85_000_000_000,
            usd_24h_vol: 2_000_000_000,
            usd_24h_change: 4.2,
            last_updated_at: 1_723_650_000,
          },
        }),
      ),
    );
    const provider = new CoinGeckoMarketDataProvider("test-key", fetcher);

    const [result] = await provider.enrich([item]);

    expect(result?.marketDataSource).toBe("coingecko");
    expect(result?.marketDataStatus).toBe("fresh");
    expect(result?.marketDataAsOf).toBe("2024-08-14T15:40:00.000Z");
    expect(result?.priceUsd).toBe(180.5);
    expect(result?.priceChange24hPct).toBe(4.2);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("caches the same catalog and deduplicates concurrent requests", async () => {
    let now = 1_000;
    let calls = 0;
    const provider = {
      enrich: vi.fn(async (items: FeedItem[]) => {
        calls += 1;
        await Promise.resolve();
        return items.map((item) => ({
          ...item,
          priceUsd: 180,
          marketDataSource: "coingecko" as const,
          marketDataStatus: "fresh" as const,
          marketDataUpdatedAt: new Date(now).toISOString(),
          marketDataAsOf: new Date(now).toISOString(),
          marketDataExpiresAt: new Date(now + 60_000).toISOString(),
          market: {
            source: "coingecko" as const,
            status: "fresh" as const,
            asOf: new Date(now).toISOString(),
            expiresAt: new Date(now + 60_000).toISOString(),
          },
        }));
      }),
    };
    const cached = new CachedMarketDataProvider(
      provider,
      60_000,
      () => now,
      "coingecko",
    );

    const [first, second] = await Promise.all([
      cached.enrich([item]),
      cached.enrich([item]),
    ]);
    await cached.enrich([item]);

    expect(calls).toBe(1);
    expect(first[0]?.priceUsd).toBe(180);
    expect(second[0]?.priceUsd).toBe(180);

    now += 60_001;
    await cached.enrich([item]);
    expect(calls).toBe(2);
  });

  it("keeps canonical asset identity in the cache key", async () => {
    let calls = 0;
    const provider = {
      enrich: vi.fn(async (items: FeedItem[]) => {
        calls += 1;
        return items;
      }),
    };
    const cached = new CachedMarketDataProvider(
      provider,
      60_000,
      () => 1_000,
      "coingecko",
    );
    const duplicateProviderId = {
      ...item,
      id: "solana:Dupe111111111111111111111111111111111111111",
      canonicalId: "solana:Dupe111111111111111111111111111111111111111",
      mint: "Dupe111111111111111111111111111111111111111",
      coingeckoId: item.coingeckoId,
    };

    await cached.enrich([item]);
    await cached.enrich([duplicateProviderId]);

    expect(calls).toBe(2);
  });

  it("returns explicitly stale cached data when refresh fails", async () => {
    let now = 1_000;
    let fail = false;
    const provider = {
      enrich: vi.fn(async (items: FeedItem[]) => {
        if (fail) throw new Error("COINGECKO_OFFLINE");
        return items.map((item) => ({
          ...item,
          priceUsd: 180,
          marketDataSource: "coingecko" as const,
          marketDataStatus: "fresh" as const,
          marketDataUpdatedAt: new Date(now).toISOString(),
          marketDataAsOf: new Date(now).toISOString(),
          marketDataExpiresAt: new Date(now + 60_000).toISOString(),
          market: {
            source: "coingecko" as const,
            status: "fresh" as const,
            asOf: new Date(now).toISOString(),
            expiresAt: new Date(now + 60_000).toISOString(),
          },
        }));
      }),
    };
    const cached = new CachedMarketDataProvider(
      provider,
      60_000,
      () => now,
      "coingecko",
    );

    await cached.enrich([item]);
    now += 60_001;
    fail = true;
    const [stale] = await cached.enrich([item]);

    expect(stale?.priceUsd).toBe(180);
    expect(stale?.marketDataStatus).toBe("stale");
    expect(stale?.marketDataExpiresAt).toBe(stale?.market.expiresAt);
    expect(stale?.market.status).toBe("stale");
  });

  it("falls back to curated items when market data is unavailable", async () => {
    const provider = new ResilientMarketDataProvider({
      enrich: async () => {
        throw new Error("COINGECKO_OFFLINE");
      },
    });

    const [result] = await provider.enrich([item]);

    expect(result?.id).toBe(item.id);
    expect(result?.priceUsd).toBeUndefined();
    expect(result?.marketDataStatus).toBe("degraded");
    expect(result?.market.status).toBe("degraded");
  });
});
