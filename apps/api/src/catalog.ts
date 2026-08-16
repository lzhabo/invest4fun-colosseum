import type { FeedItem, Idea } from "@invest4fun/contracts";
import { CuratedCatalogProvider } from "./providers/catalog-provider.js";
import {
  CachedMarketDataProvider,
  CoinGeckoMarketDataProvider,
  EnrichedCatalogProvider,
  ResilientMarketDataProvider,
} from "./providers/market-data-provider.js";

const baseAsset = {
  chain: "solana" as const,
  marketDataSource: "curated" as const,
  marketDataUpdatedAt: null,
};

const solana: FeedItem = {
  ...baseAsset,
  id: "solana",
  mint: "So11111111111111111111111111111111111111112",
  coingeckoId: "solana",
  symbol: "SOL",
  name: "Solana",
  assetType: "token",
  rationale: "A core network asset for the Solana ecosystem.",
  riskLabel: "higher",
  sourceLabel: "Curated ecosystem data",
};
const usdc: FeedItem = {
  ...baseAsset,
  id: "usdc",
  mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  coingeckoId: "usd-coin",
  symbol: "USDC",
  name: "USD Coin",
  assetType: "token",
  rationale: "A dollar-denominated settlement asset for the platform.",
  riskLabel: "lower",
  sourceLabel: "Curated ecosystem data",
};
const climateGrowth: FeedItem = {
  ...baseAsset,
  id: "climate-growth",
  mint: null,
  symbol: "CLMT",
  name: "Climate Growth Basket",
  assetType: "stock",
  rationale: "A placeholder equity idea for the future multi-asset universe.",
  riskLabel: "medium",
  sourceLabel: "Product prototype",
};

export const feedItems: FeedItem[] = [solana, usdc, climateGrowth];

export const feedCatalog = new CuratedCatalogProvider(feedItems);

export function createFeedCatalog(coingeckoApiKey?: string) {
  const curated = new CuratedCatalogProvider(feedItems);
  const marketData = new CachedMarketDataProvider(
    new ResilientMarketDataProvider(
      new CoinGeckoMarketDataProvider(coingeckoApiKey),
    ),
  );
  return new EnrichedCatalogProvider(curated, marketData);
}

export const ideas: Idea[] = [
  {
    id: "steady-start",
    title: "Steady start",
    description: "A lower-volatility starting idea for a first basket.",
    riskLabel: "lower",
    positions: [usdc],
  },
  {
    id: "solana-builder",
    title: "Solana builder",
    description: "A concentrated ecosystem idea with more movement over time.",
    riskLabel: "higher",
    positions: [solana],
  },
];
