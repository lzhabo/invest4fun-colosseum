import { accountService } from "@src/services/AccountService";
import { createVersionedJsonStorage } from "@src/services/storage/JsonStorage";
import AccountStore from "@src/stores/AccountStore";
import { BasketStore } from "@src/stores/BasketStore";
import { z } from "zod";

const basketEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: z.enum(["asset", "idea"]),
  amountUsd: z.number().positive(),
});

export default class RootStore {
  public readonly accountStore: AccountStore;
  public readonly basketStore: BasketStore;

  constructor() {
    this.accountStore = new AccountStore(this, accountService);
    this.basketStore = new BasketStore(
      createVersionedJsonStorage({
        key: "invest4fun:web-next:basket",
        version: 1,
        fallback: [],
        parse: (value) => basketEntrySchema.array().parse(value),
      }),
    );
  }
}
