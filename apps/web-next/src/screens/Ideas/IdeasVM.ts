import type { Idea } from "@invest4fun/contracts";
import type { IdeasService } from "@src/services/ideas/IdeasService";
import type { BasketCommands } from "@src/stores/BasketStore";
import { makeAutoObservable } from "mobx";

export type IdeasStatus = "idle" | "loading" | "ready" | "error";
export type IdeasDecision = "invest" | "skip";

export interface IdeasState {
  status: IdeasStatus;
  ideas: Idea[];
  activeIndex: number;
  decision: IdeasDecision | undefined;
  dragX: number;
}

export interface IdeasScheduler {
  schedule(callback: () => void, delayMs: number): number;
  cancel(timerId: number): void;
}

const browserScheduler: IdeasScheduler = {
  schedule: (callback, delayMs) => window.setTimeout(callback, delayMs),
  cancel: (timerId) => window.clearTimeout(timerId),
};

export class IdeasVM {
  private state: IdeasState = {
    status: "idle",
    ideas: [],
    activeIndex: 0,
    decision: undefined,
    dragX: 0,
  };
  private request: AbortController | undefined;
  private decisionTimer: number | undefined;
  private disposed = false;

  constructor(
    private readonly service: IdeasService,
    private readonly basket: BasketCommands,
    private readonly scheduler: IdeasScheduler = browserScheduler,
  ) {
    makeAutoObservable<
      this,
      | "service"
      | "basket"
      | "scheduler"
      | "request"
      | "decisionTimer"
      | "disposed"
    >(
      this,
      {
        service: false,
        basket: false,
        scheduler: false,
        request: false,
        decisionTimer: false,
        disposed: false,
      },
      { autoBind: true },
    );
  }

  getState = () => this.state;

  get activeIdea(): Idea | undefined {
    return this.state.ideas[this.state.activeIndex];
  }

  initialize() {
    this.disposed = false;
    if (this.state.status === "loading") {
      this.request?.abort();
      this.state = { ...this.state, status: "idle" };
    }
    if (this.state.status !== "idle") return;
    void this.load();
  }

  retry() {
    if (this.state.status !== "error") return;
    void this.load();
  }

  setDragX(value: number) {
    if (this.state.decision) return;
    this.patch({ dragX: Math.max(-140, Math.min(140, value)) });
  }

  finishDrag(distance: number) {
    this.patch({ dragX: 0 });
    if (Math.abs(distance) >= 72) this.decide(distance > 0 ? "invest" : "skip");
  }

  decide(decision: IdeasDecision) {
    const activeIdea = this.activeIdea;
    if (!activeIdea || this.state.decision) return;

    if (decision === "invest") {
      this.basket.add({
        id: activeIdea.id,
        title: activeIdea.title,
        kind: "idea",
        amountUsd: 50,
      });
    }

    this.patch({ decision });
    this.decisionTimer = this.scheduler.schedule(() => {
      if (this.disposed) return;
      this.patch({
        activeIndex: this.state.activeIndex + 1,
        decision: undefined,
        dragX: 0,
      });
      this.decisionTimer = undefined;
    }, 300);
  }

  dispose() {
    this.disposed = true;
    this.request?.abort();
    this.request = undefined;
    if (this.decisionTimer !== undefined)
      this.scheduler.cancel(this.decisionTimer);
  }

  private async load() {
    this.request?.abort();
    const request = new AbortController();
    this.request = request;
    this.patch({ status: "loading" });

    try {
      const response = await this.service.loadIdeas(request.signal);
      if (!request.signal.aborted && !this.disposed) {
        this.patch({ status: "ready", ideas: response.items, activeIndex: 0 });
      }
    } catch {
      if (!request.signal.aborted && !this.disposed)
        this.patch({ status: "error" });
    }
  }

  private patch(patch: Partial<IdeasState>) {
    this.state = { ...this.state, ...patch };
  }
}
