import { useStores } from "@src/stores";
import {
  Check,
  CircleUserRound,
  Copy,
  ExternalLink,
  LogIn,
  LogOut,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

const Page = styled.main`
  width: min(920px, calc(100% - 32px));
  margin: 0 auto;
  padding: clamp(48px, 8vw, 96px) 0;
`;

const Heading = styled.header`
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  h1 {
    margin: 8px 0 12px;
    font-size: clamp(2.8rem, 8vw, 5.8rem);
    line-height: 0.92;
    letter-spacing: -0.07em;
  }

  p {
    max-width: 660px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Panel = styled.section`
  padding: clamp(22px, 5vw, 38px);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const PanelHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  svg {
    width: 28px;
    height: 28px;
  }

  h2,
  p {
    margin: 0;
  }

  p {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const WalletRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px 16px;
  padding: 18px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  code,
  small {
    min-width: 0;
    overflow: hidden;
    color: ${({ theme }) => theme.colors.textMuted};
    text-overflow: ellipsis;
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  grid-column: 2;
  grid-row: 1 / span 2;

  a,
  button {
    display: grid;
    width: 38px;
    height: 38px;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.canvas};
    color: ${({ theme }) => theme.colors.text};
    cursor: pointer;
  }
`;

const Button = styled.button<{ $secondary?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding: 0 18px;
  border: 1px solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $secondary, theme }) =>
    $secondary ? "transparent" : theme.colors.ink};
  color: ${({ $secondary, theme }) =>
    $secondary ? theme.colors.ink : theme.colors.canvas};
  cursor: pointer;
`;

export const AccountPage = observer(function AccountPage() {
  const { accountStore } = useStores();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const copyTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      if (copyTimer.current !== undefined)
        window.clearTimeout(copyTimer.current);
    },
    [],
  );

  async function copyAddress(address: string) {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      if (copyTimer.current !== undefined)
        window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopiedAddress(null), 1500);
    } catch {
      setCopiedAddress(null);
    }
  }

  return (
    <Page>
      <Heading>
        <span>Identity and access</span>
        <h1>Account</h1>
        <p>
          Privy manages authentication and wallet custody. Invest4Fun keeps its
          own internal user and wallet roles behind the API.
        </p>
      </Heading>

      {!accountStore.configured ? (
        <Panel>
          <PanelHeading>
            <CircleUserRound aria-hidden="true" />
            <div>
              <h2>Privy is not configured</h2>
              <p>Set VITE_PRIVY_APP_ID to enable account login.</p>
            </div>
          </PanelHeading>
        </Panel>
      ) : !accountStore.ready ? (
        <Panel role="status">
          <PanelHeading>
            <CircleUserRound aria-hidden="true" />
            <div>
              <h2>Restoring Privy session</h2>
              <p>Your account will appear when Privy is ready.</p>
            </div>
          </PanelHeading>
        </Panel>
      ) : !accountStore.authenticated ? (
        <Panel>
          <PanelHeading>
            <CircleUserRound aria-hidden="true" />
            <div>
              <h2>Sign in to Invest4Fun</h2>
              <p>Use email or an existing Solana wallet.</p>
            </div>
          </PanelHeading>
          <Button type="button" onClick={() => accountStore.login()}>
            <LogIn size={18} /> Sign in with Privy
          </Button>
        </Panel>
      ) : (
        <Panel>
          <PanelHeading>
            <CircleUserRound aria-hidden="true" />
            <div>
              <h2>{accountStore.email ?? "Invest4Fun user"}</h2>
              <p>
                {accountStore.status === "ready"
                  ? "Internal account restored"
                  : accountStore.status === "error"
                    ? "Internal account restore failed"
                    : "Restoring internal account"}
              </p>
            </div>
          </PanelHeading>

          {accountStore.status === "error" ? (
            <div role="alert">
              <p>
                Privy is connected, but the Invest4Fun API did not restore the
                account.
              </p>
              <Button
                type="button"
                onClick={() => void accountStore.refreshAccount()}
              >
                <RefreshCw size={18} /> Retry
              </Button>
            </div>
          ) : null}

          {!accountStore.walletsReady ? (
            <p role="status">Restoring linked Solana wallets…</p>
          ) : accountStore.wallets.length ? (
            accountStore.wallets.map((wallet) => (
              <WalletRow key={wallet.address}>
                <strong>
                  <Wallet size={16} aria-hidden="true" /> {wallet.name}
                </strong>
                <small>
                  {wallet.kind === "embedded" ? "Portfolio" : "External"} ·{" "}
                  {wallet.provider}
                </small>
                <code>{wallet.address}</code>
                <Actions>
                  <button
                    type="button"
                    aria-label={`Copy ${wallet.name} address`}
                    onClick={() => void copyAddress(wallet.address)}
                  >
                    {copiedAddress === wallet.address ? <Check /> : <Copy />}
                  </button>
                  <a
                    href={`https://explorer.solana.com/address/${wallet.address}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${wallet.name} in Solana Explorer`}
                  >
                    <ExternalLink />
                  </a>
                </Actions>
              </WalletRow>
            ))
          ) : (
            <p>No Solana wallet is available yet.</p>
          )}

          <Button
            type="button"
            $secondary
            onClick={() => void accountStore.logout()}
          >
            <LogOut size={18} /> Sign out
          </Button>
        </Panel>
      )}
    </Page>
  );
});
