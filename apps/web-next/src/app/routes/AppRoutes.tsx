import { ROUTES } from "@src/app/routes/routes";
import { Layout } from "@src/components/Layout";
import { RouteState } from "@src/components/RouteState";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const IdeasPage = lazy(async () => ({
  default: (await import("@src/screens/Ideas/IdeasPage")).IdeasPage,
}));

const FeedPage = lazy(async () => ({
  default: (await import("@src/screens/Feed/FeedPage")).FeedPage,
}));

const BasketPage = lazy(async () => ({
  default: (await import("@src/screens/Basket/BasketPage")).BasketPage,
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
            element={<Navigate to={ROUTES.FEED} replace />}
          />
          <Route path={ROUTES.FEED} element={<FeedPage />} />
          <Route path={ROUTES.BASKET} element={<BasketPage />} />
          <Route path={ROUTES.IDEAS} element={<IdeasPage />} />
          <Route path={ROUTES.PORTFOLIO} element={<PortfolioPage />} />
          <Route path={ROUTES.ACCOUNT} element={<AccountPage />} />
          <Route path="*" element={<Navigate to={ROUTES.FEED} replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
