import {
  type AccountBootstrapResponse,
  accountBootstrapResponseSchema,
} from "@invest4fun/contracts";
import {
  PrivyProvider,
  type User,
  useLogin,
  usePrivy,
  useWallets as usePrivyWallets,
} from "@privy-io/react-auth";
import {
  toSolanaWalletConnectors,
  useWallets as useSolanaWallets,
} from "@privy-io/react-auth/solana";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AccountBootstrapStatus = "idle" | "loading" | "ready" | "error";

type AuthState = {
  configured: boolean;
  ready: boolean;
  authenticated: boolean;
  user: User | null;
  login: () => void;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  wallets: WalletSummary[];
  walletsReady: boolean;
  accountReady: boolean;
  accountStatus: AccountBootstrapStatus;
  accountError: string | null;
  refreshAccount: () => Promise<void>;
};

export type WalletSummary = {
  address: string;
  kind: "embedded" | "external";
  name: string;
  provider: string;
  linked: boolean;
};

const demoAuth: AuthState = {
  configured: false,
  ready: true,
  authenticated: false,
  user: null,
  login: () => undefined,
  logout: async () => undefined,
  getAccessToken: async () => null,
  wallets: [],
  walletsReady: true,
  accountReady: true,
  accountStatus: "idle",
  accountError: null,
  refreshAccount: async () => undefined,
};

const AuthContext = createContext<AuthState>(demoAuth);
const privyAppId = import.meta.env.VITE_PRIVY_APP_ID as string | undefined;

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!privyAppId) {
    return (
      <AuthContext.Provider value={demoAuth}>{children}</AuthContext.Provider>
    );
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ["email", "wallet"],
        appearance: {
          theme: "light",
          accentColor: "#baff00",
          walletChainType: "solana-only",
          walletList: [
            "phantom",
            "solflare",
            "backpack",
            "jupiter",
            "detected_solana_wallets",
            "wallet_connect_qr_solana",
          ],
          showWalletLoginFirst: false,
        },
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors({ shouldAutoConnect: false }),
          },
        },
        embeddedWallets: { solana: { createOnLogin: "all-users" } },
      }}
    >
      <PrivyAuthBridge>{children}</PrivyAuthBridge>
    </PrivyProvider>
  );
}

function PrivyAuthBridge({ children }: { children: ReactNode }) {
  const { ready, authenticated, user, logout, getAccessToken } = usePrivy();
  const { wallets: allWallets, ready: allWalletsReady } = usePrivyWallets();
  const { wallets: solanaWallets, ready: solanaWalletsReady } =
    useSolanaWallets();
  const [accountStatus, setAccountStatus] =
    useState<AccountBootstrapStatus>("idle");
  const [accountError, setAccountError] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountBootstrapResponse | null>(null);

  const bootstrapAccount = useCallback(async () => {
    setAccountStatus("loading");
    setAccountError(null);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("AUTH_TOKEN_UNAVAILABLE");
      const response = await fetch("/api/auth/bootstrap", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error("ACCOUNT_BOOTSTRAP_FAILED");
      const account = accountBootstrapResponseSchema.parse(
        await response.json(),
      );
      setAccount(account);
      setAccountStatus("ready");
    } catch (error) {
      setAccount(null);
      setAccountStatus("error");
      setAccountError(
        error instanceof Error ? error.message : "ACCOUNT_BOOTSTRAP_FAILED",
      );
    }
  }, [getAccessToken]);

  const { login } = useLogin({
    onComplete: async () => {
      await bootstrapAccount();
    },
  });

  const loginWithLegacyFlow = () => {
    login({
      loginMethods: ["email", "wallet"],
      walletChainType: "solana-only",
    });
  };

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      setAccountStatus("idle");
      setAccountError(null);
      setAccount(null);
      return;
    }
    void bootstrapAccount();
  }, [authenticated, bootstrapAccount, ready]);

  const wallets = useMemo<WalletSummary[]>(
    () =>
      account
        ? account.wallets
            .filter((wallet) => wallet.active)
            .map((wallet) => {
              const provider = formatWalletProvider(
                wallet.label ?? undefined,
                wallet.provider,
              );
              return {
                address: wallet.address,
                kind: wallet.role,
                name:
                  wallet.role === "embedded" ? "Invest4Fun wallet" : provider,
                provider,
                linked: true,
              };
            })
            .sort((left, right) => {
              if (left.kind === right.kind) return 0;
              return left.kind === "embedded" ? -1 : 1;
            })
        : solanaWallets
            .map((wallet) => {
              const walletDetails = allWallets.find(
                (candidate) => candidate.address === wallet.address,
              );
              const walletClientType = walletDetails?.walletClientType;
              const kind: WalletSummary["kind"] =
                walletClientType === "privy" || walletClientType === "privy-v2"
                  ? "embedded"
                  : "external";
              const provider = formatWalletProvider(
                walletDetails?.meta?.name,
                walletClientType,
              );
              return {
                address: wallet.address,
                kind,
                name: kind === "embedded" ? "Invest4Fun wallet" : provider,
                provider,
                linked: walletDetails?.linked ?? true,
              };
            })
            .sort((left, right) => {
              if (left.kind === right.kind) return 0;
              return left.kind === "embedded" ? -1 : 1;
            }),
    [account, allWallets, solanaWallets],
  );

  return (
    <AuthContext.Provider
      value={{
        configured: true,
        ready,
        authenticated,
        user,
        login: loginWithLegacyFlow,
        logout,
        getAccessToken,
        wallets,
        walletsReady: allWalletsReady && solanaWalletsReady,
        accountReady: accountStatus === "ready",
        accountStatus,
        accountError,
        refreshAccount: bootstrapAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

function formatWalletProvider(
  name: string | undefined,
  clientType: string | undefined,
) {
  if (name) return name;
  if (!clientType) return "Solana wallet";
  if (clientType === "privy" || clientType === "privy-v2") return "Privy";
  return clientType
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
