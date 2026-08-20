import { type FeedItem, feedItemSchema } from "@invest4fun/contracts";
import { describe, expect, it } from "vitest";
import { CuratedCatalogProvider } from "./catalog-provider.js";

const item: FeedItem = {
  id: "solana:So11111111111111111111111111111111111111112",
  canonicalId: "solana:So11111111111111111111111111111111111111112",
  chain: "solana",
  mint: "So11111111111111111111111111111111111111112",
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

describe("CuratedCatalogProvider", () => {
  it("returns a copy of canonical catalog items", async () => {
    const provider = new CuratedCatalogProvider([item]);
    const first = await provider.getItems();
    const firstItem = first[0];
    if (!firstItem) throw new Error("CATALOG_ITEM_MISSING");
    firstItem.symbol = "changed";

    const second = await provider.getItems();
    const secondItem = second[0];
    expect(secondItem?.symbol).toBe("SOL");
    expect(secondItem?.mint).toBe(item.mint);
  });

  it("keeps duplicate symbols distinct by canonical id", async () => {
    const provider = new CuratedCatalogProvider([
      item,
      {
        ...item,
        id: "solana:Dupe111111111111111111111111111111111111111",
        canonicalId: "solana:Dupe111111111111111111111111111111111111111",
        mint: "Dupe111111111111111111111111111111111111111",
        name: "Duplicate Symbol Asset",
      },
    ]);

    const items = await provider.getItems();

    expect(items.map((asset) => asset.symbol)).toEqual(["SOL", "SOL"]);
    expect(new Set(items.map((asset) => asset.id)).size).toBe(2);
    expect(new Set(items.map((asset) => asset.mint)).size).toBe(2);
  });

  it("rejects executable assets without canonical Solana identity", () => {
    const parsed = feedItemSchema.safeParse({
      ...item,
      id: "product-placeholder:unsafe",
      canonicalId: "product-placeholder:unsafe",
      assetType: "stock",
      mint: null,
      eligibility: {
        tradable: true,
        executable: true,
        reasonCodes: [],
        policyVersion: "test",
        checkedAt: "2026-08-20T00:00:00.000Z",
      },
    });

    expect(parsed.success).toBe(false);
  });
});
