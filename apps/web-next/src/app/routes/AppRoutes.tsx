import { ROUTES } from "@src/app/routes/routes";
import { Layout } from "@src/components/Layout";
import { RouteState } from "@src/components/RouteState";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const IdeasPage = lazy(async () => ({
  default: (await import("@src/screens/Ideas/IdeasPage")).IdeasPage,
}));

const ActivityPage = lazy(async () => ({
  default: (await import("@src/screens/Activity/ActivityPage")).ActivityPage,
}));

const AccountPage = lazy(async () => ({
  default: (await import("@src/screens/Account/AccountPage")).AccountPage,
}));

const PortfolioPage = lazy(async () => ({
  default: (await import("@src/screens/Portfolio/PortfolioPage")).PortfolioPage,
}));

export function AppRoutes() {
  return (
    <Layout>
      <Suspense fallback={<RouteState title="Loading page…" />}>
        <Routes>
          <Route
            path={ROUTES.ROOT}
            element={<Navigate to={ROUTES.IDEAS} replace />}
          />
          <Route path={ROUTES.IDEAS} element={<IdeasPage />} />
          <Route path={ROUTES.ACTIVITY} element={<ActivityPage />} />
          <Route
            path={ROUTES.FEED}
            element={<MigrationPendingPage name="Feed" />}
          />
          <Route path={ROUTES.PORTFOLIO} element={<PortfolioPage />} />
          <Route path={ROUTES.ACCOUNT} element={<AccountPage />} />
          <Route path="*" element={<Navigate to={ROUTES.IDEAS} replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

function MigrationPendingPage({ name }: { name: string }) {
  return (
    <RouteState
      eyebrow="Parallel migration"
      title={`${name} still runs in apps/web`}
      description="This route will move here as a complete, tested vertical slice. The current application remains the behavior reference during migration."
    />
  );
}
