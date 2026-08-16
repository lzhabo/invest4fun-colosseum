import { accountBootstrapResponseSchema } from "@invest4fun/contracts";
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
  useContext,
  useEffect,
  useState,
} from "react";

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
};

export type WalletSummary = {
  address: string;
  kind: "embedded" | "external";
  name: string;
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
  const [accountReady, setAccountReady] = useState(false);
  const { login } = useLogin({
    onComplete: async () => {
      const accessToken = await getAccessToken();
      if (!accessToken) return;
      const response = await fetch("/api/auth/bootstrap", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error("ACCOUNT_BOOTSTRAP_FAILED");
      accountBootstrapResponseSchema.parse(await response.json());
      setAccountReady(true);
    },
  });

  const loginWithLegacyFlow = () => {
    login({
      loginMethods: ["email", "wallet"],
      walletChainType: "solana-only",
    });
  };

  useEffect(() => {
    if (!authenticated) {
      setAccountReady(false);
      return;
    }
    void (async () => {
      const accessToken = await getAccessToken();
      if (!accessToken) return;
      const response = await fetch("/api/auth/bootstrap", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) return;
      accountBootstrapResponseSchema.parse(await response.json());
      setAccountReady(true);
    })();
  }, [authenticated, getAccessToken]);

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
        wallets: solanaWallets.map((wallet) => {
          const walletDetails = allWallets.find(
            (candidate) => candidate.address === wallet.address,
          );
          const walletClientType = walletDetails?.walletClientType;
          return {
            address: wallet.address,
            kind:
              walletClientType === "privy" || walletClientType === "privy-v2"
                ? "embedded"
                : "external",
            name:
              walletDetails?.meta?.name ?? walletClientType ?? "Solana wallet",
            linked: walletDetails?.linked ?? true,
          };
        }),
        walletsReady: allWalletsReady && solanaWalletsReady,
        accountReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
