import { useState } from "react";
import { AppShell, type AppView } from "../components/layout/AppShell";
import { AccountScreen } from "../screens/AccountScreen";
import { ActivityScreen } from "../screens/ActivityScreen";
import { FeedScreen } from "../screens/FeedScreen";
import { PortfolioScreen } from "../screens/PortfolioScreen";
import { useServiceHealth } from "./use-service-health";

const screens: Record<AppView, React.ComponentType> = {
  feed: FeedScreen,
  portfolio: PortfolioScreen,
  activity: ActivityScreen,
  account: AccountScreen,
};

export function App() {
  const [view, setView] = useState<AppView>("feed");
  const status = useServiceHealth();
  const Screen = screens[view];

  return (
    <AppShell activeView={view} onNavigate={setView} serviceStatus={status}>
      <Screen />
    </AppShell>
  );
}
