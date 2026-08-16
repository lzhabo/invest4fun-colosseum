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

function token(input: {
  id: string;
  mint: string | null;
  coingeckoId: string;
  symbol: string;
  name: string;
  iconUrl?: string;
  rationale: string;
  riskLabel: FeedItem["riskLabel"];
}): FeedItem {
  return {
    ...baseAsset,
    ...input,
    assetType: "token",
    sourceLabel: "Curated Solana catalog",
  };
}

const solana = token({
  id: "solana",
  mint: "So11111111111111111111111111111111111111112",
  coingeckoId: "solana",
  symbol: "SOL",
  name: "Solana",
  iconUrl:
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  rationale: "A core network asset for the Solana ecosystem.",
  riskLabel: "higher",
});
const usdc = token({
  id: "usdc",
  mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  coingeckoId: "usd-coin",
  symbol: "USDC",
  name: "USD Coin",
  iconUrl:
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  rationale: "A dollar-denominated settlement asset for the platform.",
  riskLabel: "lower",
});
const usdt = token({
  id: "usdt",
  mint: "Es9vMFrzaCERmJfrF4H2FYD4NQqvC8S1m7a2z1e6p2y",
  coingeckoId: "tether",
  symbol: "USDT",
  name: "Tether",
  iconUrl: "https://cdn.instadapp.io/solana/tokens/icons/usdt.png",
  rationale: "A second dollar-denominated liquidity and settlement asset.",
  riskLabel: "lower",
});
const jupiter = token({
  id: "jupiter",
  mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  coingeckoId: "jupiter-exchange-solana",
  symbol: "JUP",
  name: "Jupiter",
  iconUrl: "https://static.jup.ag/jup/icon.png",
  rationale:
    "The governance and ecosystem token of Solana's leading aggregator.",
  riskLabel: "higher",
});
const jitoSol = token({
  id: "jito-sol",
  mint: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
  coingeckoId: "jito-staked-sol",
  symbol: "JitoSOL",
  name: "Jito Staked SOL",
  iconUrl: "https://storage.googleapis.com/token-metadata/JitoSOL-256.png",
  rationale: "A liquid-staking asset designed to keep SOL productive onchain.",
  riskLabel: "higher",
});
const marinadeSol = token({
  id: "marinade-sol",
  mint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
  coingeckoId: "msol",
  symbol: "mSOL",
  name: "Marinade Staked SOL",
  iconUrl:
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png",
  rationale: "A liquid-staking asset providing diversified Solana exposure.",
  riskLabel: "higher",
});
const dogwifhat = token({
  id: "dogwifhat",
  mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
  coingeckoId: "dogwifcoin",
  symbol: "WIF",
  name: "dogwifhat",
  iconUrl:
    "https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betidfwy3ajsav2vjzyum.ipfs.nftstorage.link",
  rationale: "A high-volatility meme asset from the Solana ecosystem.",
  riskLabel: "higher",
});
const bonk = token({
  id: "bonk",
  mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  coingeckoId: "bonk",
  symbol: "BONK",
  name: "Bonk",
  iconUrl: "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I",
  rationale: "A community-driven meme asset with high volatility.",
  riskLabel: "higher",
});
const raydium = token({
  id: "raydium",
  mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
  coingeckoId: "raydium",
  symbol: "RAY",
  name: "Raydium",
  iconUrl:
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png",
  rationale: "A DeFi infrastructure token tied to a major Solana venue.",
  riskLabel: "higher",
});
const orca = token({
  id: "orca",
  mint: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
  coingeckoId: "orca",
  symbol: "ORCA",
  name: "Orca",
  iconUrl:
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE/logo.png",
  rationale: "A Solana DeFi token linked to an established liquidity protocol.",
  riskLabel: "higher",
});
const kamino = token({
  id: "kamino",
  mint: "KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS",
  coingeckoId: "kamino",
  symbol: "KMNO",
  name: "Kamino",
  iconUrl: "https://cdn.kamino.finance/kamino.svg",
  rationale: "A DeFi infrastructure token from the Solana lending ecosystem.",
  riskLabel: "higher",
});
const wrappedBitcoin = token({
  id: "wrapped-bitcoin",
  mint: "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij",
  coingeckoId: "coinbase-wrapped-btc",
  symbol: "cbBTC",
  name: "Coinbase Wrapped BTC",
  iconUrl:
    "https://ipfs.io/ipfs/QmZ7L8yd5j36oXXydUiYFiFsRHbi3EdgC4RuFwvM7dcqge",
  rationale: "Bitcoin exposure represented as a Solana token.",
  riskLabel: "higher",
});
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

export const feedItems: FeedItem[] = [
  solana,
  usdc,
  usdt,
  wrappedBitcoin,
  jupiter,
  jitoSol,
  marinadeSol,
  raydium,
  orca,
  kamino,
  dogwifhat,
  bonk,
  climateGrowth,
];

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
