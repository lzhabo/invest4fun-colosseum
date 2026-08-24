import type { Idea, IdeasResponse } from "@invest4fun/contracts";
import { type IdeasScheduler, IdeasVM } from "@src/screens/Ideas/IdeasVM";
import type { IdeasService } from "@src/services/ideas/IdeasService";
import type { BasketCommands } from "@src/stores/BasketStore";
import { describe, expect, it, vi } from "vitest";

const idea = {
  id: "idea-1",
  title: "Balanced Solana",
  description: "A prepared allocation.",
  riskLabel: "medium",
  status: "active",
  minimumInvestmentCents: 5000,
  source: { type: "curated", label: "Invest4Fun", url: null },
  version: {
    id: "version-1",
    version: 1,
    effectiveAt: "2026-08-24T12:00:00.000Z",
    totalWeightBps: 10000,
    components: [
      {
        assetId: "solana:So11111111111111111111111111111111111111112",
        symbol: "SOL",
        name: "Solana",
        weightBps: 10000,
        order: 0,
      },
    ],
  },
} satisfies Idea;

function setup(response: IdeasResponse = { items: [idea] }) {
  const service: IdeasService = {
    loadIdeas: vi.fn().mockResolvedValue(response),
  };
  const basket: BasketCommands = { add: vi.fn(), remove: vi.fn() };
  let scheduled: (() => void) | undefined;
  const scheduler: IdeasScheduler = {
    schedule: vi.fn((callback) => {
      scheduled = callback;
      return 1;
    }),
    cancel: vi.fn(),
  };
  const vm = new IdeasVM(service, basket, scheduler);
  return { vm, service, basket, scheduler, runScheduled: () => scheduled?.() };
}

describe("IdeasVM", () => {
  it("loads ideas and exposes a ready state", async () => {
    const { vm } = setup();
    vm.initialize();
    await vi.waitFor(() => expect(vm.getState().status).toBe("ready"));
    expect(vm.activeIdea?.id).toBe("idea-1");
  });

  it("adds an accepted idea and advances after feedback", async () => {
    const { vm, basket, runScheduled } = setup();
    vm.initialize();
    await vi.waitFor(() => expect(vm.getState().status).toBe("ready"));
    vm.decide("invest");
    expect(basket.add).toHaveBeenCalledWith(
      expect.objectContaining({ id: "idea-1", kind: "idea", amountUsd: 50 }),
    );
    expect(vm.getState().decision).toBe("invest");
    runScheduled();
    expect(vm.activeIdea).toBeUndefined();
  });

  it("cancels delayed updates when disposed", async () => {
    const { vm, scheduler } = setup();
    vm.initialize();
    await vi.waitFor(() => expect(vm.getState().status).toBe("ready"));
    vm.decide("skip");
    vm.dispose();
    expect(scheduler.cancel).toHaveBeenCalledWith(1);
  });

  it("supports retry after an API error", async () => {
    const service: IdeasService = {
      loadIdeas: vi
        .fn()
        .mockRejectedValueOnce(new Error("offline"))
        .mockResolvedValueOnce({ items: [idea] }),
    };
    const basket: BasketCommands = { add: vi.fn(), remove: vi.fn() };
    const vm = new IdeasVM(service, basket);
    vm.initialize();
    await vi.waitFor(() => expect(vm.getState().status).toBe("error"));
    vm.retry();
    await vi.waitFor(() => expect(vm.getState().status).toBe("ready"));
    vm.dispose();
  });

  it("restarts an interrupted load during a Strict Mode effect replay", async () => {
    let resolveFirst: ((response: IdeasResponse) => void) | undefined;
    const service: IdeasService = {
      loadIdeas: vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise<IdeasResponse>((resolve) => {
              resolveFirst = resolve;
            }),
        )
        .mockResolvedValueOnce({ items: [idea] }),
    };
    const basket: BasketCommands = { add: vi.fn(), remove: vi.fn() };
    const vm = new IdeasVM(service, basket);

    vm.initialize();
    vm.dispose();
    vm.initialize();

    await vi.waitFor(() => expect(vm.getState().status).toBe("ready"));
    expect(service.loadIdeas).toHaveBeenCalledTimes(2);
    resolveFirst?.({ items: [] });
    vm.dispose();
  });
});
