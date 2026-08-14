import type { FeedItem } from "@invest4fun/contracts";
import { describe, expect, it, vi } from "vitest";
import { CoinGeckoMarketDataProvider } from "./market-data-provider.js";

const item: FeedItem = {
  id: "solana",
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
    expect(result?.priceUsd).toBe(180.5);
    expect(result?.priceChange24hPct).toBe(4.2);
    expect(fetcher).toHaveBeenCalledOnce();
  });
});
