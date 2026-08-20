import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  LogOut,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import type {
  AccountBootstrapStatus,
  WalletSummary,
} from "../../auth/auth-context";

export function WalletMenu({
  email,
  wallets,
  walletsReady,
  accountStatus,
  onRetryAccount,
  onLogout,
}: {
  email?: string | undefined;
  wallets: WalletSummary[];
  walletsReady: boolean;
  accountStatus: AccountBootstrapStatus;
  onRetryAccount: () => Promise<void>;
  onLogout: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string>();
  const portfolioWallet =
    wallets.find((wallet) => wallet.kind === "embedded") ?? wallets[0];
  const label = portfolioWallet
    ? shortAddress(portfolioWallet.address)
    : accountStatus === "loading"
      ? "Restoring"
      : "Account";

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    window.setTimeout(() => setCopiedAddress(undefined), 1500);
  };

  return (
    <div className="wallet-menu">
      <button
        className="wallet-menu-trigger"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Wallet aria-hidden="true" />
        <span>{label}</span>
        <ChevronDown className="wallet-menu-chevron" aria-hidden="true" />
      </button>

      {open ? (
        <div
          className="wallet-menu-content"
          role="dialog"
          aria-label="Wallet information"
        >
          <div className="wallet-menu-heading">
            <span>Connected account</span>
            <strong>{email ?? "Invest4Fun user"}</strong>
          </div>

          <div className="wallet-menu-balance">
            <span>Invest4Fun portfolio</span>
            <strong>
              {portfolioWallet?.kind === "embedded"
                ? "Embedded wallet selected"
                : "Wallet setup pending"}
            </strong>
            <small>
              External wallet balances stay separate and are not included here.
            </small>
          </div>

          {accountStatus === "error" ? (
            <div className="wallet-menu-alert" role="alert">
              <strong>Account restore failed</strong>
              <small>Retry bootstrap or sign in again.</small>
              <button type="button" onClick={() => void onRetryAccount()}>
                <RefreshCw aria-hidden="true" />
                Retry
              </button>
            </div>
          ) : null}

          <div className="wallet-menu-wallets">
            <span className="wallet-menu-label">Solana wallets</span>
            {!walletsReady ? (
              <small className="wallet-menu-empty">
                Restoring linked Solana wallets...
              </small>
            ) : wallets.length ? (
              wallets.map((wallet) => (
                <div className="wallet-menu-wallet" key={wallet.address}>
                  <div>
                    <strong>{wallet.name}</strong>
                    <small>
                      {wallet.kind === "embedded"
                        ? `Portfolio wallet - ${wallet.provider}`
                        : `External funding wallet - ${wallet.provider}`}
                    </small>
                  </div>
                  <code>{shortAddress(wallet.address)}</code>
                  <div className="wallet-menu-wallet-actions">
                    <button
                      type="button"
                      aria-label={`Copy ${wallet.name} address`}
                      title="Copy address"
                      onClick={() => void copyAddress(wallet.address)}
                    >
                      {copiedAddress === wallet.address ? (
                        <Check aria-hidden="true" />
                      ) : (
                        <Copy aria-hidden="true" />
                      )}
                    </button>
                    <a
                      href={`https://explorer.solana.com/address/${wallet.address}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${wallet.name} in Solana Explorer`}
                      title="Open in Solana Explorer"
                    >
                      <ExternalLink aria-hidden="true" />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <small className="wallet-menu-empty">
                No Solana wallet is available yet.
              </small>
            )}
          </div>

          <button
            className="wallet-menu-action danger"
            type="button"
            onClick={() => void onLogout()}
          >
            <LogOut aria-hidden="true" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

function shortAddress(address: string) {
  return address.length > 12
    ? `${address.slice(0, 5)}...${address.slice(-5)}`
    : address;
}
