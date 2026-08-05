/**
 * MetroRouteService — Calculates routes between stations.
 * Uses BFS for shortest path, then constructs full Route object.
 */
import type { Route, RouteSegment, RouteTransfer, Station } from "@/types/metro";
import { MetroDataService } from "./metro-data.service";

const TRANSFER_PENALTY_MIN = 3;  // minutes per transfer
const STATION_DWELL_SEC = 30;    // seconds per station stop
const AVG_SPEED_KMH = 40;        // average train speed

class MetroRouteServiceClass {
  /**
   * Calculate the best route between two stations.
   */
  calculate(originId: string, destinationId: string): Route | null {
    const origin = MetroDataService.getStation(originId);
    const destination = MetroDataService.getStation(destinationId);

    if (!origin || !destination) return null;
    if (originId === destinationId) return null;

    const path = MetroDataService.findPath(originId, destinationId);
    if (!path || path.length === 0) return null;

    const stationSequence = path
      .map((id) => MetroDataService.getStation(id))
      .filter((s): s is Station => s !== undefined);

    if (stationSequence.length < 2) return null;

    const { segments, transfers } = this._buildSegmentsAndTransfers(stationSequence);

    const totalStations = stationSequence.length;
    const totalDistanceKm = this._calculateTotalDistance(stationSequence);
    const travelTimeMin = Math.ceil((totalDistanceKm / AVG_SPEED_KMH) * 60);
    const dwellTimeMin = Math.ceil((totalStations * STATION_DWELL_SEC) / 60);
    const transferTimeMin = transfers.length * TRANSFER_PENALTY_MIN;
    const totalTimeMin = travelTimeMin + dwellTimeMin + transferTimeMin;

    return {
      id: `route_${originId}_${destinationId}_${Date.now()}`,
      origin,
      destination,
      segments,
      transfers,
      totalStations,
      totalTimeMin,
      totalDistanceKm: parseFloat(totalDistanceKm.toFixed(2)),
      transferCount: transfers.length,
      stationSequence,
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
    let currentLineId = this._getCommonLine(stations[0], stations[1]);

    for (let i = 1; i < stations.length; i++) {
      const from = stations[i - 1];
      const to = stations[i];
      const lineId = this._getCommonLine(from, to);

      // Line change = transfer
      if (lineId !== currentLineId && currentLineId !== null) {
        // Close current segment
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
          toLineId: lineId ?? currentLineId,
          transferTimeMin: TRANSFER_PENALTY_MIN,
        });

        segmentStart = from;
        currentLineId = lineId;
      }
    }

    // Close last segment
    if (currentLineId !== null) {
      segments.push({
        fromStation: segmentStart,
        toStation: stations[stations.length - 1],
        lineId: currentLineId,
        stationCount: stations.length - stations.indexOf(segmentStart),
      });
    }

    return { segments, transfers };
  }

  private _getCommonLine(a: Station, b: Station): number | null {
    for (const line of a.lines) {
      if (b.lines.includes(line)) return line;
    }
    // Fallback to first available line
    return a.lines[0] ?? null;
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
