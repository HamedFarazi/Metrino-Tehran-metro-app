import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import App from "@/App";

// ── Apply saved theme before first render to avoid flash ──────────────────────
(function initTheme() {
  const saved = localStorage.getItem("metro-theme") ?? "dark";
  const root = document.documentElement;
  if (saved === "darya") {
    root.classList.add("theme-darya");
  } else if (saved === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  }
  // "dark" is default — no class needed
})();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
