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
// Determines direction by looking at ALL stations after the transfer on the new line.
// Returns the terminal station name (first or last in line array).

function getTransferLabel(
  currentStationId: string,
  toLineId: number,
  stationSequence: Station[]
): string {
  const base = `تبادل به خط ${toLineId}`;
  
  const line = MetroDataService.getLine(toLineId);
  if (!line || line.stationIds.length < 2) return base;

  // Find current transfer station in route
  const currentIdx = stationSequence.findIndex(s => s.id === currentStationId);
  if (currentIdx === -1 || currentIdx >= stationSequence.length - 1) return base;

  // Collect all stations AFTER this transfer that belong to the new line
  const stationsOnNewLine: string[] = [];
  for (let i = currentIdx + 1; i < stationSequence.length; i++) {
    const station = stationSequence[i];
    if (station.lines.includes(toLineId)) {
      stationsOnNewLine.push(station.id);
    } else {
      break; // stopped using this line
    }
  }

  if (stationsOnNewLine.length === 0) return base;

  // Determine direction: are we moving toward higher or lower indices?
  const firstStationOnNewLine = stationsOnNewLine[0];
  const lastStationOnNewLine = stationsOnNewLine[stationsOnNewLine.length - 1];
  
  const firstIdx = line.stationIds.indexOf(firstStationOnNewLine);
  const lastIdx = line.stationIds.indexOf(lastStationOnNewLine);
  
  if (firstIdx === -1 || lastIdx === -1) return base;

  const movingTowardEnd = lastIdx > firstIdx;

  // Simply return first or last station in the line array (assumes they are terminals)
  const terminalId = movingTowardEnd
    ? line.stationIds[line.stationIds.length - 1]  // last station
    : line.stationIds[0];                           // first station

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
            className="md:hidden fixed bottom-0 inset-x-0 z-[35] max-h-[72vh] overflow-y-auto rounded-t-3xl backdrop-blur-2xl shadow-[0_-20px_60px_rgba(0,0,0,0.6)]"
            style={{
              background: "rgba(0, 0, 0, 0.60)",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#F8FAFF",
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-12 rounded-full" style={{ background: "rgba(255, 255, 255, 0.20)" }} />
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
            className="hidden md:flex fixed right-0 top-0 bottom-0 z-[35] w-80 flex-col backdrop-blur-2xl"
            style={{
              background: "rgba(0, 0, 0, 0.55)",
              borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
              color: "#F8FAFF",
            }}
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
        sidebar && "pt-16"
      )}
      style={{
        borderBottom: sidebar ? "1px solid rgba(255, 255, 255, 0.08)" : undefined,
      }}
      dir="rtl"
    >
      <div className="flex-1 min-w-0">
        {/* Origin → Destination */}
        <div className="flex items-center gap-2 text-sm mb-3 flex-wrap" style={{ color: "rgba(248, 250, 255, 0.6)" }}>
          <span className="font-semibold truncate" style={{ color: "#F8FAFF" }}>{route.origin.nameFa}</span>
          <ArrowLeftRight className="h-3.5 w-3.5 shrink-0 rotate-90" style={{ color: "rgba(248, 250, 255, 0.3)" }} />
          <span className="font-semibold truncate" style={{ color: "#F8FAFF" }}>{route.destination.nameFa}</span>
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
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all mr-3 mt-1"
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          color: "rgba(248, 250, 255, 0.4)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
          e.currentTarget.style.color = "#F8FAFF";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
          e.currentTarget.style.color = "rgba(248, 250, 255, 0.4)";
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function Chip({ icon, value, color }: { icon: React.ReactNode; value: string; color: "emerald" | "cyan" | "amber" | "default" }) {
  const colorMap = {
    emerald: "#14E6B5",
    cyan: "#22D3EE",
    amber: "#FBBF24",
    default: "rgba(248, 250, 255, 0.5)",
  };
  
  return (
    <div className="flex items-center gap-1" style={{ color: colorMap[color] }}>
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
            stationSequence={stations}
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
  lineColor, showConnector, transfer, stationSequence,
}: {
  station: Station;
  isFirst: boolean;
  isLast: boolean;
  isTransfer: boolean;
  lineColor: string;
  showConnector: boolean;
  transfer?: { fromLineId: number; toLineId: number };
  stationSequence: Station[];
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
            ? <div className="flex-1 w-0.5 mt-1 border-l-2 border-dashed" style={{ borderColor: "rgba(255, 255, 255, 0.15)" }} />
            : <div className="flex-1 w-0.5 mt-1" style={{ backgroundColor: `${lineColor}50` }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-3">
        <div className="flex items-center justify-between py-2">
          <span
            className="text-sm leading-tight"
            style={{
              fontWeight: isFirst || isLast ? 600 : isTransfer ? 500 : 400,
              color: isFirst || isLast ? "#F8FAFF" : isTransfer ? "#FCD34D" : "rgba(248, 250, 255, 0.7)",
            }}
          >
            {station.nameFa}
          </span>
          <div className="flex items-center gap-1 shrink-0 mr-2">
            {station.lines.map((l) => <LineBadge key={l} lineId={l} size="xs" />)}
          </div>
        </div>

        {/* Transfer badge with direction */}
        {transfer && (
          <div
            className="mb-2 flex items-center gap-2 rounded-lg px-2.5 py-1.5"
            style={{
              background: "rgba(245, 158, 11, 0.10)",
              border: "1px solid rgba(245, 158, 11, 0.20)",
            }}
          >
            <ArrowLeftRight className="h-3 w-3 shrink-0" style={{ color: "#FBBF24" }} />
            <span className="text-xs flex-1" style={{ color: "#FBBF24" }}>
              {getTransferLabel(station.id, transfer.toLineId, stationSequence)}
            </span>
            <span className="text-xs whitespace-nowrap" style={{ color: "rgba(248, 250, 255, 0.3)" }}>~۳ دقیقه</span>
          </div>
        )}
      </div>
    </div>
  );
}
