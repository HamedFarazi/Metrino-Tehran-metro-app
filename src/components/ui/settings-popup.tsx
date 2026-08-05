/**
 * SettingsPopup — Theme selector + PWA install button.
 */
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sun, Moon, Monitor, Waves, Download, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export type ThemeMode = "dark" | "light" | "system" | "darya";

interface SettingsPopupProps {
  open: boolean;
  onClose: () => void;
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

const THEMES: { id: ThemeMode; labelFa: string; icon: React.ElementType; accent: string }[] = [
  { id: "dark",   labelFa: "تاریک",  icon: Moon,    accent: "text-slate-300"  },
  { id: "light",  labelFa: "روشن",   icon: Sun,     accent: "text-amber-400"  },
  { id: "system", labelFa: "سیستم",  icon: Monitor, accent: "text-sky-400"    },
  { id: "darya",  labelFa: "دریا",   icon: Waves,   accent: "text-indigo-400" },
];

export function SettingsPopup({ open, onClose, currentTheme, onThemeChange }: SettingsPopupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { state: installState, install, installing, canShow } = usePWAInstall();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ type: "spring", damping: 24, stiffness: 320 }}
          className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 w-60 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/90 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.4)] p-3"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-medium text-[var(--color-foreground)]/60">تنظیمات</span>
            <button
              onClick={onClose}
              className="flex h-5 w-5 items-center justify-center rounded-full text-[var(--color-foreground)]/30 hover:text-[var(--color-foreground)] transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* PWA Install section */}
          {canShow && (
            <>
              <p className="text-[10px] text-[var(--color-foreground)]/30 uppercase tracking-wider px-1 mb-2">
                نصب برنامه
              </p>
              <div className="mb-3">
                {installState === "installed" ? null : installState === "available" ? (
                  /* Chrome/Android — native prompt */
                  <button
                    onClick={install}
                    disabled={installing}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all",
                      "bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/25",
                      "hover:bg-[var(--color-primary)]/20 active:scale-95",
                      installing && "opacity-60 pointer-events-none"
                    )}
                  >
                    <Download className={cn(
                      "h-4 w-4 shrink-0",
                      installing ? "animate-bounce text-[var(--color-primary)]" : "text-[var(--color-primary)]"
                    )} />
                    <span className="flex-1 text-right text-[var(--color-foreground)] font-medium">
                      {installing ? "در حال نصب…" : "نصب برنامه"}
                    </span>
                  </button>
                ) : installState === "ios" ? (
                  /* iOS Safari — manual steps */
                  <div className="flex flex-col gap-1.5 rounded-xl px-3 py-2.5 bg-sky-500/10 border border-sky-500/20">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-sky-400 shrink-0" />
                      <span className="text-xs text-sky-400 font-medium">نصب در iOS</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-foreground)]/50 leading-relaxed">
                      Safari ← دکمه Share ← «Add to Home Screen»
                    </p>
                  </div>
                ) : (
                  /* manual — browser supports SW but no auto-prompt yet */
                  <div className="flex flex-col gap-1.5 rounded-xl px-3 py-2.5 bg-[var(--color-primary)]/8 border border-[var(--color-primary)]/15">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
                      <span className="text-xs text-[var(--color-foreground)]/80 font-medium">نصب برنامه</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-foreground)]/45 leading-relaxed">
                      منوی مرورگر ← «Install app» یا «Add to Home Screen»
                    </p>
                  </div>
                )}
              </div>
              <div className="h-px bg-[var(--color-border)]/50 mx-1 mb-3" />
            </>
          )}

          {/* Theme section */}
          <p className="text-[10px] text-[var(--color-foreground)]/30 uppercase tracking-wider px-1 mb-2">
            تم
          </p>
          <div className="flex flex-col gap-1">
            {THEMES.map(({ id, labelFa, icon: Icon, accent }) => {
              const isActive = currentTheme === id;
              return (
                <button
                  key={id}
                  onClick={() => { onThemeChange(id); onClose(); }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                    isActive
                      ? "bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20"
                      : "text-[var(--color-foreground)]/60 hover:bg-[var(--color-foreground)]/6 hover:text-[var(--color-foreground)] border border-transparent"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? accent : "")} />
                  <span className={cn(
                    "flex-1 text-right text-[var(--color-foreground)]",
                    isActive ? "font-medium" : "opacity-70"
                  )}>
                    {labelFa}
                  </span>
                  {isActive && (
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", accent.replace("text-", "bg-"))} />
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
