import type { JsonStorage } from "@src/services/storage/JsonStorage";
import { makeAutoObservable } from "mobx";

export type BasketEntryKind = "asset" | "idea";

export interface BasketEntry {
  id: string;
  title: string;
  kind: BasketEntryKind;
  amountUsd: number;
}

export interface BasketCommands {
  add(entry: BasketEntry): void;
  remove(id: string, kind: BasketEntryKind): void;
}

export class BasketStore implements BasketCommands {
  public entries: BasketEntry[];

  constructor(private readonly storage: JsonStorage<BasketEntry[]>) {
    this.entries = storage.load();
    makeAutoObservable<this, "storage">(
      this,
      { storage: false },
      { autoBind: true },
    );
  }

  add(entry: BasketEntry) {
    const existing = this.entries.find(
      (candidate) => candidate.id === entry.id && candidate.kind === entry.kind,
    );
    const entries = existing
      ? this.entries.map((candidate) =>
          candidate === existing
            ? { ...candidate, amountUsd: candidate.amountUsd + entry.amountUsd }
            : candidate,
        )
      : [...this.entries, entry];
    this.update(entries);
  }

  remove(id: string, kind: BasketEntryKind) {
    this.update(
      this.entries.filter((entry) => entry.id !== id || entry.kind !== kind),
    );
  }

  private update(entries: BasketEntry[]) {
    this.entries = entries;
    this.storage.save(entries);
  }
}
