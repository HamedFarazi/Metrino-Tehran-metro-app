/**
 * Hook to manage Developer Easter Egg
 * Listens for F12 key press in production only
 */
import { useEffect, useState } from "react";

export function useDevEasterEgg() {
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  useEffect(() => {
    // Only in production
    if (!import.meta.env.PROD) {
      return;
    }

    // Track if we've already shown the easter egg this session
    let hasShown = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 key
      if (e.key === "F12" && !hasShown) {
        hasShown = true;
        setShowEasterEgg(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const closeEasterEgg = () => {
    setShowEasterEgg(false);
  };

  return {
    showEasterEgg,
    closeEasterEgg,
  };
}
