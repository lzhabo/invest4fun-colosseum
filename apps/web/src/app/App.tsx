import { useState } from "react";
import { AppShell, type AppView } from "../components/layout/AppShell";
import { AccountScreen } from "../screens/AccountScreen";
import { FeedScreen } from "../screens/FeedScreen";
import { IdeasScreen } from "../screens/IdeasScreen";
import { PortfolioScreen } from "../screens/PortfolioScreen";
import { BasketProvider } from "../state/basket-context";
import { ThemeProvider } from "../state/theme-context";
import { useServiceHealth } from "./use-service-health";

const screens: Record<AppView, React.ComponentType> = {
  feed: FeedScreen,
  ideas: IdeasScreen,
  portfolio: PortfolioScreen,
  account: AccountScreen,
};

export function App() {
  const [view, setView] = useState<AppView>("feed");
  const status = useServiceHealth();
  const Screen = screens[view];

  return (
    <ThemeProvider>
      <BasketProvider>
        <AppShell activeView={view} onNavigate={setView} serviceStatus={status}>
          <Screen />
        </AppShell>
      </BasketProvider>
    </ThemeProvider>
  );
}
