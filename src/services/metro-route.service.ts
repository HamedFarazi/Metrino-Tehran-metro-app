/**
 * MetroRouteService — Calculates routes between stations.
 * Uses BFS for shortest path, then constructs full Route object.
 * Now supports multiple alternative routes with scoring.
 */
import type { Route, RouteSegment, RouteTransfer, Station, RouteOption } from "@/types/metro";
import { MetroDataService } from "./metro-data.service";

const TRANSFER_PENALTY_MIN = 3;  // minutes per transfer
const STATION_DWELL_SEC = 30;    // seconds per station stop
const AVG_SPEED_KMH = 40;        // average train speed

class MetroRouteServiceClass {
  /**
   * Calculate the best route between two stations.
   * (Legacy method - returns single route for backward compatibility)
   */
  calculate(originId: string, destinationId: string): Route | null {
    const routes = this.calculateMultiple(originId, destinationId);
    return routes.length > 0 ? routes[0].route : null;
  }

  /**
   * Calculate multiple alternative routes between two stations.
   * Returns array of RouteOption sorted by quality.
   */
  calculateMultiple(originId: string, destinationId: string, maxRoutes = 5): RouteOption[] {
    const origin = MetroDataService.getStation(originId);
    const destination = MetroDataService.getStation(destinationId);

    if (!origin || !destination) return [];
    if (originId === destinationId) return [];

    // Find multiple paths using K-shortest paths
    const paths = MetroDataService.findMultiplePaths(originId, destinationId, maxRoutes);
    if (paths.length === 0) return [];

    // Build Route objects for each path
    const routes: Route[] = [];
    for (const path of paths) {
      const stationSequence = path
        .map((id) => MetroDataService.getStation(id))
        .filter((s): s is Station => s !== undefined);

      if (stationSequence.length < 2) continue;

      const { segments, transfers } = this._buildSegmentsAndTransfers(stationSequence);

      const totalStations = stationSequence.length;
      const totalDistanceKm = this._calculateTotalDistance(stationSequence);
      const travelTimeMin = Math.ceil((totalDistanceKm / AVG_SPEED_KMH) * 60);
      const dwellTimeMin = Math.ceil((totalStations * STATION_DWELL_SEC) / 60);
      const transferTimeMin = transfers.length * TRANSFER_PENALTY_MIN;
      const totalTimeMin = travelTimeMin + dwellTimeMin + transferTimeMin;

      routes.push({
        id: `route_${originId}_${destinationId}_${routes.length}_${Date.now()}`,
        origin,
        destination,
        segments,
        transfers,
        totalStations,
        totalTimeMin,
        totalDistanceKm: parseFloat(totalDistanceKm.toFixed(2)),
        transferCount: transfers.length,
        stationSequence,
      });
    }

    // Score and classify routes
    return this._scoreAndClassifyRoutes(routes);
  }

  /**
   * Score routes and assign types (fastest, fewest-transfers, shortest, balanced)
   */
  private _scoreAndClassifyRoutes(routes: Route[]): RouteOption[] {
    if (routes.length === 0) return [];

    // Calculate scores
    const scored = routes.map(route => {
      // Comfort score: lower transfers + reasonable time/distance balance
      const transferPenalty = route.transferCount * 15;
      const timeFactor = route.totalTimeMin;
      const stationFactor = route.totalStations * 0.5;
      const comfortScore = 100 - transferPenalty - (timeFactor / 2) - stationFactor;

      return {
        route: { ...route, comfortScore },
        timeScore: route.totalTimeMin,
        transferScore: route.transferCount,
        stationScore: route.totalStations,
        balancedScore: route.totalTimeMin * 0.4 + route.transferCount * 12 + route.totalStations * 0.3,
      };
    });

    // Find best in each category
    const fastest = scored.reduce((a, b) => a.timeScore < b.timeScore ? a : b);
    const fewestTransfers = scored.reduce((a, b) => a.transferScore < b.transferScore ? a : b);
    const shortest = scored.reduce((a, b) => a.stationScore < b.stationScore ? a : b);
    const balanced = scored.reduce((a, b) => a.balancedScore < b.balancedScore ? a : b);

    // Create route options with labels
    const options: RouteOption[] = [];
    const addedRouteIds = new Set<string>();

    // Add best routes with labels
    const candidates = [
      { scored: fastest, type: "fastest" as const, label: "Fastest", labelFa: "سریع‌ترین", desc: "Least travel time", descFa: "کمترین زمان سفر" },
      { scored: fewestTransfers, type: "fewest-transfers" as const, label: "Fewest Transfers", labelFa: "کمترین تبادل", desc: "Minimum line changes", descFa: "کمترین تعویض خط" },
      { scored: shortest, type: "shortest" as const, label: "Shortest", labelFa: "کوتاه‌ترین", desc: "Fewest stops", descFa: "کمترین ایستگاه" },
      { scored: balanced, type: "balanced" as const, label: "Balanced", labelFa: "متعادل", desc: "Optimal mix", descFa: "ترکیب بهینه" },
    ];

    for (const { scored: s, type, label, labelFa, desc, descFa } of candidates) {
      if (!addedRouteIds.has(s.route.id)) {
        options.push({
          route: { ...s.route, routeType: type, rank: options.length + 1 },
          label,
          labelFa,
          description: desc,
          descriptionFa: descFa,
        });
        addedRouteIds.add(s.route.id);
      }
    }

    // Add remaining routes as alternatives with smart descriptions
    for (const s of scored) {
      if (!addedRouteIds.has(s.route.id) && options.length < 5) {
        // Generate smart description based on route characteristics
        const { desc, descFa } = this._generateAlternativeDescription(s, options);
        
        options.push({
          route: { ...s.route, routeType: "balanced", rank: options.length + 1 },
          label: "Alternative",
          labelFa: "جایگزین",
          description: desc,
          descriptionFa: descFa,
        });
        addedRouteIds.add(s.route.id);
      }
    }

    return options;
  }

  /**
   * Generate smart description for alternative routes based on their characteristics
   */
  private _generateAlternativeDescription(
    scored: { route: Route; timeScore: number; transferScore: number; stationScore: number },
    existingOptions: RouteOption[]
  ): { desc: string; descFa: string } {
    const route = scored.route;
    
    // Check if this route has no transfers
    if (route.transferCount === 0) {
      return { 
        desc: "Direct route, no transfers", 
        descFa: "مسیر مستقیم بدون تبادل" 
      };
    }
    
    // Check if this route uses fewer lines
    const uniqueLines = new Set<number>();
    route.segments.forEach(seg => uniqueLines.add(seg.lineId));
    if (uniqueLines.size <= 2) {
      return { 
        desc: "Uses fewer metro lines", 
        descFa: "استفاده از خطوط کمتر" 
      };
    }
    
    // Check if time difference is small (within 5 minutes of fastest)
    const fastestTime = Math.min(...existingOptions.map(opt => opt.route.totalTimeMin));
    if (route.totalTimeMin - fastestTime <= 5) {
      return { 
        desc: "Similar travel time", 
        descFa: "زمان سفر مشابه" 
      };
    }
    
    // Check if this has moderate transfers
    if (route.transferCount <= 2) {
      return { 
        desc: "Few transfers needed", 
        descFa: "تبادل‌های اندک" 
      };
    }
    
    // Default fallback
    return { 
      desc: "Alternative path", 
      descFa: "مسیر دیگر" 
    };
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _buildSegmentsAndTransfers(stations: Station[]): {
    segments: RouteSegment[];
    transfers: RouteTransfer[];
  } {
    const segments: RouteSegment[] = [];
    const transfers: RouteTransfer[] = [];

    if (stations.length < 2) return { segments, transfers };

    let segmentStart = stations[0];
    let currentLineId = this._getCommonLine(stations[0], stations[1]) ?? stations[0].lines[0] ?? 1;

    for (let i = 1; i < stations.length; i++) {
      const from = stations[i - 1];
      const to = stations[i];
      const lineId = this._getCommonLine(from, to);

      // Transfer detected when: no common line (null), or shared line differs from current
      const isTransfer = lineId === null || (lineId !== currentLineId && currentLineId !== null);

      if (isTransfer) {
        // Determine toLineId: the line used AFTER the transfer station
        const toLineId = this._getNextLineId(from, to, currentLineId);

        // Close current segment up to transfer station
        segments.push({
          fromStation: segmentStart,
          toStation: from,
          lineId: currentLineId,
          stationCount: stations.indexOf(from) - stations.indexOf(segmentStart) + 1,
        });

        // Record transfer
        transfers.push({
          atStation: from,
          fromLineId: currentLineId,
          toLineId,
          transferTimeMin: TRANSFER_PENALTY_MIN,
        });

        segmentStart = from;
        currentLineId = toLineId;
      }
    }

    // Close last segment
    segments.push({
      fromStation: segmentStart,
      toStation: stations[stations.length - 1],
      lineId: currentLineId,
      stationCount: stations.length - stations.indexOf(segmentStart),
    });

    return { segments, transfers };
  }

  /**
   * Find the line shared between two adjacent stations.
   * Returns null if no common line exists (cross-line connection / transfer point).
   */
  private _getCommonLine(a: Station, b: Station): number | null {
    for (const line of a.lines) {
      if (b.lines.includes(line)) return line;
    }
    return null;
  }

  /**
   * Determine which line to ride AFTER a transfer at `from`.
   * Looks at what line connects `from` → `to` that isn't the current line.
   */
  private _getNextLineId(from: Station, to: Station, currentLineId: number): number {
    // Prefer a line shared between `from` and `to` that isn't the current one
    for (const line of from.lines) {
      if (line !== currentLineId && to.lines.includes(line)) return line;
    }
    // Fall back to any line of `to` that isn't the current one
    for (const line of to.lines) {
      if (line !== currentLineId) return line;
    }
    // Last resort
    return to.lines[0] ?? currentLineId;
  }

  private _calculateTotalDistance(stations: Station[]): number {
    let total = 0;
    for (let i = 0; i < stations.length - 1; i++) {
      const from = stations[i];
      const to = stations[i + 1];
      total += this._haversine(
        from.coordinates.lat, from.coordinates.lng,
        to.coordinates.lat, to.coordinates.lng
      );
    }
    return total;
  }

  private _haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

export const MetroRouteService = new MetroRouteServiceClass();
