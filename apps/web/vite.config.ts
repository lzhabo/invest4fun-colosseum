import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  envDir: "../..",
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": process.env.API_ORIGIN ?? "http://localhost:8787",
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
