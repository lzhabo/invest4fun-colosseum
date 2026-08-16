import {
  BriefcaseBusiness,
  CircleUserRound,
  GalleryVerticalEnd,
  Lightbulb,
  ShoppingBasket,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import type { ServiceStatus } from "../../app/use-service-health";
import { useAuth } from "../../auth/auth-context";
import { reviewBasket } from "../../services/api";
import { useBasket } from "../../state/basket-context";
import { WalletMenu } from "./WalletMenu";

export type AppView = "feed" | "ideas" | "portfolio" | "account" | "activity";

const navigation = [
  { id: "feed", label: "Feed", Icon: GalleryVerticalEnd },
  { id: "ideas", label: "Ideas", Icon: Lightbulb },
  { id: "portfolio", label: "Portfolio", Icon: BriefcaseBusiness },
  { id: "account", label: "Account", Icon: CircleUserRound },
] satisfies Array<{
  id: AppView;
  label: string;
  Icon: typeof BriefcaseBusiness;
}>;

export function AppShell({
  activeView,
  onNavigate,
  serviceStatus,
  children,
}: {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  serviceStatus: ServiceStatus;
  children: ReactNode;
}) {
  const auth = useAuth();
  const basket = useBasket();
  const [prepared, setPrepared] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const basketTotal = basket.entries.reduce(
    (total, entry) => total + (entry.amountUsd ?? 0),
    0,
  );
  const basketIsValid =
    basket.count > 0 &&
    basket.entries.every(
      (entry) => Number.isFinite(entry.amountUsd) && entry.amountUsd >= 0.1,
    );

  async function preparePurchase() {
    setPrepareError(null);
    setPreparing(true);
    try {
      const accessToken = await auth.getAccessToken();
      if (!accessToken) throw new Error("AUTH_REQUIRED");
      await reviewBasket(
        basket.entries.map(({ id, kind, amountUsd }) => ({
          id,
          kind,
          amountUsd,
        })),
        accessToken,
      );
      setPrepared(true);
    } catch {
      setPrepareError(
        "We could not prepare this basket. Check your session and try again.",
      );
    } finally {
      setPreparing(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="brand"
          type="button"
          onClick={() => onNavigate("feed")}
        >
          invest<span>4fun</span>
        </button>

        <nav className="primary-nav" aria-label="Primary navigation">
          {navigation.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={activeView === id ? "nav-link active" : "nav-link"}
              onClick={() => onNavigate(id)}
              aria-current={activeView === id ? "page" : undefined}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="topbar-actions">
          <span className={`service-status ${serviceStatus}`}>
            <span aria-hidden="true" />
            {serviceStatus === "online"
              ? "Services online"
              : serviceStatus === "offline"
                ? "Services offline"
                : "Checking services"}
          </span>
          {auth.authenticated ? (
            <WalletMenu
              email={auth.user?.email?.address}
              wallets={auth.wallets}
              onLogout={auth.logout}
            />
          ) : (
            <button
              className="wallet-button"
              type="button"
              disabled={!auth.configured || !auth.ready}
              onClick={auth.login}
              title={
                auth.configured
                  ? undefined
                  : "Set VITE_PRIVY_APP_ID to enable Privy"
              }
            >
              <Wallet aria-hidden="true" />
              Sign in
            </button>
          )}
        </div>
      </header>

      <main className="app-content">{children}</main>

      {basket.isOpen ? (
        <div className="basket-dialog-layer" role="presentation">
          <button
            type="button"
            className="basket-dialog-backdrop"
            aria-label="Close basket"
            onClick={basket.close}
          />
          <section
            className="basket-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="basket-dialog-title"
          >
            <header className="basket-dialog-header">
              <div>
                <span className="eyebrow">Purchase draft</span>
                <h2 id="basket-dialog-title">Review your basket</h2>
                <p>
                  Review your selections before we refresh quotes and prepare
                  the purchase.
                </p>
              </div>
              <button
                type="button"
                className="basket-dialog-close"
                aria-label="Close basket"
                onClick={basket.close}
              >
                <X aria-hidden="true" />
              </button>
            </header>
            <div className="basket-review-grid">
              <div className="basket-review-main">
                {basket.entries.length ? (
                  <div className="basket-dialog-list">
                    <div className="basket-list-labels">
                      <span>Selection</span>
                      <span>Input (you pay)</span>
                    </div>
                    {basket.entries.map((entry) => (
                      <div className="basket-dialog-item" key={entry.id}>
                        <div>
                          <strong>{entry.title}</strong>
                          <small>
                            {entry.kind === "idea"
                              ? "Prepared idea"
                              : "Direct asset"}
                          </small>
                        </div>
                        <label className="basket-amount-field">
                          <span className="sr-only">
                            Amount for {entry.title}
                          </span>
                          <b>$</b>
                          <input
                            type="number"
                            min="0.1"
                            step="0.01"
                            inputMode="decimal"
                            value={
                              Number.isFinite(entry.amountUsd)
                                ? entry.amountUsd
                                : ""
                            }
                            onChange={(event) =>
                              basket.updateAmount(
                                entry.id,
                                Number(event.target.value),
                              )
                            }
                          />
                        </label>
                        <button
                          type="button"
                          aria-label={`Remove ${entry.title} from basket`}
                          title="Remove from basket"
                          onClick={() => basket.remove(entry.id)}
                        >
                          <Trash2 aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="basket-dialog-empty">
                    <ShoppingBasket aria-hidden="true" />
                    <strong>Your basket is empty</strong>
                    <p>Add assets or ideas from Feed and Ideas.</p>
                  </div>
                )}
                {basket.entries.length ? (
                  <div className="basket-dialog-total">
                    <div>
                      <span>Total input</span>
                      <small>USDC to invest</small>
                    </div>
                    <strong>${basketTotal.toFixed(2)}</strong>
                  </div>
                ) : null}
                {prepared ? (
                  <p className="basket-prepared-note" role="status">
                    Draft order prepared on the server. Wallet signing will be
                    connected in the Jupiter execution phase.
                  </p>
                ) : prepareError ? (
                  <p className="basket-validation-note" role="alert">
                    {prepareError}
                  </p>
                ) : !basketIsValid && basket.count ? (
                  <p className="basket-validation-note" role="alert">
                    Each selection must have an amount of at least $0.10.
                  </p>
                ) : null}
              </div>
              <aside className="basket-policy-rail">
                <h3>Policy checks</h3>
                <div className="basket-policy-row">
                  <span className="policy-check">✓</span>
                  <b>Assets eligible</b>
                  <em>
                    {basket.count
                      ? `${basket.count} / ${basket.count}`
                      : "None selected"}
                  </em>
                </div>
                <div className="basket-policy-row">
                  <span
                    className={
                      basketIsValid ? "policy-check" : "policy-warning"
                    }
                  >
                    {basketIsValid ? "✓" : "!"}
                  </span>
                  <b>Budget within limit</b>
                  <em>${basketTotal.toFixed(2)} / $100.00 USDC</em>
                </div>
                <div className="basket-policy-row">
                  <span className="policy-check">✓</span>
                  <b>Execution provider</b>
                  <em>Jupiter</em>
                </div>
                <div className="basket-policy-row">
                  <span className="policy-check">✓</span>
                  <b>Network</b>
                  <em>Solana</em>
                </div>
                <div className="basket-policy-note">
                  <strong>Review before signing</strong>
                  <p>
                    Quotes and final outputs will be refreshed before a
                    transaction is prepared.
                  </p>
                </div>
              </aside>
            </div>
            <footer className="basket-dialog-footer">
              <span>
                {basket.count} selection{basket.count === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                className="legacy-primary-button"
                disabled={!basketIsValid || preparing || prepared}
                title="Purchase flow is not connected yet"
                onClick={() => void preparePurchase()}
              >
                {preparing
                  ? "Preparing…"
                  : prepared
                    ? "Prepared"
                    : "Prepare purchase"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={activeView === id ? "active" : ""}
            onClick={() => onNavigate(id)}
            aria-label={label}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
