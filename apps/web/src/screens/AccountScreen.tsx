import {
  ArrowDownToLine,
  Check,
  CircleUserRound,
  Coins,
  Copy,
  ExternalLink,
  Info,
  LogOut,
  Moon,
  RefreshCw,
  Sun,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../auth/auth-context";
import { EmptyState } from "../components/ui/EmptyState";
import { useTheme } from "../state/theme-context";

export function AccountScreen() {
  const auth = useAuth();
  const { theme, setTheme } = useTheme();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  async function copyAddress(address: string) {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      window.setTimeout(() => setCopiedAddress(null), 1600);
    } catch {
      setCopiedAddress(null);
    }
  }

  if (auth.authenticated) {
    const email = auth.user?.email?.address;
    const portfolioWallet = auth.wallets.find(
      (wallet) => wallet.kind === "embedded",
    );
    return (
      <main className="legacy-page account-page">
        <header className="account-heading">
          <span>Identity and access</span>
          <h1>Account</h1>
          <p>
            {auth.accountReady
              ? "Your Invest4Fun account is connected through Privy."
              : auth.accountStatus === "error"
                ? "Your Privy session is active, but the Invest4Fun account could not be restored."
                : "Restoring your Invest4Fun account from Privy."}
          </p>
        </header>
        {auth.accountStatus === "error" ? (
          <section className="account-status-panel" role="alert">
            <div>
              <strong>Account restore failed</strong>
              <p>
                Retry the account bootstrap, or sign out and authenticate again
                if the session has expired.
              </p>
            </div>
            <button
              type="button"
              className="legacy-primary-button"
              onClick={() => void auth.refreshAccount()}
            >
              Retry <RefreshCw aria-hidden="true" />
            </button>
          </section>
        ) : auth.accountStatus === "loading" ? (
          <section
            className="account-status-panel"
            role="status"
            aria-live="polite"
          >
            <div>
              <strong>Restoring account</strong>
              <p>Invest4Fun data will load after bootstrap completes.</p>
            </div>
          </section>
        ) : null}
        <section className="account-balance">
          <div>
            <span>Invest4Fun wallet</span>
            <strong>$0.00</strong>
            <small>
              Portfolio balances come only from the embedded Invest4Fun wallet.
            </small>
          </div>
          <div className="account-address">
            <div>
              <span>Connected through Privy</span>
              <strong>{email ?? "Invest4Fun user"}</strong>
            </div>
            <button
              type="button"
              className="legacy-primary-button account-top-up-trigger"
              disabled={!auth.accountReady || !portfolioWallet}
              onClick={() => setTopUpOpen(true)}
              title={
                portfolioWallet
                  ? undefined
                  : "Embedded Invest4Fun wallet is not available yet"
              }
            >
              Top up <ArrowDownToLine aria-hidden="true" />
            </button>
          </div>
        </section>
        {topUpOpen ? (
          <div className="account-dialog-layer" role="presentation">
            <button
              type="button"
              className="account-dialog-backdrop"
              aria-label="Close top up dialog"
              onClick={() => setTopUpOpen(false)}
            />
            <section
              className="account-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="top-up-title"
            >
              <header className="account-dialog-header">
                <div>
                  <span className="account-label">Funding</span>
                  <h2 id="top-up-title">Top up your wallet</h2>
                  <p>Choose how you want to add funds to Invest4Fun.</p>
                </div>
                <button
                  type="button"
                  className="account-dialog-close"
                  aria-label="Close top up dialog"
                  onClick={() => setTopUpOpen(false)}
                >
                  <X aria-hidden="true" />
                </button>
              </header>
              <div className="account-top-up-providers">
                <article className="account-top-up-provider">
                  <div className="account-top-up-provider-heading">
                    <span className="account-top-up-provider-icon">
                      <Coins aria-hidden="true" />
                    </span>
                    <div>
                      <strong>Direct crypto transfer</strong>
                      <small>
                        Send USDC on Solana to your Invest4Fun wallet.
                      </small>
                    </div>
                  </div>
                  {portfolioWallet ? (
                    <div className="account-top-up-wallet">
                      <span>Deposit address</span>
                      <code>{portfolioWallet.address}</code>
                      <button
                        type="button"
                        className="legacy-primary-button account-top-up-copy"
                        onClick={() =>
                          void copyAddress(portfolioWallet.address)
                        }
                      >
                        {copiedAddress === portfolioWallet.address ? (
                          <>
                            Copied <Check aria-hidden="true" />
                          </>
                        ) : (
                          <>
                            Copy address <Copy aria-hidden="true" />
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <p className="account-muted">
                      Embedded Invest4Fun wallet setup is still pending.
                    </p>
                  )}
                </article>
                <article className="account-top-up-provider account-top-up-provider-muted">
                  <div className="account-top-up-provider-heading">
                    <span className="account-top-up-provider-icon">
                      <Wallet aria-hidden="true" />
                    </span>
                    <div>
                      <strong>Card or bank transfer</strong>
                      <small>
                        Country-specific on-ramp providers will be connected
                        here.
                      </small>
                    </div>
                  </div>
                  <span className="account-provider-status">Coming next</span>
                </article>
              </div>
              <p className="account-top-up-note">
                <Info aria-hidden="true" />
                <span>
                  Only send supported assets on Solana to the embedded
                  Invest4Fun wallet. External wallets are funding sources, not
                  portfolio wallets.
                </span>
              </p>
            </section>
          </div>
        ) : null}
        <section className="account-command-section">
          <h2>Wallets</h2>
          <div className="account-wallet-list">
            {!auth.walletsReady ? (
              <p className="account-muted">
                Restoring linked Solana wallets...
              </p>
            ) : auth.wallets.length ? (
              auth.wallets.map((wallet) => (
                <div className="account-wallet-row" key={wallet.address}>
                  <div className="account-wallet-primary">
                    <span className="account-wallet-icon">
                      <Wallet />
                    </span>
                    <strong>
                      {wallet.kind === "embedded"
                        ? "Invest4Fun wallet"
                        : wallet.name}
                    </strong>
                    <span className="account-network">
                      {wallet.kind === "embedded" ? "Portfolio" : "External"}
                    </span>
                  </div>
                  <div className="account-row-copy">
                    <small>
                      {wallet.kind === "embedded"
                        ? `Embedded portfolio wallet - ${wallet.provider}`
                        : `Funding or withdrawal wallet - ${wallet.provider}`}
                    </small>
                    <code>{wallet.address}</code>
                  </div>
                  <div className="account-wallet-actions">
                    <button
                      type="button"
                      title="Copy wallet address"
                      aria-label="Copy wallet address"
                      onClick={() => void copyAddress(wallet.address)}
                    >
                      {copiedAddress === wallet.address ? <Check /> : <Copy />}
                    </button>
                    <a
                      href={`https://explorer.solana.com/address/${wallet.address}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Open in Solana Explorer"
                      aria-label="Open wallet in Solana Explorer"
                    >
                      <ExternalLink />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <p className="account-muted">
                No Solana wallet is available yet. The embedded Invest4Fun
                wallet must be restored before funding.
              </p>
            )}
          </div>
        </section>
        <section className="account-command-section account-settings-section">
          <h2>Account identity</h2>
          <div className="account-rule-row">
            <span>Internal account</span>
            <strong>Independent from Privy</strong>
          </div>
          <div className="account-rule-row">
            <span>Login provider</span>
            <strong>Privy</strong>
          </div>
        </section>
        <section className="account-command-section account-appearance-section">
          <div className="account-command-heading">
            <h2>Appearance</h2>
            <span className="account-setting-value">
              {theme === "dark" ? "Dark" : "Light"}
            </span>
          </div>
          <fieldset className="theme-switcher">
            <legend className="sr-only">Theme</legend>
            <button
              type="button"
              className={theme === "light" ? "selected" : ""}
              aria-pressed={theme === "light"}
              onClick={() => setTheme("light")}
            >
              <Sun aria-hidden="true" /> Light
            </button>
            <button
              type="button"
              className={theme === "dark" ? "selected" : ""}
              aria-pressed={theme === "dark"}
              onClick={() => setTheme("dark")}
            >
              <Moon aria-hidden="true" /> Dark
            </button>
          </fieldset>
        </section>
        <button
          type="button"
          className="legacy-action account-signout"
          onClick={() => void auth.logout()}
        >
          <LogOut aria-hidden="true" /> Sign out
        </button>
      </main>
    );
  }

  return (
    <main className="legacy-page account-page">
      <header className="account-heading">
        <span>Identity and access</span>
        <h1>Account</h1>
        <p>
          The Invest4Fun user will remain independent from any single login
          provider or wallet.
        </p>
      </header>
      <EmptyState
        Icon={CircleUserRound}
        title="Account setup is pending"
        description={
          auth.configured
            ? "Sign in with email or an existing Solana wallet to create your Invest4Fun session."
            : "Set VITE_PRIVY_APP_ID to enable Privy email and Solana wallet login."
        }
      />
    </main>
  );
}
