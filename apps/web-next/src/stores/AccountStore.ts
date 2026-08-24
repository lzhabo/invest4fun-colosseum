import type { AccountBootstrapResponse } from "@invest4fun/contracts";
import type { AccountService } from "@src/services/AccountService";
import type RootStore from "@src/stores/RootStore";
import { makeAutoObservable, runInAction } from "mobx";

export type AccountStatus = "idle" | "loading" | "ready" | "error";

export interface AccountWallet {
  address: string;
  kind: "embedded" | "external";
  name: string;
  provider: string;
  linked: boolean;
}

export interface PrivyAccountState {
  ready: boolean;
  authenticated: boolean;
  email: string | null;
  wallets: AccountWallet[];
  walletsReady: boolean;
}

interface AuthCommands {
  login(): void;
  logout(): Promise<void>;
  getAccessToken(): Promise<string | null>;
}

export default class AccountStore {
  public configured = false;
  public ready = true;
  public authenticated = false;
  public email: string | null = null;
  public providerWallets: AccountWallet[] = [];
  public walletsReady = true;
  public status: AccountStatus = "idle";
  public error: string | null = null;
  public account: AccountBootstrapResponse | null = null;

  private authCommands: AuthCommands | null = null;
  private bootstrapPromise: Promise<void> | null = null;

  constructor(
    public readonly rootStore: RootStore,
    private readonly service: AccountService,
  ) {
    makeAutoObservable<this, "service" | "authCommands" | "bootstrapPromise">(
      this,
      {
        rootStore: false,
        service: false,
        authCommands: false,
        bootstrapPromise: false,
      },
      { autoBind: true },
    );
  }

  public get accountReady(): boolean {
    return this.status === "ready";
  }

  public get wallets(): AccountWallet[] {
    if (!this.account) return this.providerWallets;

    return this.account.wallets
      .filter((wallet) => wallet.active)
      .map((wallet) => {
        const provider = formatWalletProvider(
          wallet.label ?? undefined,
          wallet.provider,
        );
        return {
          address: wallet.address,
          kind: wallet.role,
          name: wallet.role === "embedded" ? "Invest4Fun wallet" : provider,
          provider,
          linked: true,
        };
      })
      .sort(sortWallets);
  }

  public get portfolioWallet(): AccountWallet | undefined {
    return this.wallets.find((wallet) => wallet.kind === "embedded");
  }

  public setConfigured(configured: boolean) {
    this.configured = configured;
    if (!configured) this.resetSession();
  }

  public setAuthCommands(commands: AuthCommands | null) {
    this.authCommands = commands;
  }

  public updatePrivyState(state: PrivyAccountState) {
    this.ready = state.ready;
    this.authenticated = state.authenticated;
    this.email = state.email;
    this.providerWallets = state.wallets;
    this.walletsReady = state.walletsReady;

    if (state.ready && !state.authenticated) this.resetAccount();
  }

  public login() {
    this.authCommands?.login();
  }

  public async logout() {
    await this.authCommands?.logout();
    runInAction(() => this.resetSession());
  }

  public async refreshAccount() {
    if (!this.authenticated || !this.authCommands) return;
    if (this.bootstrapPromise) return this.bootstrapPromise;

    this.status = "loading";
    this.error = null;

    const bootstrapPromise = this.bootstrap();
    this.bootstrapPromise = bootstrapPromise;

    try {
      await bootstrapPromise;
    } finally {
      this.bootstrapPromise = null;
    }
  }

  private async bootstrap() {
    try {
      const accessToken = await this.authCommands?.getAccessToken();
      if (!accessToken) throw new Error("AUTH_TOKEN_UNAVAILABLE");
      const account = await this.service.bootstrap(accessToken);

      runInAction(() => {
        this.account = account;
        this.status = "ready";
      });
    } catch (error: unknown) {
      runInAction(() => {
        this.account = null;
        this.status = "error";
        this.error =
          error instanceof Error ? error.message : "ACCOUNT_BOOTSTRAP_FAILED";
      });
    }
  }

  private resetSession() {
    this.ready = true;
    this.authenticated = false;
    this.email = null;
    this.providerWallets = [];
    this.walletsReady = true;
    this.resetAccount();
  }

  private resetAccount() {
    this.account = null;
    this.status = "idle";
    this.error = null;
  }
}

function sortWallets(left: AccountWallet, right: AccountWallet): number {
  if (left.kind === right.kind) return 0;
  return left.kind === "embedded" ? -1 : 1;
}

export function formatWalletProvider(
  name: string | undefined,
  clientType: string | undefined,
): string {
  if (name) return name;
  if (!clientType) return "Solana wallet";
  if (clientType === "privy" || clientType === "privy-v2") return "Privy";
  return clientType
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
