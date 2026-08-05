/**
 * BottomNav — Interactive mobile menu dock.
 * Desktop: FloatingDock with magnetic hover.
 * Mobile: InteractiveMenu with bounce animation.
 */
import { useRef, useState } from "react";
import { Home, Map, Star, Settings } from "lucide-react";
import { InteractiveMenu } from "@/components/ui/modern-mobile-menu";
import { FloatingDock } from "@/components/ui/floating-dock";
import { SettingsPopup } from "@/components/ui/settings-popup";
import type { ThemeMode } from "@/components/ui/settings-popup";
import { useMetroStore } from "@/store/metro.store";

// ── Simple theme manager (persisted to localStorage) ──────────────────────────

const ALL_THEME_CLASSES = ["theme-darya"] as const;

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;

  // Remove all custom theme classes first
  root.classList.remove(...ALL_THEME_CLASSES);

  if (theme === "darya") {
    root.classList.add("theme-darya");
  } else if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
    root.classList.toggle("light", !prefersDark);
  } else {
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
  }

  localStorage.setItem("metro-theme", theme);
}

function getStoredTheme(): ThemeMode {
  const stored = localStorage.getItem("metro-theme") as ThemeMode | null;
  return stored ?? "dark";
}

// ─── BottomNav ────────────────────────────────────────────────────────────────

export function BottomNav() {
  const { activeTab, setActiveTab, currentRoute } = useMetroStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);
  const settingsAnchorRef = useRef<HTMLDivElement>(null);

  // Hide when route result is showing
  if (currentRoute) return null;

  const handleThemeChange = (t: ThemeMode) => {
    setTheme(t);
    applyTheme(t);
  };

  const handleSettingsClick = () => setSettingsOpen((v) => !v);

  // Map tab names to index (settings is not a tab, so only 3 real tabs)
  const tabOrder = ["home", "map", "favorites"] as const;
  const activeIndex = tabOrder.indexOf(activeTab as (typeof tabOrder)[number]);

  const menuItems = [
    { label: "home",      labelFa: "خانه",        icon: Home,     onClick: () => setActiveTab("home") },
    { label: "map",       labelFa: "نقشه",         icon: Map,      onClick: () => setActiveTab("map") },
    { label: "favorites", labelFa: "علاقه‌مندی",   icon: Star,     onClick: () => setActiveTab("favorites") },
    { label: "settings",  labelFa: "تنظیمات",      icon: Settings, onClick: handleSettingsClick },
  ];

  const dockItems = menuItems.map((item) => ({
    title: item.labelFa,
    href: "#",
    icon: (
      <item.icon
        className="h-full w-full"
        style={{
          color:
            item.label === "settings"
              ? settingsOpen
                ? "oklch(66% 0.17 163)"
                : "oklch(55% 0.01 260)"
              : activeTab === item.label
              ? "oklch(66% 0.17 163)"
              : "oklch(55% 0.01 260)",
        }}
      />
    ),
    onClick: item.onClick,
  }));

  return (
    <nav
      className="fixed bottom-5 inset-x-0 z-40 flex justify-center pointer-events-none"
      aria-label="Navigation"
    >
      <div className="pointer-events-auto relative" ref={settingsAnchorRef}>
        {/* Settings Popup — anchored above the nav */}
        <SettingsPopup
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          currentTheme={theme}
          onThemeChange={handleThemeChange}
        />

        {/* Mobile */}
        <div className="md:hidden">
          <InteractiveMenu items={menuItems} activeIndex={activeIndex >= 0 ? activeIndex : 0} />
        </div>
        {/* Desktop */}
        <div className="hidden md:block">
          <FloatingDock items={dockItems} />
        </div>
      </div>
    </nav>
  );
}
