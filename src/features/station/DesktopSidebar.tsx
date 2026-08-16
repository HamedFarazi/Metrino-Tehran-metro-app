/**
 * DesktopSidebar — Right sidebar for desktop view.
 * All colors use semantic CSS variables so they follow the active theme.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  X, Star, Navigation, Share2, MapPin, ChevronLeft,
  Clock, MapPin as MapPinIcon,
} from "lucide-react";
import { useMetroStore } from "@/store/metro.store";
import { MetroDataService } from "@/services/metro-data.service";
import { MetroRouteService } from "@/services/metro-route.service";
import { LineBadge } from "@/components/shared/LineBadge";
import type { AmenityKey } from "@/types/metro";
import { cn } from "@/lib/utils";
import { AmenityIcon } from "./AmenityIcon";
import { stationImagesService } from "@/services/station-images.service";

export function DesktopSidebar() {
  const {
    selectedStation,
    isStationSheetOpen,
    isFavorite,
    addFavorite,
    removeFavorite,
    setOrigin,
    setDestination,
    originStation,
    closeStationSheet,
    openSearch,
    setCurrentRoute,
    setAlternativeRoutes,
    addRecentRoute,
  } = useMetroStore();

  if (!selectedStation || !isStationSheetOpen) return null;

  const fav = isFavorite(selectedStation.id);
  const stationImage = stationImagesService.getImageForStation(selectedStation);
  const activeAmenities = Object.entries(selectedStation.amenities)
    .filter(([, val]) => val === true)
    .map(([key]) => key as AmenityKey)
    .filter((key) => AmenityIcon[key]);

  const handleFavorite = () =>
    fav ? removeFavorite(selectedStation.id) : addFavorite(selectedStation.id);

  // Set this station as origin, then open destination search.
  // When destination is picked via SearchPanel → handleSelect → setDestination,
  // we also auto-calculate the route.
  const handleRouteFrom = () => {
    setOrigin(selectedStation);
    closeStationSheet();
    openSearch("destination");
  };

  // Set this station as destination.
  // If origin already set → calculate route immediately.
  const handleRouteTo = () => {
    setDestination(selectedStation);
    if (originStation) {
      const routes = MetroRouteService.calculateMultiple(originStation.id, selectedStation.id);
      if (routes.length > 0) {
        setAlternativeRoutes(routes);
        setCurrentRoute(routes[0].route);
        addRecentRoute(originStation.id, selectedStation.id);
      }
    }
    closeStationSheet();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: selectedStation.nameFa, url: window.location.href }).catch(() => {});
    }
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 32, stiffness: 320 }}
      className={cn(
        "fixed right-3 top-3 bottom-3 z-50",
        "w-[356px] max-w-[calc(90vw-12px)]",
        "rounded-3xl",
        "bg-card/96 backdrop-blur-2xl",
        "border border-border/60",
        "shadow-[-8px_0_40px_rgba(0,0,0,0.4)]",
        "overflow-y-auto scrollbar-thin",
      )}
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(128,128,128,0.18) transparent",
      }}
    >
      {/* Station Image */}
      {stationImage && <DesktopStationImage stationImage={stationImage} />}

      {/* Sticky Header */}
      <div className={cn(
        "sticky top-0 z-10 border-b border-border/50 bg-card/96 backdrop-blur-2xl",
        stationImage ? "" : "pt-2",
      )}>
        <div className="flex items-start justify-between px-5 py-4" dir="rtl">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedStation.lines.map((lineId) => (
                <LineBadge key={lineId} lineId={lineId} size="sm" showLabel />
              ))}
            </div>
            <h2 className="text-[22px] font-bold text-foreground leading-tight tracking-tight">
              {selectedStation.nameFa}
            </h2>
            <p className="text-[13px] text-foreground/40 mt-0.5 font-light">
              {selectedStation.name}
            </p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {selectedStation.type === "interchange" && (
                <span className="inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/25 px-2.5 py-0.5 text-xs text-amber-400">
                  ایستگاه تبادلی
                </span>
              )}
              {selectedStation.type === "terminal" && (
                <span className="inline-flex items-center rounded-full bg-purple-500/15 border border-purple-500/25 px-2.5 py-0.5 text-xs text-purple-400">
                  ایستگاه پایانه
                </span>
              )}
              {selectedStation.isDisabled && (
                <span className="inline-flex items-center rounded-full bg-red-500/15 border border-red-500/25 px-2.5 py-0.5 text-xs text-red-400">
                  موقتاً تعطیل
                </span>
              )}
            </div>
          </div>
          <button
            onClick={closeStationSheet}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/[0.07] text-foreground/45 hover:text-foreground hover:bg-foreground/[0.12] transition-all ml-3 mt-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4 space-y-5">

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5" dir="rtl">
          <SidebarBtn icon={<Navigation className="h-4 w-4" />} label="مبدا" onClick={handleRouteFrom} variant="primary" />
          <SidebarBtn icon={<MapPin className="h-4 w-4" />}       label="مقصد" onClick={handleRouteTo}   variant="secondary" />
          <SidebarBtn
            icon={<Star className={cn("h-4 w-4", fav && "fill-current")} />}
            label={fav ? "حذف" : "علاقه‌مندی‌ها"}
            onClick={handleFavorite}
            variant={fav ? "amber" : "ghost"}
          />
          <SidebarBtn icon={<Share2 className="h-4 w-4" />} label="اشتراک‌گذاری" onClick={handleShare} variant="ghost" />
        </div>

        {/* Address */}
        {selectedStation.address && (
          <div className="flex items-start gap-3 rounded-2xl bg-foreground/[0.04] border border-border/50 p-4" dir="rtl">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.06]">
              <MapPinIcon className="h-4 w-4 text-foreground/35" />
            </div>
            <p className="text-[13px] text-foreground/55 leading-relaxed pt-0.5 flex-1">
              {selectedStation.address}
            </p>
          </div>
        )}

        {/* Amenities */}
        {activeAmenities.length > 0 && (
          <div className="space-y-3" dir="rtl">
            <SidebarSectionTitle
              icon={<Clock className="h-3.5 w-3.5" />}
              title="امکانات ایستگاه"
              count={activeAmenities.length}
            />
            <div className="grid grid-cols-3 gap-2">
              {activeAmenities.map((key) => {
                const info = AmenityIcon[key]!;
                const Icon = info.icon;
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border border-border/40 p-3 text-center",
                      info.bg,
                    )}
                  >
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl bg-foreground/[0.06]", info.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] text-foreground/45 leading-tight">{info.labelFa}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Connected Stations */}
        <ConnectedStationsDesktop stationId={selectedStation.id} />

        <div className="h-4" />
      </div>
    </motion.div>
  );
}

// ─── Station Image ────────────────────────────────────────────────────────────

function DesktopStationImage({ stationImage }: {
  stationImage: { src: string; alt: string; metadata: { author: string; license: string; sourceUrl: string } };
}) {
  const [error, setError] = useState(false);
  if (error) return null;

  return (
    <div className="relative w-full h-[200px] overflow-hidden rounded-t-3xl">
      <img
        src={stationImage.src}
        alt={stationImage.alt}
        className="w-full h-full object-cover"
        loading="eager"
        onError={() => setError(true)}
      />
      {/* Gradient uses var(--color-card) so it blends with any theme */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, var(--color-card) 0%, transparent 60%)" }}
      />
      <div className="absolute bottom-3 left-3">
        <a
          href={stationImage.metadata.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/10"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
          <span className="text-[10px] text-white/65">
            {stationImage.metadata.license} · {stationImage.metadata.author}
          </span>
        </a>
      </div>
    </div>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────

function SidebarBtn({ icon, label, onClick, variant }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant: "primary" | "secondary" | "amber" | "ghost";
}) {
  // Use CSS-variable-based colors for primary/secondary so they adapt to theme
  const styles: Record<typeof variant, string> = {
    primary:   "bg-primary/15 border-primary/25 text-primary hover:bg-primary/25",
    secondary: "bg-[#30d158]/13 border-[#30d158]/22 text-[#30d158] hover:bg-[#30d158]/22",
    amber:     "bg-amber-500/13 border-amber-500/22 text-amber-400 hover:bg-amber-500/22",
    ghost:     "bg-foreground/[0.04] border-border/40 text-foreground/45 hover:bg-foreground/[0.08] hover:text-foreground/70",
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border py-3.5",
        "transition-all duration-150 active:scale-95",
        styles[variant],
      )}
    >
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

// ─── Section Title ────────────────────────────────────────────────────────────

function SidebarSectionTitle({ title, icon, count }: {
  title: string; icon: React.ReactNode; count?: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-foreground/30">{icon}</span>
        <h3 className="text-[12px] font-semibold text-foreground/42 uppercase tracking-wider">{title}</h3>
      </div>
      {count !== undefined && <span className="text-[11px] text-foreground/25">{count}</span>}
    </div>
  );
}

// ─── Connected Stations ───────────────────────────────────────────────────────

function ConnectedStationsDesktop({ stationId }: { stationId: string }) {
  const { openStationSheet } = useMetroStore();
  const connected = MetroDataService.getConnectedStations(stationId);
  if (connected.length === 0) return null;

  return (
    <div className="space-y-3" dir="rtl">
      <SidebarSectionTitle
        icon={<Navigation className="h-3.5 w-3.5" />}
        title="ایستگاه‌های مجاور"
        count={connected.length}
      />
      <div className="space-y-2">
        {connected.map((station) => (
          <button
            key={station.id}
            onClick={() => openStationSheet(station)}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-right",
              "bg-foreground/[0.04] border border-border/40",
              "transition-all hover:bg-foreground/[0.07]",
            )}
          >
            <div className="flex gap-1 shrink-0">
              {station.lines.map((l) => <LineBadge key={l} lineId={l} size="xs" />)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-foreground/72 truncate">{station.nameFa}</p>
              <p className="text-[11px] text-foreground/30 truncate">{station.name}</p>
            </div>
            <ChevronLeft className="h-4 w-4 text-foreground/20 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
