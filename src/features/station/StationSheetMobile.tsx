/**
 * StationSheetMobile — Apple Maps-inspired bottom sheet (mobile only)
 *
 * Drag behaviour:
 *   - Fully pixel-based via useMotionValue so drag feels 1:1 with finger
 *   - Two snap points: COLLAPSED (~48 % of screen) and EXPANDED (~92 %)
 *   - Velocity-aware snap: fast flick snaps even with small offset
 *   - Drag handle + drag on the sheet itself
 *
 * Backdrop:
 *   - First tap  → collapse sheet (if expanded)
 *   - Second tap → close sheet
 */
import { useState, useRef, useEffect, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import {
  X, Star, Navigation, Share2, MapPin,
  ChevronLeft, ChevronDown, ChevronUp,
} from "lucide-react";
import { useMetroStore } from "@/store/metro.store";
import { MetroDataService } from "@/services/metro-data.service";
import { MetroRouteService } from "@/services/metro-route.service";
import { LineBadge } from "@/components/shared/LineBadge";
import type { AmenityKey } from "@/types/metro";
import { cn } from "@/lib/utils";
import { AmenityIcon } from "./AmenityIcon";
import { stationImagesService } from "@/services/station-images.service";

// ─── Constants ────────────────────────────────────────────────────────────────
/** Fraction of viewport height the sheet occupies in each snap state */
const COLLAPSED_RATIO = 0.50; // sheet height ≈ 50 vh
const EXPANDED_RATIO  = 0.92; // sheet height ≈ 92 vh

/** px offset from drag‑end to decide direction */
const DRAG_THRESHOLD_PX  = 50;
/** px/s velocity threshold — fast flick always snaps */
const VELOCITY_THRESHOLD = 400;

/** Spring config for Y animation — feels heavier/more natural */
const SPRING_Y = { type: "spring" as const, damping: 45, stiffness: 480, mass: 1 };

// ─── Component ────────────────────────────────────────────────────────────────
export function StationSheetMobile() {
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
    openStationSheet,
    originStation,
    setCurrentRoute,
    addRecentRoute,
  } = useMetroStore();

  // ── snap state ──────────────────────────────────────────────────────────────
  const [isExpanded, setIsExpanded]     = useState(false);
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  // backdrop tap count — first tap collapses, second closes
  const backdropTapsRef = useRef(0);

  // ── pixel-level motion value for `top` position ─────────────────────────────
  // sheet is position: fixed, bottom: 0. We animate `top` so the sheet
  // grows/shrinks from the bottom naturally.
  const topMV = useMotionValue(window.innerHeight); // starts off-screen

  // ── derived backdrop opacity ─────────────────────────────────────────────────
  const backdropOpacity = useTransform(
    topMV,
    [window.innerHeight * (1 - EXPANDED_RATIO), window.innerHeight * (1 - COLLAPSED_RATIO)],
    [0.55, 0.2],
  );

  // ── snap helpers ────────────────────────────────────────────────────────────
  const snapTo = useCallback(
    (expanded: boolean) => {
      const vh = window.innerHeight;
      const targetTop = expanded
        ? vh * (1 - EXPANDED_RATIO)
        : vh * (1 - COLLAPSED_RATIO);
      animate(topMV, targetTop, SPRING_Y);
      setIsExpanded(expanded);
    },
    [topMV],
  );

  // ── open / close animation ──────────────────────────────────────────────────
  useEffect(() => {
    if (isStationSheetOpen) {
      // reset internal state on each open
      setIsExpanded(false);
      setAmenitiesOpen(false);
      backdropTapsRef.current = 0;
      // animate in from below
      const vh = window.innerHeight;
      topMV.set(vh); // start off-screen
      animate(topMV, vh * (1 - COLLAPSED_RATIO), SPRING_Y);
    } else {
      // animate out
      animate(topMV, window.innerHeight, SPRING_Y);
    }
  }, [isStationSheetOpen, topMV]);

  // keep snap position when station changes
  const prevIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedStation) return;
    if (selectedStation.id !== prevIdRef.current) {
      prevIdRef.current = selectedStation.id;
      setIsExpanded(false);
      setAmenitiesOpen(false);
      // re-snap to collapsed
      const vh = window.innerHeight;
      animate(topMV, vh * (1 - COLLAPSED_RATIO), SPRING_Y);
    }
  }, [selectedStation, topMV]);

  // ── close ───────────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    animate(topMV, window.innerHeight, SPRING_Y).then(() => {
      setIsExpanded(false);
      setAmenitiesOpen(false);
      backdropTapsRef.current = 0;
      closeStationSheet();
    });
  }, [topMV, closeStationSheet]);

  // ── backdrop tap logic ───────────────────────────────────────────────────────
  const handleBackdropTap = useCallback(() => {
    if (isExpanded) {
      // first tap → collapse
      snapTo(false);
    } else {
      // sheet is already collapsed → close
      handleClose();
    }
  }, [isExpanded, snapTo, handleClose]);

  // ── drag on sheet ────────────────────────────────────────────────────────────
  const dragStartTopRef = useRef(0);

  const handleDragStart = useCallback(() => {
    dragStartTopRef.current = topMV.get();
  }, [topMV]);

  const handleDrag = useCallback(
    (_: PointerEvent, info: { delta: { y: number } }) => {
      const vh = window.innerHeight;
      const minTop = vh * (1 - EXPANDED_RATIO);
      const maxTop = vh * (1 - COLLAPSED_RATIO);
      const next = Math.min(Math.max(topMV.get() + info.delta.y, minTop - 30), maxTop + 60);
      topMV.set(next);
    },
    [topMV],
  );

  const handleDragEnd = useCallback(
    (_: PointerEvent, info: { offset: { y: number }; velocity: { y: number } }) => {
      const { offset, velocity } = info;
      const fastFlick = Math.abs(velocity.y) > VELOCITY_THRESHOLD;

      if (fastFlick) {
        if (velocity.y < 0) snapTo(true);          // flick up → expand
        else if (isExpanded) snapTo(false);         // flick down from expanded → collapse
        else handleClose();                         // flick down from collapsed → close
      } else {
        if (offset.y < -DRAG_THRESHOLD_PX) snapTo(true);
        else if (offset.y > DRAG_THRESHOLD_PX) {
          if (isExpanded) snapTo(false);
          else handleClose();
        } else {
          // small nudge — snap back to current state
          snapTo(isExpanded);
        }
      }
    },
    [isExpanded, snapTo, handleClose],
  );

  // ── guards ───────────────────────────────────────────────────────────────────
  if (!selectedStation) return null;

  const stationImage   = stationImagesService.getImageForStation(selectedStation);
  const fav            = isFavorite(selectedStation.id);
  const activeAmenities = Object.entries(selectedStation.amenities)
    .filter(([, v]) => v === true)
    .map(([k]) => k as AmenityKey)
    .filter((k) => AmenityIcon[k]);
  const connected = MetroDataService.getConnectedStations(selectedStation.id);

  const handleFavorite   = () => fav ? removeFavorite(selectedStation.id) : addFavorite(selectedStation.id);
  const handleRouteFrom  = () => { setOrigin(selectedStation);      handleClose(); openSearch("destination"); };
  const handleRouteTo    = () => { 
    setDestination(selectedStation);
    // If origin already set, auto-calculate route
    if (originStation) {
      const route = MetroRouteService.calculate(originStation.id, selectedStation.id);
      if (route) {
        setCurrentRoute(route);
        addRecentRoute(originStation.id, selectedStation.id);
      }
    }
    handleClose();
  };
  const handleShare      = () => {
    if (navigator.share) {
      navigator.share({ title: selectedStation.nameFa, text: `ایستگاه مترو ${selectedStation.nameFa}`, url: window.location.href }).catch(() => {});
    }
  };

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {isStationSheetOpen && (
        <>
          {/* ── Backdrop ─────────────────────────────────────────────────── */}
          <motion.div
            key="sheet-backdrop"
            style={{ opacity: backdropOpacity }}
            className="fixed inset-0 z-40 bg-black"
            onTap={handleBackdropTap}
            // allow pointer events only on the backdrop, not on the sheet
          />

          {/* ── Sheet ────────────────────────────────────────────────────── */}
          <motion.div
            key="sheet-panel"
            style={{ top: topMV }}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50",
              "rounded-t-[28px]",
              "bg-[#1c1c1e]/93 backdrop-blur-2xl",
              "border-t border-white/[0.08]",
              "overflow-hidden select-none",
            )}
            css-shadow=""
            aria-modal="true"
            role="dialog"
            // Framer drag on the whole sheet
            drag="y"
            dragListener={!isExpanded}      // only drag-anywhere when collapsed
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0}                 // we control bounds manually in onDrag
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
          >
            {/* inner scroll wrapper — only scrollable when expanded */}
            <div
              className={cn(
                "h-full",
                isExpanded ? "overflow-y-auto overscroll-contain" : "overflow-hidden",
              )}
              style={{
                paddingBottom: "env(safe-area-inset-bottom, 16px)",
                maxHeight: `${EXPANDED_RATIO * 100}vh`,
              }}
            >
              {/* ── Drag Handle ───────────────────────────────────────── */}
              <div
                className="flex justify-center pt-[10px] pb-2 cursor-grab active:cursor-grabbing touch-none"
                // tap handle to toggle expand/collapse
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => snapTo(!isExpanded)}
              >
                <div
                  className="h-[4px] w-[36px] rounded-full bg-white/25 transition-all duration-300"
                  style={{ width: isExpanded ? 28 : 36 }}
                />
              </div>

              {/* ── Header ────────────────────────────────────────────── */}
              <div className="relative flex items-center justify-center px-4 pb-3 pt-1">
                {/* Share — left */}
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={handleShare}
                  className="absolute left-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-white/50 hover:text-white hover:bg-white/15 active:scale-90 transition-all"
                  aria-label="اشتراک‌گذاری"
                >
                  <Share2 className="h-[15px] w-[15px]" />
                </button>

                {/* Station name — center */}
                <div className="flex flex-col items-center px-12 min-w-0 max-w-[72%]">
                  <h2
                    className="text-[17px] font-bold text-white leading-snug tracking-tight text-center truncate w-full"
                    dir="rtl"
                  >
                    {selectedStation.nameFa}
                  </h2>
                  <p className="text-[11.5px] text-white/38 font-light mt-0.5 tracking-wide">
                    {selectedStation.name}
                  </p>
                </div>

                {/* Close — right */}
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={handleClose}
                  className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-white/50 hover:text-white hover:bg-white/15 active:scale-90 transition-all"
                  aria-label="بستن"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* ── Line Badges ───────────────────────────────────────── */}
              <div className="flex justify-center gap-2 pb-3 px-5 flex-wrap" dir="rtl">
                {selectedStation.lines.map((lineId) => (
                  <LineBadge key={lineId} lineId={lineId} size="sm" showLabel />
                ))}
                {selectedStation.type === "interchange" && (
                  <span className="inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/25 px-2.5 py-0.5 text-[11px] text-amber-400">
                    تبادلی
                  </span>
                )}
                {selectedStation.type === "terminal" && (
                  <span className="inline-flex items-center rounded-full bg-purple-500/15 border border-purple-500/25 px-2.5 py-0.5 text-[11px] text-purple-400">
                    پایانه
                  </span>
                )}
                {selectedStation.isDisabled && (
                  <span className="inline-flex items-center rounded-full bg-red-500/15 border border-red-500/25 px-2.5 py-0.5 text-[11px] text-red-400">
                    تعطیل
                  </span>
                )}
              </div>

              {/* ── Action Buttons ────────────────────────────────────── */}
              <div
                className="px-4 pb-4"
                dir="rtl"
                onPointerDown={(e) => e.stopPropagation()}
              >
                {/* Primary row — large pill buttons */}
                <div className="flex gap-3 mb-2.5">
                  <ActionButton icon={<Navigation className="h-[18px] w-[18px]" />}  label="مبدا"  onClick={handleRouteFrom} variant="primary" />
                  <ActionButton icon={<MapPin className="h-[18px] w-[18px]" />}       label="مقصد"  onClick={handleRouteTo}   variant="secondary" />
                </div>
                {/* Secondary row — compact ghost buttons */}
                <div className="flex gap-2.5">
                  <ActionButton
                    icon={<Star className={cn("h-4 w-4", fav && "fill-current")} />}
                    label={fav ? "حذف" : "ذخیره"}
                    onClick={handleFavorite}
                    variant={fav ? "amber" : "ghost"}
                  />
                  <ActionButton
                    icon={<Share2 className="h-4 w-4" />}
                    label="اشتراک"
                    onClick={handleShare}
                    variant="ghost"
                  />
                </div>
              </div>

              {/* ── Divider ───────────────────────────────────────────── */}
              <div className="mx-4 h-px bg-white/[0.06] mb-4" />

              {/* ── Station Image ─────────────────────────────────────── */}
              {stationImage && (
                <div
                  className="mx-4 mb-4"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <StationImageCard stationImage={stationImage} />
                </div>
              )}

              {/* ── Address ───────────────────────────────────────────── */}
              {selectedStation.address && (
                <div
                  className="mx-4 mb-4 flex items-start gap-3 rounded-2xl bg-white/[0.05] border border-white/[0.07] px-4 py-3"
                  dir="rtl"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <MapPin className="h-4 w-4 text-white/28 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-white/55 leading-relaxed">
                    {selectedStation.address}
                  </p>
                </div>
              )}

              {/* ── Amenities (collapsible) ───────────────────────────── */}
              {activeAmenities.length > 0 && (
                <div
                  className="mx-4 mb-4"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      if (!isExpanded) snapTo(true); // expand first
                      setAmenitiesOpen((v) => !v);
                    }}
                    className="flex w-full items-center justify-between rounded-2xl bg-white/[0.05] border border-white/[0.07] px-4 py-3 transition-all hover:bg-white/[0.08] active:bg-white/[0.1]"
                    dir="rtl"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[13px] font-medium text-white/68">امکانات ایستگاه</span>
                      <span className="text-[11px] text-white/30 bg-white/[0.08] rounded-full px-2 py-0.5">
                        {activeAmenities.length}
                      </span>
                    </div>
                    {amenitiesOpen
                      ? <ChevronUp   className="h-4 w-4 text-white/30" />
                      : <ChevronDown className="h-4 w-4 text-white/30" />
                    }
                  </button>

                  <motion.div
                    initial={false}
                    animate={amenitiesOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {activeAmenities.map((key) => {
                        const info = AmenityIcon[key]!;
                        const Icon = info.icon;
                        return (
                          <div
                            key={key}
                            className={cn(
                              "flex flex-col items-center gap-1.5 rounded-2xl border border-white/[0.07] p-3 text-center",
                              info.bg,
                            )}
                          >
                            <div className={cn("flex h-7 w-7 items-center justify-center rounded-xl bg-white/[0.08]", info.color)}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-[9.5px] text-white/45 leading-tight">
                              {info.labelFa}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>
              )}

              {/* ── Connected Stations ────────────────────────────────── */}
              {connected.length > 0 && (
                <div
                  className="mx-4 mb-4"
                  dir="rtl"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <span className="text-[12px] font-semibold text-white/38 uppercase tracking-wider">
                      ایستگاه‌های مجاور
                    </span>
                    <span className="text-[11px] text-white/25">{connected.length}</span>
                  </div>
                  <div className="space-y-2">
                    {connected.map((station) => (
                      <button
                        key={station.id}
                        onClick={() => openStationSheet(station)}
                        className="flex w-full items-center gap-3 rounded-2xl bg-white/[0.05] border border-white/[0.07] px-4 py-3 transition-all hover:bg-white/[0.09] active:bg-white/[0.12] text-right"
                      >
                        <div className="flex gap-1 shrink-0">
                          {station.lines.map((l) => (
                            <LineBadge key={l} lineId={l} size="xs" />
                          ))}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-white/75 truncate">{station.nameFa}</p>
                          <p className="text-[11px] text-white/30 truncate">{station.name}</p>
                        </div>
                        <ChevronLeft className="h-4 w-4 text-white/20 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Safe area spacer ──────────────────────────────────── */}
              <div className="h-8" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant: "primary" | "secondary" | "amber" | "ghost";
}

function ActionButton({ icon, label, onClick, variant }: ActionButtonProps) {
  // Screenshot style: مبدا/مقصد are large solid pill buttons (row layout)
  // ghost/amber stay as compact square buttons
  const isPill = variant === "primary" || variant === "secondary";

  const styles: Record<ActionButtonProps["variant"], string> = {
    // Solid pill — matching screenshot (blue/green)
    primary:   "bg-[#0a84ff] border-transparent text-white hover:bg-[#0a84ff]/90 shadow-[0_4px_16px_rgba(10,132,255,0.35)]",
    secondary: "bg-[#30d158] border-transparent text-white hover:bg-[#30d158]/90 shadow-[0_4px_16px_rgba(48,209,88,0.35)]",
    // Compact tinted square
    amber:     "bg-amber-500/15 border-amber-500/25 text-amber-400 hover:bg-amber-500/25",
    ghost:     "bg-white/[0.07] border-white/[0.10] text-white/50 hover:bg-white/[0.13] hover:text-white/75",
  };

  if (isPill) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex flex-1 flex-row items-center justify-center gap-2.5",
          "rounded-full border py-4 px-5",
          "transition-all duration-150 active:scale-[0.96]",
          styles[variant],
        )}
      >
        {icon}
        <span className="text-[14px] font-semibold leading-none">{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5",
        "rounded-2xl border py-3.5 px-4",
        "transition-all duration-150 active:scale-[0.93]",
        styles[variant],
      )}
    >
      {icon}
      <span className="text-[11px] font-medium leading-none">{label}</span>
    </button>
  );
}

interface StationImageCardProps {
  stationImage: {
    src: string;
    alt: string;
    metadata: { author: string; license: string; sourceUrl: string };
  };
}

function StationImageCard({ stationImage }: StationImageCardProps) {
  const [error, setError] = useState(false);
  if (error) return null;

  return (
    <div className="relative w-full h-[156px] rounded-2xl overflow-hidden">
      <img
        src={stationImage.src}
        alt={stationImage.alt}
        className="w-full h-full object-cover"
        loading="eager"
        onError={() => setError(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      <div className="absolute bottom-2 left-2">
        <a
          href={stationImage.metadata.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
          <span className="text-[9px] text-white/65 truncate max-w-[180px]">
            {stationImage.metadata.license} · {stationImage.metadata.author}
          </span>
        </a>
      </div>
    </div>
  );
}
