/**
 * DesktopSidebar — Vertical navigation for desktop layout
 */
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Home, Map, Star, Settings, Sparkles, X } from "lucide-react";
import { useMetroStore } from "@/store/metro.store";
import { SettingsPopup, type ThemeMode } from "@/components/ui/settings-popup";
import { cn } from "@/lib/utils";

const ALL_THEME_CLASSES = [
  "theme-dark",
  "theme-light",
  "theme-system",
] as const;

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.classList.remove(...ALL_THEME_CLASSES);
  root.classList.add(`theme-${theme}`);
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

export function DesktopSidebar() {
  const { activeTab, setActiveTab } = useMetroStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);
  const settingsRef = useRef<HTMLDivElement>(null);
  const comingSoonRef = useRef<HTMLDivElement>(null);

  const handleThemeChange = (t: ThemeMode) => {
    setTheme(t);
    applyTheme(t);
  };

  useEffect(() => {
    if (!comingSoonOpen) return;
    const onDown = (e: MouseEvent) => {
      if (comingSoonRef.current?.contains(e.target as Node)) return;
      setComingSoonOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [comingSoonOpen]);

  const navItems = [
    { id: "home", labelFa: "خانه", icon: Home },
    { id: "map", labelFa: "نقشه", icon: Map },
    { id: "favorites", labelFa: "علاقه‌مندی", icon: Star },
  ] as const;

  return (
    <aside
      className="hidden lg:flex flex-col sticky top-[14px] rounded-[20px] p-3 z-30"
      style={{
        width: "120px",
        height: "calc(100vh - 28px)",
        background: "var(--sidebar-bg, var(--glass-bg))",
        border: "1px solid var(--sidebar-border, var(--glass-border))",
        backdropFilter: "blur(18px)",
        boxShadow: "var(--shadow-card-soft, 0 10px 35px rgba(40,50,80,0.06))",
      }}
    >
      <div className="flex items-center justify-center h-16 mb-4">
        <img
          src="/icons/icon-192.png"
          alt="مترو تهران"
          className="w-12 h-12 rounded-xl"
          style={{
            objectFit: "contain",
          }}
        />
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 py-4 rounded-[16px] transition-all duration-200",
                isActive && "shadow-lg"
              )}
              style={{
                background: isActive ? "var(--component-active-bg)" : "transparent",
                border: isActive
                  ? "1px solid rgba(124, 92, 252, 0.30)"
                  : "1px solid transparent",
              }}
            >
              <Icon
                className="w-5 h-5"
                style={{
                  color: isActive ? "var(--nav-active, #7357E8)" : "var(--component-inactive-color)",
                  strokeWidth: 2,
                }}
              />
              <span
                className="text-[10px] font-semibold"
                style={{
                  color: isActive ? "var(--nav-active-text, #5946C5)" : "var(--component-inactive-color)",
                }}
              >
                {item.labelFa}
              </span>
            </button>
          );
        })}

        <div className="relative overflow-visible" ref={settingsRef}>
          <button
            onClick={() => {
              setComingSoonOpen(false);
              setSettingsOpen(!settingsOpen);
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 py-4 rounded-[16px] transition-all duration-200 w-full",
              settingsOpen && "shadow-lg"
            )}
            style={{
              background: settingsOpen ? "var(--component-active-bg)" : "transparent",
              border: settingsOpen
                ? "1px solid rgba(124, 92, 252, 0.30)"
                : "1px solid transparent",
            }}
          >
            <Settings
              className="w-5 h-5"
              style={{
                color: settingsOpen ? "var(--nav-active, #7357E8)" : "var(--component-inactive-color)",
                strokeWidth: 2,
              }}
            />
            <span
              className="text-[10px] font-semibold"
              style={{
                color: settingsOpen ? "var(--nav-active-text, #5946C5)" : "var(--component-inactive-color)",
              }}
            >
              تنظیمات
            </span>
          </button>

          <SettingsPopup
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            currentTheme={theme}
            onThemeChange={handleThemeChange}
            placement="aside"
          />
        </div>
      </nav>

      {/* Smart routing → Coming soon */}
      <div className="relative mt-2" ref={comingSoonRef}>
        <button
          type="button"
          onClick={() => {
            setSettingsOpen(false);
            setComingSoonOpen(true);
          }}
          className="w-full rounded-[14px] p-3 text-center transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
          style={{
            background: "linear-gradient(145deg, rgba(124, 58, 237, 0.10), rgba(34, 211, 238, 0.04))",
            border: "1px solid rgba(139, 92, 246, 0.18)",
          }}
        >
          <div className="flex flex-col items-center gap-1.5">
            <Sparkles className="w-4 h-4" style={{ color: "#A855F7" }} />
            <div>
              <p className="text-[10px] font-bold" style={{ color: "var(--text-primary)" }}>
                مسیریابی
              </p>
              <p className="text-[10px] font-bold" style={{ color: "var(--text-primary)" }}>
                هوشمند
              </p>
            </div>
            <p className="text-[8px] leading-tight" style={{ color: "var(--text-muted)" }}>
              مسیریابی سریع، هوشمند و دقیق
            </p>
          </div>
        </button>

        <AnimatePresence>
          {comingSoonOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.94, x: 6 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.94, x: 6 }}
              className="absolute right-full bottom-0 mr-3 z-[200] w-56 rounded-[20px] p-4 border"
              style={{
                background: "var(--popup-bg)",
                borderColor: "var(--popup-border)",
                backdropFilter: "blur(28px)",
                boxShadow: "var(--popup-shadow)",
              }}
              dir="rtl"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" style={{ color: "#A855F7" }} />
                  <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    به زودی
                  </span>
                </div>
                <button
                  onClick={() => setComingSoonOpen(false)}
                  className="rounded-full p-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                قابلیت مسیریابی هوشمند پیشرفته به‌زودی اضافه می‌شود.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
