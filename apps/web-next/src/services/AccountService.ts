import {
  type AccountBootstrapResponse,
  accountBootstrapResponseSchema,
} from "@invest4fun/contracts";
import { HttpError } from "@src/services/http/HttpError";

export interface AccountService {
  bootstrap(accessToken: string): Promise<AccountBootstrapResponse>;
}

export const accountService: AccountService = {
  async bootstrap(accessToken) {
    const response = await fetch("/api/auth/bootstrap", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new HttpError(response.status, "ACCOUNT_BOOTSTRAP_FAILED");
    }

    return accountBootstrapResponseSchema.parse(await response.json());
  },
};
