import { App } from "@src/app/App";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element is missing");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
