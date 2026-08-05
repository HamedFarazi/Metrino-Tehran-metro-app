/**
 * StationSheet — Premium glassmorphism bottom sheet.
 * Lucide icons, glass cards, smooth animations.
 */
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Star, Navigation, Share2, MapPin, ChevronLeft,
  Wifi, CreditCard, Bike, Accessibility,
  ShieldCheck, Camera, Coffee, ShoppingCart, Utensils,
  Droplets, Flame, Siren, Armchair, Trash2, Wind,
  PawPrint, BookOpen, Ticket, Users, Clock, ArrowUpDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMetroStore } from "@/store/metro.store";
import { MetroDataService } from "@/services/metro-data.service";
import { LineBadge } from "@/components/shared/LineBadge";
import type { AmenityKey } from "@/types/metro";
import { cn } from "@/lib/utils";

// ─── Amenity icon map ─────────────────────────────────────────────────────────

type AmenityInfo = {
  icon: LucideIcon;
  labelFa: string;
  color: string;
  bg: string;
};

const AMENITY_MAP: Partial<Record<AmenityKey, AmenityInfo>> = {
  atm:                  { icon: CreditCard,   labelFa: "خودپرداز",          color: "text-emerald-400", bg: "bg-emerald-500/10" },
  restroom:             { icon: Users,         labelFa: "سرویس بهداشتی",    color: "text-blue-400",    bg: "bg-blue-500/10" },
  coffeeShop:           { icon: Coffee,        labelFa: "کافه",              color: "text-amber-400",   bg: "bg-amber-500/10" },
  fastFood:             { icon: Utensils,      labelFa: "فست‌فود",           color: "text-orange-400",  bg: "bg-orange-500/10" },
  cleanFood:            { icon: Flame,         labelFa: "غذای سالم",         color: "text-green-400",   bg: "bg-green-500/10" },
  groceryStore:         { icon: ShoppingCart,  labelFa: "فروشگاه",           color: "text-purple-400",  bg: "bg-purple-500/10" },
  elevator:             { icon: ArrowUpDown,   labelFa: "آسانسور",           color: "text-cyan-400",    bg: "bg-cyan-500/10" },
  blindPath:            { icon: Accessibility, labelFa: "مسیر نابینایان",    color: "text-indigo-400",  bg: "bg-indigo-500/10" },
  bicycleParking:       { icon: Bike,          labelFa: "پارکینگ دوچرخه",   color: "text-lime-400",    bg: "bg-lime-500/10" },
  freeWifi:             { icon: Wifi,          labelFa: "وای‌فای رایگان",    color: "text-sky-400",     bg: "bg-sky-500/10" },
  prayerRoom:           { icon: BookOpen,      labelFa: "نمازخانه",          color: "text-teal-400",    bg: "bg-teal-500/10" },
  metroPolice:          { icon: ShieldCheck,   labelFa: "پلیس مترو",         color: "text-red-400",     bg: "bg-red-500/10" },
  camera:               { icon: Camera,        labelFa: "دوربین مداربسته",   color: "text-slate-400",   bg: "bg-slate-500/10" },
  waitingChair:         { icon: Armchair,      labelFa: "صندلی انتظار",      color: "text-rose-400",    bg: "bg-rose-500/10" },
  creditTicketSales:    { icon: Ticket,        labelFa: "فروش بلیت اعتباری", color: "text-violet-400",  bg: "bg-violet-500/10" },
  waterCooler:          { icon: Droplets,      labelFa: "آبسردکن",           color: "text-blue-300",    bg: "bg-blue-400/10" },
  trashCan:             { icon: Trash2,        labelFa: "سطل زباله",          color: "text-zinc-400",    bg: "bg-zinc-500/10" },
  fireSuppressionSystem:{ icon: Siren,         labelFa: "سیستم اطفاء حریق",  color: "text-red-300",     bg: "bg-red-400/10" },
  fireExtinguisher:     { icon: Flame,         labelFa: "کپسول آتش‌نشانی",   color: "text-orange-300",  bg: "bg-orange-400/10" },
  smokingArea:          { icon: Wind,          labelFa: "منطقه سیگار",       color: "text-gray-400",    bg: "bg-gray-500/10" },
  petsAllowed:          { icon: PawPrint,      labelFa: "ورود حیوانات",      color: "text-yellow-400",  bg: "bg-yellow-500/10" },
};

// ─── Sheet ────────────────────────────────────────────────────────────────────

export function StationSheet() {
  const {
    isStationSheetOpen,
    selectedStation,
    closeStationSheet,
    isFavorite,
    addFavorite,
    removeFavorite,
    setOrigin,
    setDestination,
    openSearch,
  } = useMetroStore();

  if (!selectedStation) return null;

  const fav = isFavorite(selectedStation.id);
  const activeAmenities = Object.entries(selectedStation.amenities)
    .filter(([, val]) => val === true)
    .map(([key]) => key as AmenityKey)
    .filter((key) => AMENITY_MAP[key]);

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
    <AnimatePresence>
      {isStationSheetOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={closeStationSheet}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 380 }}
            className="fixed bottom-0 inset-x-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-card/80 backdrop-blur-2xl border-t border-white/10"
            style={{ boxShadow: "0 -20px 60px rgba(0,0,0,0.5)" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-card/80 backdrop-blur-2xl z-10">
              <div className="h-1 w-12 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4" dir="rtl">
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
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-foreground/50 hover:text-foreground hover:bg-white/20 transition-all ml-3"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 px-5 pb-5" dir="rtl">
              <GlassActionBtn
                icon={<Navigation className="h-4 w-4" />}
                label="مبدا"
                onClick={handleRouteFrom}
                color="emerald"
              />
              <GlassActionBtn
                icon={<MapPin className="h-4 w-4" />}
                label="مقصد"
                onClick={handleRouteTo}
                color="cyan"
              />
              <GlassActionBtn
                icon={<Star className={cn("h-4 w-4", fav && "fill-current")} />}
                label={fav ? "حذف" : "ذخیره"}
                onClick={handleFavorite}
                color={fav ? "amber" : "neutral"}
              />
              <GlassActionBtn
                icon={<Share2 className="h-4 w-4" />}
                label="اشتراک"
                onClick={() => {}}
                color="neutral"
              />
            </div>

            {/* Divider */}
            <div className="mx-5 h-px bg-white/5 mb-4" />

            {/* Address */}
            {selectedStation.address && (
              <div className="mx-5 mb-4 flex items-start gap-3 rounded-2xl bg-white/5 border border-white/8 p-4" dir="rtl">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <MapPin className="h-4 w-4 text-foreground/40" />
                </div>
                <p className="text-sm text-foreground/60 leading-relaxed pt-0.5">
                  {selectedStation.address}
                </p>
              </div>
            )}

            {/* Amenities */}
            {activeAmenities.length > 0 && (
              <div className="px-5 pb-5" dir="rtl">
                <SectionTitle
                  count={activeAmenities.length}
                  icon={<Clock className="h-3.5 w-3.5" />}
                  title="امکانات"
                />
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {activeAmenities.map((key) => {
                    const info = AMENITY_MAP[key]!;
                    const Icon = info.icon;
                    return (
                      <div
                        key={key}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-2xl border border-white/8 p-3 text-center transition-all",
                          info.bg
                        )}
                      >
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl bg-white/10", info.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] text-foreground/50 leading-tight">
                          {info.labelFa}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="mx-5 h-px bg-white/5 mb-4" />

            {/* Connected Stations */}
            <ConnectedStations stationId={selectedStation.id} />

            {/* Bottom padding */}
            <div className="h-8" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Glass Action Button ──────────────────────────────────────────────────────

function GlassActionBtn({
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
    neutral: "bg-white/8 border-white/10 text-foreground/50 hover:bg-white/15 hover:text-foreground",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center gap-2 rounded-2xl border py-3.5 transition-all duration-200",
        styles[color]
      )}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

// ─── Section Title ────────────────────────────────────────────────────────────

function SectionTitle({ title, icon, count }: { title: string; icon: React.ReactNode; count?: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-foreground/30">{icon}</span>
        <h3 className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">{title}</h3>
      </div>
      {count !== undefined && (
        <span className="text-xs text-foreground/30">{count}</span>
      )}
    </div>
  );
}

// ─── Connected Stations ───────────────────────────────────────────────────────

function ConnectedStations({ stationId }: { stationId: string }) {
  const { openStationSheet } = useMetroStore();
  const connected = MetroDataService.getConnectedStations(stationId);

  if (connected.length === 0) return null;

  return (
    <div className="px-5 pb-4" dir="rtl">
      <SectionTitle
        icon={<Navigation className="h-3.5 w-3.5" />}
        title="ایستگاه‌های مجاور"
        count={connected.length}
      />
      <div className="mt-3 space-y-2">
        {connected.map((station) => (
          <button
            key={station.id}
            onClick={() => openStationSheet(station)}
            className="flex w-full items-center gap-3 rounded-2xl bg-white/5 border border-white/8 px-4 py-3 transition-all hover:bg-white/10 text-right"
          >
            {/* Line color indicator */}
            <div className="flex gap-1 shrink-0">
              {station.lines.map((l) => (
                <LineBadge key={l} lineId={l} size="xs" />
              ))}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
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
