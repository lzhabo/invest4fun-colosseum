import {
  PrivyProvider as PrivyReactProvider,
  useLogin,
  usePrivy,
  useWallets as usePrivyWallets,
} from "@privy-io/react-auth";
import {
  toSolanaWalletConnectors,
  useWallets as useSolanaWallets,
} from "@privy-io/react-auth/solana";
import { useStores } from "@src/stores";
import {
  type AccountWallet,
  formatWalletProvider,
} from "@src/stores/AccountStore";
import { type PropsWithChildren, useCallback, useEffect, useMemo } from "react";

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID as string | undefined;

export function PrivyProvider({ children }: PropsWithChildren) {
  if (!privyAppId) {
    return <MissingPrivyConfiguration>{children}</MissingPrivyConfiguration>;
  }

  return (
    <PrivyReactProvider
      appId={privyAppId}
      config={{
        loginMethods: ["email", "wallet"],
        appearance: {
          theme: "light",
          accentColor: "#6952e8",
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
      <PrivyBridge>{children}</PrivyBridge>
    </PrivyReactProvider>
  );
}

function MissingPrivyConfiguration({ children }: PropsWithChildren) {
  const { accountStore } = useStores();

  useEffect(() => {
    accountStore.setConfigured(false);
  }, [accountStore]);

  return children;
}

function PrivyBridge({ children }: PropsWithChildren) {
  const { accountStore } = useStores();
  const { ready, authenticated, user, logout, getAccessToken } = usePrivy();
  const { wallets: allWallets, ready: allWalletsReady } = usePrivyWallets();
  const { wallets: solanaWallets, ready: solanaWalletsReady } =
    useSolanaWallets();

  const { login } = useLogin({
    onComplete: () => void accountStore.refreshAccount(),
  });

  const loginWithSolana = useCallback(() => {
    login({
      loginMethods: ["email", "wallet"],
      walletChainType: "solana-only",
    });
  }, [login]);

  const logoutFromPrivy = useCallback(async () => {
    await logout();
  }, [logout]);

  const wallets = useMemo<AccountWallet[]>(
    () =>
      solanaWallets
        .map((wallet) => {
          const details = allWallets.find(
            (candidate) => candidate.address === wallet.address,
          );
          const clientType = details?.walletClientType;
          const kind: AccountWallet["kind"] =
            clientType === "privy" || clientType === "privy-v2"
              ? "embedded"
              : "external";
          const provider = formatWalletProvider(
            details?.meta?.name,
            clientType,
          );

          return {
            address: wallet.address,
            kind,
            name: kind === "embedded" ? "Invest4Fun wallet" : provider,
            provider,
            linked: details?.linked ?? true,
          };
        })
        .sort((left, right) => {
          if (left.kind === right.kind) return 0;
          return left.kind === "embedded" ? -1 : 1;
        }),
    [allWallets, solanaWallets],
  );

  useEffect(() => {
    accountStore.setConfigured(true);
    accountStore.setAuthCommands({
      login: loginWithSolana,
      logout: logoutFromPrivy,
      getAccessToken,
    });

    return () => accountStore.setAuthCommands(null);
  }, [accountStore, getAccessToken, loginWithSolana, logoutFromPrivy]);

  useEffect(() => {
    accountStore.updatePrivyState({
      ready,
      authenticated,
      email: user?.email?.address ?? null,
      wallets,
      walletsReady: allWalletsReady && solanaWalletsReady,
    });
  }, [
    accountStore,
    allWalletsReady,
    authenticated,
    ready,
    solanaWalletsReady,
    user?.email?.address,
    wallets,
  ]);

  useEffect(() => {
    if (ready && authenticated && accountStore.status === "idle") {
      void accountStore.refreshAccount();
    }
  }, [accountStore, authenticated, ready]);

  return children;
}
