/**
 * usePWAInstall — Manages the PWA install prompt reliably.
 *
 * Problem: `beforeinstallprompt` fires ONCE and is consumed.
 * If you miss it or the user dismisses, it won't fire again in the same session.
 *
 * Solution:
 * - Capture the event immediately at module load time (before React mounts)
 * - Store it in a module-level variable so it's never lost
 * - Detect if already installed via `display-mode: standalone`
 * - Detect iOS separately (no beforeinstallprompt on Safari)
 */

// ── Module-level prompt capture — runs before React ──────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _deferredPrompt: any = null;
let _promptListeners: Array<() => void> = [];

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    _deferredPrompt = e;
    _promptListeners.forEach((fn) => fn());
  });
}

// ── Hook ──────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";

export type InstallState =
  | "not-available"   // already installed or not supported
  | "available"       // can show native prompt (Android/Chrome)
  | "ios"             // Safari — manual instruction needed
  | "installed";      // running in standalone mode

export function usePWAInstall() {
  const isStandalone =
    typeof window !== "undefined" &&
    window.matchMedia("(display-mode: standalone)").matches;

  const isIOS =
    typeof navigator !== "undefined" &&
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream;

  const [state, setState] = useState<InstallState>(() => {
    if (isStandalone) return "installed";
    if (_deferredPrompt) return "available";
    if (isIOS) return "ios";
    return "not-available";
  });

  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isStandalone) { setState("installed"); return; }

    // Listen for prompt becoming available
    const onPrompt = () => setState("available");
    _promptListeners.push(onPrompt);

    // Listen for successful install
    window.addEventListener("appinstalled", () => {
      setState("installed");
      _deferredPrompt = null;
    });

    return () => {
      _promptListeners = _promptListeners.filter((fn) => fn !== onPrompt);
    };
  }, [isStandalone]);

  const install = async () => {
    if (state === "ios") return; // handled by UI showing instructions
    if (!_deferredPrompt) return;

    setInstalling(true);
    try {
      await _deferredPrompt.prompt();
      const { outcome } = await _deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setState("installed");
        _deferredPrompt = null;
      }
    } finally {
      setInstalling(false);
    }
  };

  return { state, install, installing };
}
