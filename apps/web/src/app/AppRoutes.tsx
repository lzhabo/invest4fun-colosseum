import { Suspense } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AppShell, type AppView } from "../components/layout/AppShell";
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

  function handleNavigate(view: AppView) {
    navigate(`/${view}`);
  }

  return (
    <AppShell
      activeView={getActiveView(location.pathname)}
      onNavigate={handleNavigate}
      serviceStatus={serviceStatus}
    >
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
