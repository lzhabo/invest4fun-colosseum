import { AppProviders } from "@src/app/providers/AppProviders";
import { AppRoutes } from "@src/app/routes/AppRoutes";

export function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}
