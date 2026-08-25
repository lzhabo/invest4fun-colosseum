import "styled-components";
import type { AppTheme } from "@src/theme/theme";

declare module "styled-components" {
  export interface DefaultTheme extends AppTheme {}
}
