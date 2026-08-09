/**
 * StationSheet — Premium glassmorphism bottom sheet for mobile, sidebar for desktop.
 */
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { StationSheetMobile } from "./StationSheetMobile";
import { DesktopSidebar } from "./DesktopSidebar";

export function StationSheet() {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return <DesktopSidebar />;
  }

  return <StationSheetMobile />;
}