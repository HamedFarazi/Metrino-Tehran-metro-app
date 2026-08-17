import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { initDeveloperConsole, suppressProductionDebugLogs } from "@/lib/dev-console";

// ── Initialize developer console (production only) ────────────────────────────
initDeveloperConsole();
suppressProductionDebugLogs();

// ── Apply saved theme before first render to avoid flash ──────────────────────
(function initTheme() {
  const saved = localStorage.getItem("metro-theme") ?? "dark";
  const root = document.documentElement;

  // Apply theme class — all themes use theme-* prefix
  root.classList.add(`theme-${saved}`);

  // color-scheme hint
  if (saved === "darya" || saved === "light") {
    root.style.colorScheme = "light";
  } else if (saved === "system") {
    root.style.colorScheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } else {
    root.style.colorScheme = "dark";
  }
})();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
