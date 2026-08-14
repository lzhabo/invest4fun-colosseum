import type { FeedItem, Idea } from "@invest4fun/contracts";

const solana: FeedItem = {
  id: "solana",
  symbol: "SOL",
  name: "Solana",
  assetType: "token",
  rationale: "A core network asset for the Solana ecosystem.",
  riskLabel: "higher",
  sourceLabel: "Curated ecosystem data",
};
const usdc: FeedItem = {
  id: "usdc",
  symbol: "USDC",
  name: "USD Coin",
  assetType: "token",
  rationale: "A dollar-denominated settlement asset for the platform.",
  riskLabel: "lower",
  sourceLabel: "Curated ecosystem data",
};
const climateGrowth: FeedItem = {
  id: "climate-growth",
  symbol: "CLMT",
  name: "Climate Growth Basket",
  assetType: "stock",
  rationale: "A placeholder equity idea for the future multi-asset universe.",
  riskLabel: "medium",
  sourceLabel: "Product prototype",
};

export const feedItems: FeedItem[] = [solana, usdc, climateGrowth];

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
