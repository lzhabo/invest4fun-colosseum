import { type Idea, ideaSchema } from "@invest4fun/contracts";

export interface IdeasProvider {
  getItems(): Promise<Idea[]>;
}

export class CuratedIdeasProvider implements IdeasProvider {
  private readonly items: Idea[];

  constructor(items: Idea[]) {
    this.items = items.map((item) => ideaSchema.parse(structuredClone(item)));
  }

  async getItems() {
    return this.items.map((item) => structuredClone(item));
  }
}
