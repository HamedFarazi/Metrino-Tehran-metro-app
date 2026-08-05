/**
 * usePWAInstall — Manages the PWA install prompt reliably.
 *
 * Known issues this solves:
 * 1. `beforeinstallprompt` fires ONCE — captured at module level before React
 * 2. Event may fire before component mounts — module-level variable preserves it
 * 3. Vercel SPA rewrite may block sw.js — handled via vercel.json
 * 4. iOS has no beforeinstallprompt — detected separately
 * 5. Already installed — detected via display-mode: standalone
 * 6. "not-available" hiding button — now shows manual instructions as fallback
 */

// ── Module-level — runs synchronously before React mounts ────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _deferredPrompt: any = null;
let _promptListeners: Array<() => void> = [];

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    _deferredPrompt = e;
    // Notify any mounted hooks
    _promptListeners.forEach((fn) => fn());
  });
}

// ── Hook ──────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";

export type InstallState =
  | "available"    // beforeinstallprompt captured — show install button
  | "ios"          // Safari iOS — show manual instructions
  | "installed"    // running as standalone PWA
  | "manual"       // browser doesn't support auto-prompt, show manual guide
  | "unsupported"; // no PWA support at all (very old browsers)

function detectInitialState(): InstallState {
  if (typeof window === "undefined") return "unsupported";

  // Already installed as PWA
  if (window.matchMedia("(display-mode: standalone)").matches) return "installed";
  // iOS Safari
  if (/iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream) return "ios";
  // Chrome/Edge Android — prompt already captured
  if (_deferredPrompt) return "available";
  // Secure context required for PWA
  if (!window.isSecureContext) return "unsupported";
  // SW supported — show manual guide as fallback
  if ("serviceWorker" in navigator) return "manual";

  return "unsupported";
}

export function usePWAInstall() {
  const [state, setState] = useState<InstallState>(detectInitialState);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Re-check on mount in case state changed
    const current = detectInitialState();
    if (current !== state) setState(current);

    // Listen for prompt becoming available after mount
    const onPrompt = () => setState("available");
    _promptListeners.push(onPrompt);

    // Listen for successful install
    const onInstalled = () => {
      setState("installed");
      _deferredPrompt = null;
    };
    window.addEventListener("appinstalled", onInstalled);

    // Listen for display-mode change (user installs via browser menu)
    const mq = window.matchMedia("(display-mode: standalone)");
    const onStandalone = (e: MediaQueryListEvent) => {
      if (e.matches) setState("installed");
    };
    mq.addEventListener("change", onStandalone);

    return () => {
      _promptListeners = _promptListeners.filter((fn) => fn !== onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      mq.removeEventListener("change", onStandalone);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const install = async (): Promise<boolean> => {
    if (!_deferredPrompt) return false;
    setInstalling(true);
    try {
      await _deferredPrompt.prompt();
      const { outcome } = await _deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setState("installed");
        _deferredPrompt = null;
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setInstalling(false);
    }
  };

  /** True if there's anything useful to show the user */
  const canShow = state !== "unsupported" && state !== "installed";

  return { state, install, installing, canShow };
}
