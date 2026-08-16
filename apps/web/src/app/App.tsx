import { AuthProvider } from "../auth/auth-context";
import { BasketProvider } from "../state/basket-context";
import { ThemeProvider } from "../state/theme-context";
import { AppRoutes } from "./AppRoutes";

export function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BasketProvider>
          <AppRoutes />
        </BasketProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
