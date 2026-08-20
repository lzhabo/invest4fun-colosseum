import type { FeedItem } from "@invest4fun/contracts";

export interface FeedCatalogProvider {
  getItems(): Promise<FeedItem[]>;
}

export class CuratedCatalogProvider implements FeedCatalogProvider {
  private readonly items: FeedItem[];

  constructor(items: FeedItem[]) {
    this.items = items.map((item) => ({ ...item }));
  }

  async getItems() {
    return this.items.map((item) => ({ ...item }));
  }
}
