import { lazy } from "react";

export const FeedPage = lazy(async () => ({
  default: (await import("../screens/FeedScreen")).FeedScreen,
}));

export const IdeasPage = lazy(async () => ({
  default: (await import("../screens/IdeasScreen")).IdeasScreen,
}));

export const PortfolioPage = lazy(async () => ({
  default: (await import("../screens/PortfolioScreen")).PortfolioScreen,
}));

export const AccountPage = lazy(async () => ({
  default: (await import("../screens/AccountScreen")).AccountScreen,
}));

export const ActivityPage = lazy(async () => ({
  default: (await import("../screens/ActivityScreen")).ActivityScreen,
}));
