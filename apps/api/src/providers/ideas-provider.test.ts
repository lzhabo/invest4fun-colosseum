import type { Idea } from "@invest4fun/contracts";
import { describe, expect, it } from "vitest";
import { feedItems } from "../catalog.js";
import { CuratedIdeasProvider } from "./ideas-provider.js";

const asset = feedItems.find((item) => item.eligibility.executable);
if (!asset) throw new Error("EXECUTABLE_ASSET_FIXTURE_MISSING");

const idea: Idea = {
  id: "test-idea",
  title: "Test idea",
  subtitle: "A test allocation",
  description: "A curated test idea.",
  details: "Used to verify idea provider validation.",
  riskLabel: "medium",
  status: "active",
  minimumInvestmentCents: 1_000,
  source: {
    type: "curated",
    label: "Test catalog",
    url: null,
  },
  version: {
    id: "test-idea:v1",
    version: 1,
    effectiveAt: "2026-08-20T00:00:00.000Z",
    totalWeightBps: 10_000,
    components: [
      {
        assetId: asset.canonicalId,
        symbol: asset.symbol,
        name: asset.name,
        iconUrl: asset.iconUrl ?? null,
        weightBps: 10_000,
        order: 0,
      },
    ],
  },
};
const component = idea.version.components[0];
if (!component) throw new Error("IDEA_COMPONENT_FIXTURE_MISSING");

describe("CuratedIdeasProvider", () => {
  it("returns validated copies of versioned ideas", async () => {
    const provider = new CuratedIdeasProvider([idea]);
    const first = await provider.getItems();
    const firstIdea = first[0];
    if (!firstIdea) throw new Error("IDEA_MISSING");
    firstIdea.title = "Changed";

    const second = await provider.getItems();

    expect(second[0]?.title).toBe("Test idea");
    expect(second[0]?.version.components[0]?.assetId).toBe(asset.canonicalId);
  });

  it("rejects idea versions with invalid total weights", () => {
    expect(
      () =>
        new CuratedIdeasProvider([
          {
            ...idea,
            version: {
              ...idea.version,
              components: [
                {
                  ...component,
                  weightBps: 9_000,
                },
              ],
            },
          },
        ]),
    ).toThrow();
  });

  it("rejects components whose assetId is not a canonical Solana id", () => {
    expect(
      () =>
        new CuratedIdeasProvider([
          {
            ...idea,
            version: {
              ...idea.version,
              components: [
                {
                  ...component,
                  assetId: "not-a-canonical-asset-id",
                },
              ],
            },
          },
        ]),
    ).toThrow();
  });
});
