import {
  Activity,
  CircleUserRound,
  GalleryVerticalEnd,
  PieChart,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import type { ServiceStatus } from "../../app/use-service-health";
import { useAuth } from "../../auth/auth-context";
import { WalletMenu } from "./WalletMenu";

export type AppView = "feed" | "portfolio" | "activity" | "account";

const navigation = [
  { id: "feed", label: "Feed", Icon: GalleryVerticalEnd },
  { id: "portfolio", label: "Portfolio", Icon: PieChart },
  { id: "activity", label: "Activity", Icon: Activity },
  { id: "account", label: "Account", Icon: CircleUserRound },
] satisfies Array<{ id: AppView; label: string; Icon: typeof Activity }>;

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
