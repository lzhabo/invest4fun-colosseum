import { CircleUserRound } from "lucide-react";
import { Suspense } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { AppShell, type AppView } from "../components/layout/AppShell";
import { EmptyState } from "../components/ui/EmptyState";
import {
  AccountPage,
  ActivityPage,
  FeedPage,
  IdeasPage,
  PortfolioPage,
} from "./pages";
import { ROUTES } from "./routes";
import { useServiceHealth } from "./use-service-health";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const serviceStatus = useServiceHealth();
  const auth = useAuth();

  function handleNavigate(view: AppView) {
    navigate(`/${view}`);
  }

  return (
    <AppShell
      activeView={getActiveView(location.pathname)}
      onNavigate={handleNavigate}
      serviceStatus={serviceStatus}
    >
      {auth.configured &&
      (!auth.ready ||
        (auth.authenticated && auth.accountStatus === "loading")) ? (
        <AccountRestoreLoading />
      ) : auth.authenticated && auth.accountStatus === "error" ? (
        <AccountRestoreError
          onRetry={auth.refreshAccount}
          onLogout={auth.logout}
        />
      ) : (
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route
              path={ROUTES.ROOT}
              element={<Navigate to={ROUTES.FEED} replace />}
            />
            <Route path={ROUTES.FEED} element={<FeedPage />} />
            <Route path={ROUTES.IDEAS} element={<IdeasPage />} />
            <Route path={ROUTES.PORTFOLIO} element={<PortfolioPage />} />
            <Route path={ROUTES.ACCOUNT} element={<AccountPage />} />
            <Route path={ROUTES.ACTIVITY} element={<ActivityPage />} />
            <Route path="*" element={<Navigate to={ROUTES.FEED} replace />} />
          </Routes>
        </Suspense>
      )}
    </AppShell>
  );
}

function getActiveView(pathname: string): AppView {
  if (pathname === ROUTES.IDEAS) return "ideas";
  if (pathname === ROUTES.PORTFOLIO) return "portfolio";
  if (pathname === ROUTES.ACCOUNT) return "account";
  if (pathname === ROUTES.ACTIVITY) return "activity";
  return "feed";
}

function RouteLoading() {
  return (
    <div className="screen" role="status" aria-live="polite">
      Loading page...
    </div>
  );
}

function AccountRestoreLoading() {
  return (
    <main
      className="screen account-restore-state"
      role="status"
      aria-live="polite"
    >
      <EmptyState
        Icon={CircleUserRound}
        title="Restoring your account"
        description="We are confirming your Privy session before loading Invest4Fun data."
      />
    </main>
  );
}

function AccountRestoreError({
  onRetry,
  onLogout,
}: {
  onRetry: () => Promise<void>;
  onLogout: () => Promise<void>;
}) {
  return (
    <main className="screen account-restore-state">
      <EmptyState
        Icon={CircleUserRound}
        title="Account restore failed"
        description="Your Privy session is present, but Invest4Fun could not restore the internal account."
      />
      <div className="account-restore-actions">
        <button
          type="button"
          className="legacy-primary-button"
          onClick={() => void onRetry()}
        >
          Retry
        </button>
        <button
          type="button"
          className="legacy-action account-signout"
          onClick={() => void onLogout()}
        >
          Sign out
        </button>
      </div>
    </main>
  );
}
