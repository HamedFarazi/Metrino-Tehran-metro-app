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

const ALL_THEME_CLASSES = [
  "theme-dark",
  "theme-light",
  "theme-system",
] as const;

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;

  // Remove all theme classes first
  root.classList.remove(...ALL_THEME_CLASSES);

  // Apply the correct class (dark is the base default, but we still mark it)
  root.classList.add(`theme-${theme}`);

  // color-scheme hint for browser chrome (scrollbars, inputs, etc.)
  root.style.colorScheme =
    theme === "light" ? "light"
    : theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : "dark";

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
    { label: "favorites", labelFa: "علاقه",        icon: Star,     onClick: () => setActiveTab("favorites") },
    { label: "settings",  labelFa: "تنظیمات",      icon: Settings, onClick: handleSettingsClick },
  ];

  const dockItems = menuItems.map((item) => {
    const isActive = item.label === "settings" ? settingsOpen : activeTab === item.label;
    
    return {
      title: item.labelFa,
      href: "#",
      icon: (
        <item.icon
          className="h-full w-full transition-colors"
          style={{
            color: isActive
              ? "var(--component-active-color-default)"
              : "var(--component-inactive-color)",
            strokeWidth: 2,
          }}
        />
      ),
      onClick: item.onClick,
    };
  });

  return (
    <nav
      className="fixed bottom-4 inset-x-0 z-40 flex justify-center px-3 pointer-events-none"
      aria-label="Navigation"
    >
      {/* Soft ambient glow behind floating nav (dark) */}
      {theme !== "light" && (
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 h-28 w-[min(420px,92vw)] -translate-x-1/2 md:hidden"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(99,102,241,0.22) 0%, rgba(34,211,238,0.08) 42%, transparent 70%)",
            filter: "blur(8px)",
          }}
          aria-hidden
        />
      )}
      <div className="pointer-events-auto relative" ref={settingsAnchorRef}>
        {/* Settings Popup — anchored above the nav */}
        <SettingsPopup
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          currentTheme={theme}
          onThemeChange={handleThemeChange}
        />

        {/* Mobile */}
        <div className="md:hidden" data-active-tab={activeTab}>
          <InteractiveMenu items={menuItems} activeIndex={activeIndex >= 0 ? activeIndex : 0} />
        </div>
        {/* Desktop */}
        <div className="hidden md:block" data-active-tab={activeTab}>
          <FloatingDock items={dockItems} />
        </div>
      </div>
    </nav>
  );
}
