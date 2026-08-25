import type { FeedItem, FeedResponse } from "@invest4fun/contracts";
import type { FeedService } from "@src/services/FeedService";
import type { BasketCommands } from "@src/stores/BasketStore";
import FeedStore, { type FeedScheduler } from "@src/stores/FeedStore";
import { describe, expect, it, vi } from "vitest";

const item = {
  id: "solana:So11111111111111111111111111111111111111112",
  canonicalId: "solana:So11111111111111111111111111111111111111112",
  chain: "solana",
  mint: "So11111111111111111111111111111111111111112",
  assetType: "token",
  symbol: "SOL",
  name: "Solana",
  rationale: "The native Solana asset.",
  riskLabel: "higher",
  sourceLabel: "Mock catalog",
  marketDataSource: "curated",
  marketDataUpdatedAt: "2026-08-24T12:00:00.000Z",
  marketDataStatus: "fresh",
  marketDataAsOf: "2026-08-24T12:00:00.000Z",
  marketDataExpiresAt: "2026-08-25T12:00:00.000Z",
  priceUsd: 146.82,
  eligibility: {
    tradable: true,
    executable: true,
    reasonCodes: [],
    policyVersion: "mock-feed-v1",
    checkedAt: "2026-08-24T00:00:00.000Z",
  },
  market: {
    source: "curated",
    status: "fresh",
    asOf: "2026-08-24T12:00:00.000Z",
    expiresAt: "2026-08-25T12:00:00.000Z",
  },
} satisfies FeedItem;

const response: FeedResponse = {
  sessionId: "6a261116-9874-4cec-a1db-bfaeeef8441f",
  generatedAt: "2026-08-24T12:00:00.000Z",
  expiresAt: "2026-08-25T12:00:00.000Z",
  items: [item],
};

function setup(serviceResponse: FeedResponse = response) {
  const service: FeedService = {
    loadFeed: vi.fn().mockResolvedValue(serviceResponse),
  };
  const basket: BasketCommands = { add: vi.fn(), remove: vi.fn() };
  let scheduled: (() => void) | undefined;
  const scheduler: FeedScheduler = {
    schedule: vi.fn((callback) => {
      scheduled = callback;
      return 1;
    }),
    cancel: vi.fn(),
  };
  const store = new FeedStore(service, basket, scheduler);

  return {
    store,
    service,
    basket,
    scheduler,
    runScheduled: () => scheduled?.(),
  };
}

describe("FeedStore", () => {
  it("loads feed items from the service", async () => {
    const { store, service } = setup();

    store.initialize();

    await vi.waitFor(() => expect(store.status).toBe("ready"));
    expect(service.loadFeed).toHaveBeenCalledOnce();
    expect(store.activeItem?.symbol).toBe("SOL");
  });

  it("adds an accepted token to the basket and advances", async () => {
    const { store, basket, runScheduled } = setup();
    store.initialize();
    await vi.waitFor(() => expect(store.status).toBe("ready"));

    store.decide("add");

    expect(basket.add).toHaveBeenCalledWith({
      id: item.id,
      title: "SOL · Solana",
      kind: "asset",
      amountUsd: 10,
    });
    expect(store.decision).toBe("add");
    runScheduled();
    expect(store.activeItem).toBeUndefined();
  });

  it("skips a token without changing the basket", async () => {
    const { store, basket, runScheduled } = setup();
    store.initialize();
    await vi.waitFor(() => expect(store.status).toBe("ready"));

    store.decide("skip");
    runScheduled();

    expect(basket.add).not.toHaveBeenCalled();
    expect(store.activeItem).toBeUndefined();
  });

  it("cancels delayed updates when disposed", async () => {
    const { store, scheduler } = setup();
    store.initialize();
    await vi.waitFor(() => expect(store.status).toBe("ready"));

    store.decide("skip");
    store.dispose();

    expect(scheduler.cancel).toHaveBeenCalledWith(1);
  });

  it("restarts an interrupted load during Strict Mode effect replay", async () => {
    const service: FeedService = {
      loadFeed: vi
        .fn()
        .mockImplementationOnce(() => new Promise<FeedResponse>(() => {}))
        .mockResolvedValueOnce(response),
    };
    const basket: BasketCommands = { add: vi.fn(), remove: vi.fn() };
    const store = new FeedStore(service, basket);

    store.initialize();
    store.dispose();
    store.initialize();

    await vi.waitFor(() => expect(store.status).toBe("ready"));
    expect(service.loadFeed).toHaveBeenCalledTimes(2);
  });
});
