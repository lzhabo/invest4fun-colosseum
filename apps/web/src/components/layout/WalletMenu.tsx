import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  LogOut,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import type { WalletSummary } from "../../auth/auth-context";

export function WalletMenu({
  email,
  wallets,
  onLogout,
}: {
  email?: string | undefined;
  wallets: WalletSummary[];
  onLogout: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string>();
  const primaryWallet = wallets[0];
  const label = primaryWallet ? shortAddress(primaryWallet.address) : "Account";

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
            <span>Investing balance</span>
            <strong>Not connected yet</strong>
            <small>
              Balance data will appear after the Solana RPC is connected.
            </small>
          </div>

          <div className="wallet-menu-wallets">
            <span className="wallet-menu-label">Solana wallets</span>
            {wallets.length ? (
              wallets.map((wallet) => (
                <div className="wallet-menu-wallet" key={wallet.address}>
                  <div>
                    <strong>{wallet.name}</strong>
                    <small>
                      {wallet.kind === "embedded"
                        ? "Invest4Fun wallet"
                        : "External wallet"}
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
