import { GlobalStyles } from "@src/theme/GlobalStyles";
import { appTheme } from "@src/theme/theme";
import type { PropsWithChildren } from "react";
import { ThemeProvider } from "styled-components";

export function AppThemeProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={appTheme}>
      <GlobalStyles />
      {children}
    </ThemeProvider>
  );
}
