/**
 * RouteSheet
 * Mobile: bottom sheet (slide up from bottom)
 * Desktop: right sidebar (slide in from right)
 * Transfer direction labels based on next station.
 */
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, MapPin, ArrowLeftRight, Train, Zap, Target, Rocket, Sparkles, RefreshCw } from "lucide-react";
import { useMetroStore } from "@/store/metro.store";
import { LineBadge } from "@/components/shared/LineBadge";
import { LINE_COLORS } from "@/types/metro";
import { MetroDataService } from "@/services/metro-data.service";
import type { Route, RouteOption, Station } from "@/types/metro";
import { cn, formatDuration, formatDistance } from "@/lib/utils";

// ─── Route Type Icon Mapping ─────────────────────────────────────────────────
function getRouteIcon(routeType?: string) {
  const iconClass = "h-4 w-4";
  
  switch (routeType) {
    case "fastest":
      return <Zap className={iconClass} style={{ color: "#FBBF24" }} />;
    case "fewest-transfers":
      return <Target className={iconClass} style={{ color: "#22D3EE" }} />;
    case "shortest":
      return <Rocket className={iconClass} style={{ color: "#F472B6" }} />;
    case "balanced":
      return <Sparkles className={iconClass} style={{ color: "#A78BFA" }} />;
    default:
      return <RefreshCw className={iconClass} style={{ color: "#94A3B8" }} />;
  }
}


// ─── Data-driven transfer direction ──────────────────────────────────────────
// Determines direction by looking at ALL stations after the transfer on the new line.
// Finds actual terminal stations (stations with only 1 connection on that line).

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

  // Get the transfer station's index in the line
  const transferStationIdx = line.stationIds.indexOf(currentStationId);
  if (transferStationIdx === -1) return base;

  // Get the first station we're moving to after transfer
  const firstStationOnNewLine = stationsOnNewLine[0];
  const firstIdx = line.stationIds.indexOf(firstStationOnNewLine);
  
  if (firstIdx === -1) return base;

  // Determine direction based on whether we're moving to higher or lower index
  const movingTowardEnd = firstIdx > transferStationIdx;

  // Find terminal stations: stations that have only 1 connected station on this line
  const terminals: string[] = [];
  for (const stationId of line.stationIds) {
    const station = MetroDataService.getStation(stationId);
    if (!station) continue;
    
    // Count how many connected stations are on the same line
    const connectionsOnLine = station.connectedStationIds.filter(connId => {
      return line.stationIds.includes(connId);
    }).length;
    
    // Terminal stations have only 1 connection on their line
    if (connectionsOnLine === 1) {
      terminals.push(stationId);
    }
  }

  // If we found terminals, use the appropriate one based on direction
  if (terminals.length >= 2) {
    // We have at least 2 terminals - pick the correct one based on direction
    let terminalId: string;
    
    if (movingTowardEnd) {
      // Find terminal that is furthest in the direction we're moving
      terminalId = terminals.reduce((furthest, current) => {
        const furthestIdx = line.stationIds.indexOf(furthest);
        const currentIdx = line.stationIds.indexOf(current);
        return currentIdx > furthestIdx ? current : furthest;
      });
    } else {
      // Find terminal that is closest to start
      terminalId = terminals.reduce((closest, current) => {
        const closestIdx = line.stationIds.indexOf(closest);
        const currentIdx = line.stationIds.indexOf(current);
        return currentIdx < closestIdx ? current : closest;
      });
    }
    
    const terminal = MetroDataService.getStation(terminalId);
    if (terminal) {
      return `تبادل خط ${toLineId} — به سمت ${terminal.nameFa}`;
    }
  }

  // Fallback: use first or last station in array if no terminals found
  const terminalId = movingTowardEnd
    ? line.stationIds[line.stationIds.length - 1]
    : line.stationIds[0];

  const terminal = MetroDataService.getStation(terminalId);
  if (!terminal) return base;

  return `تبادل خط ${toLineId} — به سمت ${terminal.nameFa}`;
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function RouteSheet() {
  const { currentRoute, alternativeRoutes, selectRouteOption, clearRoute } = useMetroStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isOpen = !!currentRoute;

  const hasAlternatives = alternativeRoutes.length > 1;

  const handleDragEnd = (_: any, info: { offset: { y: number }; velocity: { y: number } }) => {
    const { offset, velocity } = info;
    
    // If dragging down with velocity or past threshold, close
    if (velocity.y > 500 || offset.y > 150) {
      clearRoute();
      return;
    }
    
    // If dragging up with velocity or past threshold, expand
    if (velocity.y < -500 || offset.y < -100) {
      setIsExpanded(true);
      return;
    }
    
    // Otherwise collapse
    setIsExpanded(false);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // If scrolled to top and already at top, expand
    if (target.scrollTop === 0 && !isExpanded) {
      // User is trying to scroll up but already at top
      // We could expand here, but it might be jarring
      // Better to just expand on handle drag
    }
  };

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

          {/* ── Mobile: bottom sheet with drag ── */}
          <motion.div
            key="mobile-sheet"
            initial={{ y: "100%" }}
            animate={{ 
              y: 0,
              height: isExpanded ? "95vh" : "65vh"
            }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 380 }}
            className="md:hidden fixed bottom-0 inset-x-0 z-[35] rounded-t-3xl backdrop-blur-2xl shadow-[0_-20px_60px_rgba(0,0,0,0.6)] flex flex-col"
            style={{
              background: "rgba(0, 0, 0, 0.60)",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#F8FAFF",
            }}
          >
            {/* Handle - Draggable area */}
            <motion.div 
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.1, bottom: 0.2 }}
              dragMomentum={false}
              onDragEnd={handleDragEnd}
              className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing flex-shrink-0"
              style={{ touchAction: 'none' }}
            >
              <div className="h-1 w-12 rounded-full" style={{ background: "rgba(255, 255, 255, 0.2)" }} />
            </motion.div>
            
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <RouteHeader route={currentRoute} onClose={clearRoute} />
              
              {/* Alternative Routes Toggle */}
              {hasAlternatives && (
                <div className="px-5 pt-2 pb-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <button
                    onClick={() => setShowAlternatives(!showAlternatives)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all"
                    style={{
                      background: showAlternatives ? "rgba(139, 92, 246, 0.15)" : "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${showAlternatives ? "rgba(139, 92, 246, 0.3)" : "rgba(255, 255, 255, 0.08)"}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="h-4 w-4" style={{ color: "#8B5CF6" }} />
                      <span className="text-sm font-medium" style={{ color: "#F8FAFF" }}>
                        {alternativeRoutes.length} مسیر موجود
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: showAlternatives ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg className="h-4 w-4" style={{ color: "rgba(248, 250, 255, 0.5)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </button>
                </div>
              )}
              
              <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto scrollbar-thin"
              >
                {showAlternatives && hasAlternatives ? (
                  <AlternativeRoutesList 
                    routes={alternativeRoutes} 
                    currentRoute={currentRoute}
                    onSelect={(option) => {
                      selectRouteOption(option);
                      setShowAlternatives(false);
                    }}
                  />
                ) : (
                  <RouteTimeline route={currentRoute} />
                )}
                <div className="h-6" />
              </div>
            </div>
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
              
              {/* Alternative Routes Toggle - Desktop */}
              {hasAlternatives && (
                <div className="px-5 pb-3" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <button
                    onClick={() => setShowAlternatives(!showAlternatives)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all"
                    style={{
                      background: showAlternatives ? "rgba(139, 92, 246, 0.15)" : "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${showAlternatives ? "rgba(139, 92, 246, 0.3)" : "rgba(255, 255, 255, 0.08)"}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="h-3.5 w-3.5" style={{ color: "#8B5CF6" }} />
                      <span className="text-xs font-medium" style={{ color: "#F8FAFF" }}>
                        {alternativeRoutes.length} مسیر
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: showAlternatives ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg className="h-3.5 w-3.5" style={{ color: "rgba(248, 250, 255, 0.5)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </button>
                </div>
              )}
            </div>

            {/* Scrollable timeline */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {showAlternatives && hasAlternatives ? (
                <AlternativeRoutesList 
                  routes={alternativeRoutes} 
                  currentRoute={currentRoute}
                  onSelect={(option) => {
                    selectRouteOption(option);
                    setShowAlternatives(false);
                  }}
                  compact
                />
              ) : (
                <RouteTimeline route={currentRoute} />
              )}
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


// ─── Alternative Routes List ──────────────────────────────────────────────────

function AlternativeRoutesList({
  routes,
  currentRoute,
  onSelect,
  compact = false,
}: {
  routes: RouteOption[];
  currentRoute: Route;
  onSelect: (option: RouteOption) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("px-5", compact ? "pt-3" : "pt-4")} dir="rtl">
      <h3 
        className={cn("font-semibold mb-3", compact ? "text-sm" : "text-base")}
        style={{ color: "#F8FAFF" }}
      >
        انتخاب مسیر
      </h3>
      
      <div className="space-y-2.5">
        {routes.map((option, idx) => {
          const isSelected = option.route.id === currentRoute.id;
          const route = option.route;
          
          return (
            <motion.button
              key={route.id}
              onClick={() => onSelect(option)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "w-full rounded-2xl p-4 text-right transition-all",
                compact && "p-3"
              )}
              style={{
                background: isSelected 
                  ? "rgba(139, 92, 246, 0.2)" 
                  : "rgba(255, 255, 255, 0.05)",
                border: `1px solid ${isSelected 
                  ? "rgba(139, 92, 246, 0.4)" 
                  : "rgba(255, 255, 255, 0.08)"}`,
                boxShadow: isSelected 
                  ? "0 4px 20px rgba(139, 92, 246, 0.15)" 
                  : "none",
              }}
            >
              {/* Header: Icon + Label */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  {getRouteIcon(route.routeType)}
                  <span 
                    className={cn("font-semibold", compact ? "text-sm" : "text-base")}
                    style={{ color: isSelected ? "#A855F7" : "#F8FAFF" }}
                  >
                    {option.labelFa}
                  </span>
                </div>
                
                {isSelected && (
                  <div 
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      background: "rgba(139, 92, 246, 0.2)",
                      color: "#A855F7",
                    }}
                  >
                    انتخاب شده
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <StatBadge 
                  icon={<Clock className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")} />} 
                  value={formatDuration(route.totalTimeMin)} 
                  color="#14E6B5"
                  compact={compact}
                />
                <StatBadge 
                  icon={<Train className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")} />} 
                  value={`${route.totalStations} ایستگاه`} 
                  color="#22D3EE"
                  compact={compact}
                />
                {route.transferCount > 0 && (
                  <StatBadge 
                    icon={<ArrowLeftRight className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")} />} 
                    value={`${route.transferCount} تبادل`} 
                    color="#FBBF24"
                    compact={compact}
                  />
                )}
              </div>

              {/* Description */}
              <p 
                className={cn("text-xs", compact && "text-[10px]")}
                style={{ color: "rgba(248, 250, 255, 0.5)" }}
              >
                {option.descriptionFa}
              </p>

              {/* Lines Preview */}
              <div className="flex items-center gap-1 mt-2.5 flex-wrap">
                {getUniqueLines(route).map((lineId) => (
                  <LineBadge key={lineId} lineId={lineId} size={compact ? "xs" : "sm"} />
                ))}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function StatBadge({ 
  icon, 
  value, 
  color, 
  compact = false 
}: { 
  icon: React.ReactNode; 
  value: string; 
  color: string;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-1" style={{ color }}>
      {icon}
      <span className={cn("font-medium", compact ? "text-[10px]" : "text-xs")}>{value}</span>
    </div>
  );
}

function getUniqueLines(route: Route): number[] {
  const lines = new Set<number>();
  route.segments.forEach(seg => lines.add(seg.lineId));
  return Array.from(lines);
}
