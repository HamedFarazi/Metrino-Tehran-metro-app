import { useEffect, useState } from "react";

/**
 * Hook for checking media queries
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

/**
 * Hook for checking if the device is desktop (width >= 1024px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

/**
 * Hook for checking if the device is tablet (width >= 768px)
 */
export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 768px)");
}

/**
 * Hook for checking if the device is mobile (width < 768px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}