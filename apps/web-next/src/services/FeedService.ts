import { type FeedResponse, feedResponseSchema } from "@invest4fun/contracts";

export interface FeedService {
  loadFeed(signal?: AbortSignal): Promise<FeedResponse>;
}

const checkedAt = "2026-08-24T00:00:00.000Z";
const generatedAt = "2026-08-24T12:00:00.000Z";
const expiresAt = "2026-08-25T12:00:00.000Z";

function token(input: {
  mint: string;
  symbol: string;
  name: string;
  rationale: string;
  riskLabel: "lower" | "medium" | "higher";
  priceUsd: number;
  priceChange24hPct: number;
  marketCapUsd: number;
  volume24hUsd: number;
}) {
  const canonicalId = `solana:${input.mint}`;

  return {
    ...input,
    id: canonicalId,
    canonicalId,
    chain: "solana" as const,
    assetType: "token" as const,
    coingeckoId: null,
    iconUrl: null,
    sourceLabel: "Mock Solana catalog",
    marketDataSource: "curated" as const,
    marketDataUpdatedAt: generatedAt,
    marketDataStatus: "fresh" as const,
    marketDataAsOf: generatedAt,
    marketDataExpiresAt: expiresAt,
    eligibility: {
      tradable: true as const,
      executable: true as const,
      reasonCodes: [],
      policyVersion: "mock-feed-v1",
      checkedAt,
    },
    market: {
      source: "curated" as const,
      status: "fresh" as const,
      asOf: generatedAt,
      expiresAt,
    },
  };
}

const mockResponse = feedResponseSchema.parse({
  sessionId: "6a261116-9874-4cec-a1db-bfaeeef8441f",
  generatedAt,
  expiresAt,
  items: [
    token({
      mint: "So11111111111111111111111111111111111111112",
      symbol: "SOL",
      name: "Solana",
      rationale:
        "The native asset powering fees, staking and applications across the Solana network.",
      riskLabel: "higher",
      priceUsd: 146.82,
      priceChange24hPct: 4.28,
      marketCapUsd: 68_900_000_000,
      volume24hUsd: 3_820_000_000,
    }),
    token({
      mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      symbol: "USDC",
      name: "USD Coin",
      rationale:
        "A dollar-denominated asset commonly used for settlement and liquidity on Solana.",
      riskLabel: "lower",
      priceUsd: 1,
      priceChange24hPct: 0.01,
      marketCapUsd: 61_400_000_000,
      volume24hUsd: 8_960_000_000,
    }),
    token({
      mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
      symbol: "JUP",
      name: "Jupiter",
      rationale:
        "The ecosystem token of Jupiter, a major liquidity and trading venue on Solana.",
      riskLabel: "higher",
      priceUsd: 0.58,
      priceChange24hPct: -2.46,
      marketCapUsd: 1_820_000_000,
      volume24hUsd: 71_000_000,
    }),
    token({
      mint: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
      symbol: "JitoSOL",
      name: "Jito Staked SOL",
      rationale:
        "A liquid-staking token that represents staked SOL while remaining usable onchain.",
      riskLabel: "medium",
      priceUsd: 173.41,
      priceChange24hPct: 3.91,
      marketCapUsd: 2_190_000_000,
      volume24hUsd: 18_400_000,
    }),
    token({
      mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
      symbol: "RAY",
      name: "Raydium",
      rationale:
        "A DeFi infrastructure token connected to one of Solana's established liquidity venues.",
      riskLabel: "higher",
      priceUsd: 3.17,
      priceChange24hPct: 1.72,
      marketCapUsd: 925_000_000,
      volume24hUsd: 46_200_000,
    }),
  ],
});

export const feedService: FeedService = {
  async loadFeed(signal) {
    await waitForMockResponse(signal);
    return mockResponse;
  },
};

function waitForMockResponse(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, 350);

    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Feed request aborted", "AbortError"));
      },
      { once: true },
    );
  });
}
