/**
 * RouteSheet — Apple Maps-style route result bottom sheet.
 * Shows route timeline, transfers, duration, station count.
 */
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, MapPin, ArrowLeftRight, Train } from "lucide-react";
import { useMetroStore } from "@/store/metro.store";
import { MetroRouteService } from "@/services/metro-route.service";
import { LineBadge } from "@/components/shared/LineBadge";
import { LINE_COLORS } from "@/types/metro";
import type { Route, Station } from "@/types/metro";
import { cn, formatDuration, formatDistance } from "@/lib/utils";
import { useEffect } from "react";
export function RouteSheet() {
  const {
    currentRoute,
    originStation,
    destinationStation,
    setCurrentRoute,
    addRecentRoute,
    clearRoute,
  } = useMetroStore();

  // Calculate route when origin/destination are both set
  useEffect(() => {
    if (originStation && destinationStation && !currentRoute) {
      const route = MetroRouteService.calculate(originStation.id, destinationStation.id);
      if (route) {
        setCurrentRoute(route);
        addRecentRoute(originStation.id, destinationStation.id);
      }
    }
  }, [originStation, destinationStation, currentRoute, setCurrentRoute, addRecentRoute]);

  const isOpen = !!currentRoute;

  return (
    <AnimatePresence>
      {isOpen && currentRoute && (
        <>
          {/* Backdrop - subtle, doesn't block map */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 bottom-0 z-30 h-48 bg-gradient-to-t from-background/80 to-transparent pointer-events-none"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 380 }}
            className="fixed bottom-0 inset-x-0 z-35 max-h-[70vh] overflow-y-auto rounded-t-3xl border-t border-border/40 bg-card/95 backdrop-blur-2xl"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-12 rounded-full bg-border/60" />
            </div>

            {/* Header */}
            <RouteHeader route={currentRoute} onClose={clearRoute} />

            {/* Timeline */}
            <RouteTimeline route={currentRoute} />

            {/* Bottom padding */}
            <div className="h-4" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Route Header ──────────────────────────────────────────────────────────

function RouteHeader({ route, onClose }: { route: Route; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between px-5 py-3" dir="rtl">
      <div className="flex-1">
        {/* Origin → Destination */}
        <div className="flex items-center gap-2 text-sm text-foreground/60 mb-3">
          <span className="text-foreground font-medium">{route.origin.nameFa}</span>
          <ArrowLeftRight className="h-3.5 w-3.5 shrink-0 rotate-90" />
          <span className="text-foreground font-medium">{route.destination.nameFa}</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4">
          <StatChip
            icon={<Clock className="h-3.5 w-3.5" />}
            value={formatDuration(route.totalTimeMin)}
            color="emerald"
          />
          <StatChip
            icon={<Train className="h-3.5 w-3.5" />}
            value={`${route.totalStations} ایستگاه`}
            color="cyan"
          />
          <StatChip
            icon={<MapPin className="h-3.5 w-3.5" />}
            value={formatDistance(route.totalDistanceKm)}
            color="default"
          />
          {route.transferCount > 0 && (
            <StatChip
              icon={<ArrowLeftRight className="h-3.5 w-3.5" />}
              value={`${route.transferCount} تبادل`}
              color="amber"
            />
          )}
        </div>
      </div>

      <button
        onClick={onClose}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-foreground/40 hover:text-foreground transition-colors mr-3 mt-1"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function StatChip({
  icon,
  value,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  color: "emerald" | "cyan" | "amber" | "default";
}) {
  const colorMap = {
    emerald: "text-emerald-400",
    cyan: "text-cyan-400",
    amber: "text-amber-400",
    default: "text-foreground/50",
  };

  return (
    <div className={cn("flex items-center gap-1", colorMap[color])}>
      {icon}
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}

// ─── Route Timeline ────────────────────────────────────────────────────────

function RouteTimeline({ route }: { route: Route }) {
  const stations = route.stationSequence;
  const transferStationIds = new Set(route.transfers.map((t) => t.atStation.id));

  return (
    <div className="px-5" dir="rtl">
      {stations.map((station, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === stations.length - 1;
        const isTransfer = transferStationIds.has(station.id);
        const nextStation = stations[idx + 1];

        // Find current line
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
            transfer={route.transfers.find((t) => t.atStation.id === station.id)}
          />
        );
      })}
    </div>
  );
}

function getCurrentLine(station: Station, nextStation: Station | undefined): number | null {
  if (!nextStation) return station.lines[0] ?? null;
  for (const line of station.lines) {
    if (nextStation.lines.includes(line)) return line;
  }
  return station.lines[0] ?? null;
}

function TimelineItem({
  station,
  isFirst,
  isLast,
  isTransfer,
  lineColor,
  showConnector,
  transfer,
}: {
  station: Station;
  isFirst: boolean;
  isLast: boolean;
  isTransfer: boolean;
  lineColor: string;
  showConnector: boolean;
  transfer?: { fromLineId: number; toLineId: number };
}) {
  return (
    <div className="flex gap-3 min-h-[44px]">
      {/* Timeline track */}
      <div className="flex flex-col items-center shrink-0 w-5">
        {/* Dot */}
        <div
          className={cn(
            "z-10 rounded-full border-2 border-background",
            isFirst || isLast
              ? "h-4 w-4 shrink-0 mt-3"
              : isTransfer
              ? "h-3.5 w-3.5 shrink-0 mt-3.5"
              : "h-2.5 w-2.5 shrink-0 mt-4"
          )}
          style={{
            backgroundColor: lineColor,
            boxShadow: (isFirst || isLast || isTransfer)
              ? `0 0 8px ${lineColor}60`
              : undefined,
          }}
        />

        {/* Connector line */}
        {showConnector && !transfer && (
          <div
            className="flex-1 w-0.5 mt-1"
            style={{ backgroundColor: `${lineColor}60` }}
          />
        )}
        {showConnector && transfer && (
          <div className="flex-1 w-0.5 mt-1 border-l-2 border-dashed border-foreground/20" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-3">
        <div className="flex items-center justify-between py-2">
          <span
            className={cn(
              "text-sm",
              isFirst || isLast
                ? "font-semibold text-foreground"
                : isTransfer
                ? "font-medium text-amber-300"
                : "text-foreground/70"
            )}
          >
            {station.nameFa}
          </span>

          <div className="flex items-center gap-1.5">
            {station.lines.map((l) => (
              <LineBadge key={l} lineId={l} size="xs" />
            ))}
          </div>
        </div>

        {/* Transfer indicator */}
        {transfer && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5">
            <ArrowLeftRight className="h-3 w-3 text-amber-400" />
            <span className="text-xs text-amber-400">
              تبادل به خط {transfer.toLineId}
            </span>
            <span className="text-xs text-foreground/30 mr-auto">~۳ دقیقه</span>
          </div>
        )}
      </div>
    </div>
  );
}
