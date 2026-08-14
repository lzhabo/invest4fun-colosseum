import {
  CircleUserRound,
  Copy,
  ExternalLink,
  LogOut,
  Wallet,
} from "lucide-react";
import { useAuth } from "../auth/auth-context";
import { EmptyState } from "../components/ui/EmptyState";

export function AccountScreen() {
  const auth = useAuth();

  if (auth.authenticated) {
    const email = auth.user?.email?.address;
    return (
      <main className="legacy-page account-page">
        <header className="account-heading">
          <span>Identity and access</span>
          <h1>Account</h1>
          <p>Your Invest4Fun account is connected through Privy.</p>
        </header>
        <section className="account-balance">
          <div>
            <span>Investing balance</span>
            <strong>$0.00</strong>
            <small>
              Available balance will appear after your first deposit.
            </small>
          </div>
          <div className="account-address">
            <span>Connected through Privy</span>
            <strong>{email ?? "Invest4Fun user"}</strong>
          </div>
        </section>
        <section className="account-command-section">
          <h2>Wallets</h2>
          <div className="account-wallet-list">
            {auth.wallets.length ? (
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
                    <span className="account-network">Solana</span>
                  </div>
                  <div className="account-row-copy">
                    <small>
                      {wallet.kind === "embedded"
                        ? "Embedded portfolio wallet"
                        : "External funding wallet"}
                    </small>
                    <code>{wallet.address}</code>
                  </div>
                  <div className="account-wallet-actions">
                    <button
                      type="button"
                      title="Copy wallet address"
                      aria-label="Copy wallet address"
                    >
                      <Copy />
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
                No Solana wallet is available yet.
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
