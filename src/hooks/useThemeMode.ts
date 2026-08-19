import { useEffect, useState } from "react";
import type { ThemeMode } from "@/components/ui/settings-popup";

function readTheme(): ThemeMode {
  const stored = (localStorage.getItem("metro-theme") as ThemeMode | null) ?? "dark";
  if (stored === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return stored;
}

/** Reactive theme mode based on `html` class + localStorage. */
export function useThemeMode() {
  const [theme, setTheme] = useState<ThemeMode>(readTheme);

  useEffect(() => {
    const sync = () => setTheme(readTheme());
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("storage", sync);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", sync);
    return () => {
      obs.disconnect();
      window.removeEventListener("storage", sync);
      mq.removeEventListener("change", sync);
    };
  }, []);

  const isLight = theme === "light";
  return { theme, isLight };
}
