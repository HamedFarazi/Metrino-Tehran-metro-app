/**
 * SettingsPopup — Theme selector + PWA install button.
 */
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sun, Moon, Monitor, Download, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export type ThemeMode = "dark" | "light" | "system";

interface SettingsPopupProps {
  open: boolean;
  onClose: () => void;
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  /** above = bottom nav; aside = desktop sidebar (open to the right) */
  placement?: "above" | "aside";
}

const THEMES: { id: ThemeMode; labelFa: string; icon: React.ElementType; accent: string }[] = [
  { id: "dark",   labelFa: "تاریک",  icon: Moon,    accent: "text-slate-300"  },
  { id: "light",  labelFa: "روشن",   icon: Sun,     accent: "text-amber-400"  },
  { id: "system", labelFa: "سیستم",  icon: Monitor, accent: "text-sky-400"    },
];

export function SettingsPopup({
  open,
  onClose,
  currentTheme,
  onThemeChange,
  placement = "above",
}: SettingsPopupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { state: installState, install, installing, canShow } = usePWAInstall();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const positionClass =
    placement === "aside"
      ? "absolute right-full top-0 mr-3 z-[200]"
      : "absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-[200]";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{
            opacity: 0,
            scale: 0.92,
            y: placement === "aside" ? 0 : 10,
            x: placement === "aside" ? 8 : 0,
          }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          exit={{
            opacity: 0,
            scale: 0.92,
            y: placement === "aside" ? 0 : 10,
            x: placement === "aside" ? 8 : 0,
          }}
          transition={{ type: "spring", damping: 24, stiffness: 320 }}
          className={cn(
            "w-60 rounded-[22px] p-4 border",
            positionClass
          )}
          dir="rtl"
          style={{
            background: "var(--popup-bg)",
            borderColor: "var(--popup-border)",
            backdropFilter: "blur(28px) saturate(160%)",
            WebkitBackdropFilter: "blur(28px) saturate(160%)",
            boxShadow: "var(--popup-shadow)",
            color: "var(--text-primary)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>تنظیمات</span>
            <button
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded-full transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {canShow && (
            <>
              <p className="text-[10px] uppercase tracking-wider mb-2.5" style={{ color: "var(--text-muted)" }}>
                نصب برنامه
              </p>
              <div className="mb-3">
                {installState === "installed" ? null : installState === "available" ? (
                  <button
                    onClick={install}
                    disabled={installing}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm transition-all active:scale-95"
                    style={{
                      background: "var(--component-active-bg)",
                      border: "1px solid rgba(124, 92, 252, 0.30)",
                    }}
                  >
                    <Download className={cn("h-4 w-4 shrink-0", installing && "animate-bounce")} style={{ color: "var(--color-primary)" }} />
                    <span className="flex-1 text-right font-medium" style={{ color: "var(--text-primary)" }}>
                      {installing ? "در حال نصب…" : "نصب برنامه"}
                    </span>
                  </button>
                ) : installState === "ios" ? (
                  <div className="flex flex-col gap-2 rounded-xl px-3.5 py-3" style={{
                    background: "rgba(22, 199, 232, 0.10)",
                    border: "1px solid rgba(22, 199, 232, 0.25)",
                  }}>
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 shrink-0" style={{ color: "#16C7E8" }} />
                      <span className="text-xs font-medium" style={{ color: "#16C7E8" }}>نصب در iOS</span>
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      Safari ← دکمه Share ← «Add to Home Screen»
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 rounded-xl px-3.5 py-3" style={{
                    background: "var(--component-active-bg)",
                    border: "1px solid rgba(124, 92, 252, 0.20)",
                  }}>
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 shrink-0" style={{ color: "var(--color-primary)" }} />
                      <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>نصب برنامه</span>
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      منوی مرورگر ← «Install app» یا «Add to Home Screen»
                    </p>
                  </div>
                )}
              </div>
              <div className="h-px mb-3" style={{ background: "var(--color-border)" }} />
            </>
          )}

          <p className="text-[10px] uppercase tracking-wider mb-2.5" style={{ color: "var(--text-muted)" }}>
            تم
          </p>
          <div className="flex flex-col gap-1.5">
            {THEMES.map(({ id, labelFa, icon: Icon, accent }) => {
              const isActive = currentTheme === id;
              return (
                <button
                  key={id}
                  onClick={() => { onThemeChange(id); onClose(); }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
                  style={{
                    background: isActive ? "var(--component-active-bg)" : "transparent",
                    border: isActive ? "1px solid rgba(124, 92, 252, 0.30)" : "1px solid transparent",
                  }}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? accent : "")}
                    style={{ color: isActive ? undefined : "var(--text-muted)" }} />
                  <span className="flex-1 text-right"
                    style={{
                      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                      fontWeight: isActive ? 600 : 400,
                    }}>
                    {labelFa}
                  </span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: "var(--color-primary)" }} />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
