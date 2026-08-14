import type { FeedItem } from "@invest4fun/contracts";
import { describe, expect, it } from "vitest";
import { CuratedCatalogProvider } from "./catalog-provider.js";

const item: FeedItem = {
  id: "solana",
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
});
