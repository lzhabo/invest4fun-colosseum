export const appTheme = {
  colors: {
    canvas: "#f5f2ea",
    surface: "#fffdf8",
    ink: "#171714",
    text: "#171714",
    textMuted: "#69685f",
    border: "#d9d4c8",
    accent: "#6952e8",
    positive: "#218a4b",
    negative: "#d84b43",
  },
  spacing: {
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "40px",
  },
  radii: {
    sm: "10px",
    lg: "20px",
    xl: "32px",
    pill: "999px",
  },
  shadows: {
    card: "0 24px 70px rgba(36, 31, 20, 0.1)",
    floating: "0 18px 50px rgba(36, 31, 20, 0.18)",
  },
} as const;

export type AppTheme = typeof appTheme;
