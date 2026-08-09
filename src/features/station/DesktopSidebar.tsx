/**
 * DesktopSidebar — Right sidebar for desktop view.
 * Shows station details in a fixed sidebar on the right.
 */
import { motion } from "framer-motion";
import {
  X, Star, Navigation, Share2, MapPin, ChevronLeft,
  Clock, MapPin as MapPinIcon,
} from "lucide-react";
import { useMetroStore } from "@/store/metro.store";
import { MetroDataService } from "@/services/metro-data.service";
import { LineBadge } from "@/components/shared/LineBadge";
import type { AmenityKey } from "@/types/metro";
import { cn } from "@/lib/utils";
import { AmenityIcon } from "./AmenityIcon";

export function DesktopSidebar() {
  const {
    selectedStation,
    isStationSheetOpen,
    isFavorite,
    addFavorite,
    removeFavorite,
    setOrigin,
    setDestination,
    openSearch,
    closeStationSheet,
  } = useMetroStore();

  if (!selectedStation || !isStationSheetOpen) return null;

  const fav = isFavorite(selectedStation.id);
  const activeAmenities = Object.entries(selectedStation.amenities)
    .filter(([, val]) => val === true)
    .map(([key]) => key as AmenityKey)
    .filter((key) => AmenityIcon[key]);

  const handleFavorite = () => fav
    ? removeFavorite(selectedStation.id)
    : addFavorite(selectedStation.id);

  const handleRouteFrom = () => {
    setOrigin(selectedStation);
    closeStationSheet();
    openSearch("destination");
  };

  const handleRouteTo = () => {
    setDestination(selectedStation);
    closeStationSheet();
  };

  return (
    <>
      {/* Light overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/10 pointer-events-none"
      />

      {/* Sidebar */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-96 max-w-[90vw] bg-card/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl shadow-black/30 overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-2xl z-10 border-b border-white/10">
          <div className="flex items-center justify-between p-6" dir="rtl">
            <div className="flex-1 min-w-0">
              {/* Lines */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedStation.lines.map((lineId) => (
                  <LineBadge key={lineId} lineId={lineId} size="sm" showLabel />
                ))}
              </div>

              {/* Name */}
              <h2 className="text-2xl font-bold text-foreground leading-tight tracking-tight">
                {selectedStation.nameFa}
              </h2>
              <p className="text-sm text-foreground/40 mt-0.5 font-light">
                {selectedStation.name}
              </p>

              {/* Type badges */}
              <div className="flex gap-2 mt-2 flex-wrap">
                {selectedStation.type === "interchange" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/25 px-2.5 py-0.5 text-xs text-amber-400">
                    ایستگاه تبادلی
                  </span>
                )}
                {selectedStation.type === "terminal" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/25 px-2.5 py-0.5 text-xs text-purple-400">
                    ایستگاه پایانه
                  </span>
                )}
                {selectedStation.isDisabled && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/25 px-2.5 py-0.5 text-xs text-red-400">
                    موقتاً تعطیل
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={closeStationSheet}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-foreground/50 hover:text-foreground hover:bg-white/20 transition-all ml-3"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3" dir="rtl">
            <DesktopSidebarActionBtn
              icon={<Navigation className="h-5 w-5" />}
              label="مبدا"
              onClick={handleRouteFrom}
              color="emerald"
            />
            <DesktopSidebarActionBtn
              icon={<MapPin className="h-5 w-5" />}
              label="مقصد"
              onClick={handleRouteTo}
              color="cyan"
            />
            <DesktopSidebarActionBtn
              icon={<Star className={cn("h-5 w-5", fav && "fill-current")} />}
              label={fav ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
              onClick={handleFavorite}
              color={fav ? "amber" : "neutral"}
            />
            <DesktopSidebarActionBtn
              icon={<Share2 className="h-5 w-5" />}
              label="اشتراک گذاری"
              onClick={() => {}}
              color="neutral"
            />
          </div>

          {/* Address */}
          {selectedStation.address && (
            <div className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/10 p-4" dir="rtl">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <MapPinIcon className="h-5 w-5 text-foreground/40" />
              </div>
              <p className="text-sm text-foreground/60 leading-relaxed pt-1 flex-1">
                {selectedStation.address}
              </p>
            </div>
          )}

          {/* Amenities */}
          {activeAmenities.length > 0 && (
            <div className="space-y-3" dir="rtl">
              <DesktopSidebarSectionTitle
                icon={<Clock className="h-4 w-4" />}
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
                        "flex flex-col items-center gap-2 rounded-xl border border-white/10 p-3 text-center transition-all hover:bg-white/5",
                        info.bg
                      )}
                    >
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-white/10", info.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] text-foreground/50 leading-tight">
                        {info.labelFa}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Connected Stations */}
          <ConnectedStationsDesktop stationId={selectedStation.id} />
        </div>
      </motion.div>
    </>
  );
}

// ─── Desktop Sidebar Action Button ────────────────────────────────────────────

function DesktopSidebarActionBtn({
  icon, label, onClick, color,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: "emerald" | "cyan" | "amber" | "neutral";
}) {
  const styles = {
    emerald: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25",
    cyan:    "bg-cyan-500/15 border-cyan-500/25 text-cyan-400 hover:bg-cyan-500/25",
    amber:   "bg-amber-500/15 border-amber-500/25 text-amber-400 hover:bg-amber-500/25",
    neutral: "bg-white/5 border-white/10 text-foreground/60 hover:bg-white/10 hover:text-foreground",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border py-3 transition-all duration-200",
        styles[color]
      )}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

// ─── Desktop Sidebar Section Title ────────────────────────────────────────────

function DesktopSidebarSectionTitle({ title, icon, count }: { title: string; icon: React.ReactNode; count?: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-foreground/40">{icon}</span>
        <h3 className="text-sm font-semibold text-foreground/60">{title}</h3>
      </div>
      {count !== undefined && (
        <span className="text-xs text-foreground/30">{count}</span>
      )}
    </div>
  );
}

// ─── Connected Stations Desktop ───────────────────────────────────────────────

function ConnectedStationsDesktop({ stationId }: { stationId: string }) {
  const { openStationSheet } = useMetroStore();
  const connected = MetroDataService.getConnectedStations(stationId);

  if (connected.length === 0) return null;

  return (
    <div className="space-y-3" dir="rtl">
      <DesktopSidebarSectionTitle
        icon={<Navigation className="h-4 w-4" />}
        title="ایستگاه‌های مجاور"
        count={connected.length}
      />
      <div className="space-y-2">
        {connected.map((station) => (
          <button
            key={station.id}
            onClick={() => openStationSheet(station)}
            className="flex w-full items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 transition-all hover:bg-white/10"
          >
            <div className="flex gap-1 shrink-0">
              {station.lines.map((l) => (
                <LineBadge key={l} lineId={l} size="xs" />
              ))}
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-sm font-medium text-foreground/80 truncate">{station.nameFa}</p>
              <p className="text-xs text-foreground/30 truncate">{station.name}</p>
            </div>
            <ChevronLeft className="h-4 w-4 text-foreground/20 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}