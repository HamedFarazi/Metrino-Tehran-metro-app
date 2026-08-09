/**
 * StationSheet — Premium glassmorphism bottom sheet for mobile, popup for desktop.
 */
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { useMetroStore } from "@/store/metro.store";
import { StationSheetMobile } from "./StationSheetMobile";
import { DesktopStationPopup } from "./DesktopStationPopup";

export function StationSheet() {
  const isDesktop = useIsDesktop();
  const { closeStationSheet } = useMetroStore();

  if (isDesktop) {
    return <DesktopStationPopup onClose={closeStationSheet} />;
  }

  return <StationSheetMobile />;
}