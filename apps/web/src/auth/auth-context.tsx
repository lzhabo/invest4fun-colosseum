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
import { createContext, type ReactNode, useContext } from "react";

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
          walletChainType: "solana-only",
          showWalletLoginFirst: true,
        },
        externalWallets: { solana: { connectors: toSolanaWalletConnectors() } },
        embeddedWallets: { solana: { createOnLogin: "users-without-wallets" } },
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
  const { login } = useLogin({
    onComplete: async () => {
      const accessToken = await getAccessToken();
      if (!accessToken) return;
      await fetch("/api/auth/bootstrap", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        configured: true,
        ready,
        authenticated,
        user,
        login,
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
