import type { FeedItem } from "@invest4fun/contracts";
import type { FeedService } from "@src/services/FeedService";
import type { BasketCommands } from "@src/stores/BasketStore";
import { makeAutoObservable, runInAction } from "mobx";

export type FeedStatus = "idle" | "loading" | "ready" | "error";
export type FeedDecision = "add" | "skip";

export interface FeedScheduler {
  schedule(callback: () => void, delayMs: number): number;
  cancel(timerId: number): void;
}

const browserScheduler: FeedScheduler = {
  schedule: (callback, delayMs) => window.setTimeout(callback, delayMs),
  cancel: (timerId) => window.clearTimeout(timerId),
};

export default class FeedStore {
  public status: FeedStatus = "idle";
  public items: FeedItem[] = [];
  public activeIndex = 0;
  public decision: FeedDecision | null = null;
  public dragX = 0;

  private request: AbortController | null = null;
  private decisionTimer: number | null = null;

  constructor(
    private readonly service: FeedService,
    private readonly basket: BasketCommands,
    private readonly scheduler: FeedScheduler = browserScheduler,
  ) {
    makeAutoObservable<this, "service" | "basket" | "scheduler" | "request">(
      this,
      {
        service: false,
        basket: false,
        scheduler: false,
        request: false,
      },
      { autoBind: true },
    );
  }

  public get activeItem(): FeedItem | undefined {
    return this.items[this.activeIndex];
  }

  public initialize() {
    if (this.status === "loading") {
      this.request?.abort();
      this.status = "idle";
    }
    if (this.status !== "idle") return;
    void this.load();
  }

  public retry() {
    if (this.status !== "error") return;
    void this.load();
  }

  public restart() {
    this.activeIndex = 0;
    this.decision = null;
    this.dragX = 0;
  }

  public setDragX(value: number) {
    if (this.decision) return;
    this.dragX = Math.max(-140, Math.min(140, value));
  }

  public finishDrag(distance: number) {
    this.dragX = 0;
    if (Math.abs(distance) >= 72) this.decide(distance > 0 ? "add" : "skip");
  }

  public decide(decision: FeedDecision) {
    const item = this.activeItem;
    if (!item || this.decision) return;

    if (decision === "add" && item.eligibility.executable) {
      this.basket.add({
        id: item.id,
        title: `${item.symbol} · ${item.name}`,
        kind: "asset",
        amountUsd: 10,
      });
    }

    this.decision = decision;
    this.decisionTimer = this.scheduler.schedule(() => {
      runInAction(() => {
        this.activeIndex += 1;
        this.decision = null;
        this.dragX = 0;
        this.decisionTimer = null;
      });
    }, 300);
  }

  public dispose() {
    this.request?.abort();
    this.request = null;
    if (this.decisionTimer !== null) this.scheduler.cancel(this.decisionTimer);
    this.decisionTimer = null;
  }

  private async load() {
    this.request?.abort();
    const request = new AbortController();
    this.request = request;
    this.status = "loading";

    try {
      const response = await this.service.loadFeed(request.signal);
      if (request.signal.aborted) return;
      runInAction(() => {
        this.items = response.items;
        this.activeIndex = 0;
        this.status = "ready";
      });
    } catch {
      if (!request.signal.aborted) {
        runInAction(() => {
          this.status = "error";
        });
      }
    } finally {
      if (this.request === request) this.request = null;
    }
  }
}
