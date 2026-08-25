import type { AccountBootstrapResponse } from "@invest4fun/contracts";
import type { AccountService } from "@src/services/AccountService";
import AccountStore from "@src/stores/AccountStore";
import type RootStore from "@src/stores/RootStore";
import { describe, expect, it, vi } from "vitest";

const account: AccountBootstrapResponse = {
  user: {
    id: "11111111-1111-4111-8111-111111111111",
    status: "active",
  },
  identity: {
    provider: "privy",
    externalSubject: "did:privy:user-1",
  },
  wallets: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      chain: "solana",
      address: "So11111111111111111111111111111111111111112",
      role: "embedded",
      provider: "privy",
      label: null,
      active: true,
    },
  ],
};

function setup(service: AccountService) {
  const store = new AccountStore({} as RootStore, service);
  const commands = {
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    getAccessToken: vi.fn().mockResolvedValue("access-token"),
  };

  store.setConfigured(true);
  store.setAuthCommands(commands);
  store.updatePrivyState({
    ready: true,
    authenticated: true,
    email: "person@example.com",
    wallets: [],
    walletsReady: true,
  });

  return { store, commands };
}

describe("AccountStore", () => {
  it("bootstraps the internal account with a Privy access token", async () => {
    const service: AccountService = {
      bootstrap: vi.fn().mockResolvedValue(account),
    };
    const { store, commands } = setup(service);

    await store.refreshAccount();

    expect(commands.getAccessToken).toHaveBeenCalledOnce();
    expect(service.bootstrap).toHaveBeenCalledWith("access-token");
    expect(store.status).toBe("ready");
    expect(store.portfolioWallet?.kind).toBe("embedded");
  });

  it("does not start duplicate bootstrap requests", async () => {
    let resolveBootstrap:
      | ((value: AccountBootstrapResponse) => void)
      | undefined;
    const service: AccountService = {
      bootstrap: vi.fn(
        () =>
          new Promise<AccountBootstrapResponse>((resolve) => {
            resolveBootstrap = resolve;
          }),
      ),
    };
    const { store } = setup(service);

    const first = store.refreshAccount();
    const second = store.refreshAccount();
    await vi.waitFor(() => expect(service.bootstrap).toHaveBeenCalledOnce());
    resolveBootstrap?.(account);
    await Promise.all([first, second]);

    expect(service.bootstrap).toHaveBeenCalledOnce();
    expect(store.status).toBe("ready");
  });

  it("exposes bootstrap errors and allows retry", async () => {
    const service: AccountService = {
      bootstrap: vi
        .fn()
        .mockRejectedValueOnce(new Error("ACCOUNT_BOOTSTRAP_FAILED"))
        .mockResolvedValueOnce(account),
    };
    const { store } = setup(service);

    await store.refreshAccount();
    expect(store.status).toBe("error");
    expect(store.error).toBe("ACCOUNT_BOOTSTRAP_FAILED");

    await store.refreshAccount();
    expect(store.status).toBe("ready");
  });

  it("logs out through Privy and clears local account state", async () => {
    const service: AccountService = {
      bootstrap: vi.fn().mockResolvedValue(account),
    };
    const { store, commands } = setup(service);
    await store.refreshAccount();

    await store.logout();

    expect(commands.logout).toHaveBeenCalledOnce();
    expect(store.authenticated).toBe(false);
    expect(store.account).toBeNull();
    expect(store.status).toBe("idle");

    store.login();
    expect(commands.login).toHaveBeenCalledOnce();
  });
});
