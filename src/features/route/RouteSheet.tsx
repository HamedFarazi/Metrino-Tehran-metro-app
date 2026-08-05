/**
 * RouteSheet
 * Mobile: bottom sheet (slide up from bottom)
 * Desktop: right sidebar (slide in from right)
 * Transfer direction labels based on next station.
 */
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, MapPin, ArrowLeftRight, Train } from "lucide-react";
import { useMetroStore } from "@/store/metro.store";
import { LineBadge } from "@/components/shared/LineBadge";
import { LINE_COLORS } from "@/types/metro";
import { MetroDataService } from "@/services/metro-data.service";
import type { Route, Station } from "@/types/metro";
import { cn, formatDuration, formatDistance } from "@/lib/utils";

// ─── Data-driven transfer direction ──────────────────────────────────────────
// Looks up the line's ordered stationIds, finds where nextStation sits,
// and picks the terminal at whichever end it's heading toward.

function getTransferLabel(
  nextStation: Station | undefined,
  toLineId: number
): string {
  const base = `تبادل به خط ${toLineId}`;
  if (!nextStation) return base;

  const line = MetroDataService.getLine(toLineId);
  if (!line || line.stationIds.length < 2) return base;

  const idx = line.stationIds.indexOf(nextStation.id);
  if (idx === -1) return base;          // next station not on this line (shouldn't happen)

  const midpoint = (line.stationIds.length - 1) / 2;

  // Terminal toward which the train is heading
  const terminalId =
    idx <= midpoint
      ? line.stationIds[0]                          // heading toward first terminal
      : line.stationIds[line.stationIds.length - 1]; // heading toward last terminal

  const terminal = MetroDataService.getStation(terminalId);
  if (!terminal) return base;

  return `تبادل خط ${toLineId} — به سمت ${terminal.nameFa}`;
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function RouteSheet() {
  const { currentRoute, clearRoute } = useMetroStore();
  const isOpen = !!currentRoute;

  return (
    <AnimatePresence>
      {isOpen && currentRoute && (
        <>
          {/* ── Mobile: backdrop overlay (closes on tap) ── */}
          <motion.div
            key="mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-[34] bg-black/40"
            onClick={clearRoute}
          />

          {/* ── Mobile: bottom sheet ── */}
          <motion.div
            key="mobile-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 380 }}
            className="md:hidden fixed bottom-0 inset-x-0 z-[35] max-h-[72vh] overflow-y-auto rounded-t-3xl bg-black/60 backdrop-blur-2xl border-t border-white/8 shadow-[0_-20px_60px_rgba(0,0,0,0.6)]"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-12 rounded-full bg-white/20" />
            </div>
            <RouteHeader route={currentRoute} onClose={clearRoute} />
            <RouteTimeline route={currentRoute} />
            <div className="h-6" />
          </motion.div>

          {/* ── Desktop: right sidebar ── */}
          <motion.div
            key="desktop-sidebar"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
            className="hidden md:flex fixed right-0 top-0 bottom-0 z-[35] w-80 flex-col bg-black/55 backdrop-blur-2xl border-l border-white/8 shadow-[-20px_0_60px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="flex-shrink-0">
              <RouteHeader route={currentRoute} onClose={clearRoute} sidebar />
            </div>

            {/* Scrollable timeline */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <RouteTimeline route={currentRoute} />
              <div className="h-8" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Route Header ─────────────────────────────────────────────────────────────

function RouteHeader({
  route,
  onClose,
  sidebar = false,
}: {
  route: Route;
  onClose: () => void;
  sidebar?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between px-5 py-4",
        sidebar && "border-b border-white/8 pt-16"
      )}
      dir="rtl"
    >
      <div className="flex-1 min-w-0">
        {/* Origin → Destination */}
        <div className="flex items-center gap-2 text-sm text-foreground/60 mb-3 flex-wrap">
          <span className="text-foreground font-semibold truncate">{route.origin.nameFa}</span>
          <ArrowLeftRight className="h-3.5 w-3.5 shrink-0 rotate-90 text-foreground/30" />
          <span className="text-foreground font-semibold truncate">{route.destination.nameFa}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 flex-wrap">
          <Chip icon={<Clock className="h-3.5 w-3.5" />} value={formatDuration(route.totalTimeMin)} color="emerald" />
          <Chip icon={<Train className="h-3.5 w-3.5" />} value={`${route.totalStations} ایستگاه`} color="cyan" />
          <Chip icon={<MapPin className="h-3.5 w-3.5" />} value={formatDistance(route.totalDistanceKm)} color="default" />
          {route.transferCount > 0 && (
            <Chip icon={<ArrowLeftRight className="h-3.5 w-3.5" />} value={`${route.transferCount} تبادل`} color="amber" />
          )}
        </div>
      </div>

      <button
        onClick={onClose}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-foreground/40 hover:text-foreground hover:bg-white/15 transition-all mr-3 mt-1"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function Chip({ icon, value, color }: { icon: React.ReactNode; value: string; color: "emerald" | "cyan" | "amber" | "default" }) {
  const c = { emerald: "text-emerald-400", cyan: "text-cyan-400", amber: "text-amber-400", default: "text-foreground/50" }[color];
  return (
    <div className={cn("flex items-center gap-1", c)}>
      {icon}
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}

// ─── Route Timeline ───────────────────────────────────────────────────────────

function RouteTimeline({ route }: { route: Route }) {
  const stations = route.stationSequence;
  const transferMap = new Map(route.transfers.map((t) => [t.atStation.id, t]));

  return (
    <div className="px-5" dir="rtl">
      {stations.map((station, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === stations.length - 1;
        const transfer = transferMap.get(station.id);
        const isTransfer = !!transfer;
        const nextStation = stations[idx + 1];
        const currentLineId = getCurrentLine(station, nextStation);
        const lineColor = currentLineId ? LINE_COLORS[currentLineId] : "#888";

        return (
          <TimelineItem
            key={station.id}
            station={station}
            isFirst={isFirst}
            isLast={isLast}
            isTransfer={isTransfer}
            lineColor={lineColor}
            showConnector={!isLast}
            transfer={transfer}
            nextStation={nextStation}
          />
        );
      })}
    </div>
  );
}

function getCurrentLine(station: Station, next: Station | undefined): number | null {
  if (!next) return station.lines[0] ?? null;
  for (const l of station.lines) {
    if (next.lines.includes(l)) return l;
  }
  return station.lines[0] ?? null;
}

// ─── Timeline Item ────────────────────────────────────────────────────────────

function TimelineItem({
  station, isFirst, isLast, isTransfer,
  lineColor, showConnector, transfer, nextStation,
}: {
  station: Station;
  isFirst: boolean;
  isLast: boolean;
  isTransfer: boolean;
  lineColor: string;
  showConnector: boolean;
  transfer?: { fromLineId: number; toLineId: number };
  nextStation?: Station;
}) {
  const dotSize = isFirst || isLast ? "h-4 w-4 mt-3" : isTransfer ? "h-3.5 w-3.5 mt-3.5" : "h-2.5 w-2.5 mt-4";

  return (
    <div className="flex gap-3 min-h-[44px]">
      {/* Track */}
      <div className="flex flex-col items-center shrink-0 w-5">
        <div
          className={cn("z-10 rounded-full border-2 shrink-0", dotSize)}
          style={{
            backgroundColor: lineColor,
            borderColor: "var(--color-background, #09090b)",
            boxShadow: (isFirst || isLast || isTransfer) ? `0 0 8px ${lineColor}60` : undefined,
          }}
        />
        {showConnector && (
          transfer
            ? <div className="flex-1 w-0.5 mt-1 border-l-2 border-dashed border-white/15" />
            : <div className="flex-1 w-0.5 mt-1" style={{ backgroundColor: `${lineColor}50` }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-3">
        <div className="flex items-center justify-between py-2">
          <span className={cn(
            "text-sm leading-tight",
            isFirst || isLast ? "font-semibold text-foreground" :
            isTransfer ? "font-medium text-amber-300" : "text-foreground/70"
          )}>
            {station.nameFa}
          </span>
          <div className="flex items-center gap-1 shrink-0 mr-2">
            {station.lines.map((l) => <LineBadge key={l} lineId={l} size="xs" />)}
          </div>
        </div>

        {/* Transfer badge with direction */}
        {transfer && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5">
            <ArrowLeftRight className="h-3 w-3 text-amber-400 shrink-0" />
            <span className="text-xs text-amber-400 flex-1">
              {getTransferLabel(nextStation, transfer.toLineId)}
            </span>
            <span className="text-xs text-foreground/30 whitespace-nowrap">~۳ دقیقه</span>
          </div>
        )}
      </div>
    </div>
  );
}
