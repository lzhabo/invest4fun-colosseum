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
import type { ServiceStatus } from "../../app/use-service-health";
import { useAuth } from "../../auth/auth-context";
import { useBasket } from "../../state/basket-context";
import { WalletMenu } from "./WalletMenu";

export type AppView = "feed" | "ideas" | "portfolio" | "account";

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
                <h2 id="basket-dialog-title">Your basket</h2>
                <p>Review your selections before we prepare the purchase.</p>
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
            {basket.entries.length ? (
              <div className="basket-dialog-list">
                {basket.entries.map((entry) => (
                  <div className="basket-dialog-item" key={entry.id}>
                    <div>
                      <strong>{entry.title}</strong>
                      <small>{entry.kind === "idea" ? "Idea" : "Asset"}</small>
                    </div>
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
            <footer className="basket-dialog-footer">
              <span>
                {basket.count} selection{basket.count === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                className="legacy-primary-button"
                disabled={!basket.count}
                title="Purchase flow is not connected yet"
              >
                Prepare purchase
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
