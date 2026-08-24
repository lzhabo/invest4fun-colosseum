import { PrivyProvider } from "@src/PrivyProvider";
import { StoresProvider } from "@src/stores";
import { AppThemeProvider } from "@src/theme/AppThemeProvider";
import type { PropsWithChildren } from "react";
import { BrowserRouter } from "react-router-dom";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AppThemeProvider>
      <StoresProvider>
        <PrivyProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </PrivyProvider>
      </StoresProvider>
    </AppThemeProvider>
  );
}
