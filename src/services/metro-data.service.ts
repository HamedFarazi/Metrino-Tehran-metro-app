/**
 * MetroDataService — Singleton service for all station/line/connection data.
 * Loads from pre-processed JSON files (src/data/processed/).
 * Provides fast lookups via Maps.
 */
import type {
  Station,
  Line,
  Connection,
  StationAmenities,
  StationType,
} from "@/types/metro";
import { LINE_COLORS, LINE_NAMES_FA, LINE_NAMES_EN } from "@/types/metro";

// Static JSON imports (processed by migration script)
import rawStations from "@/data/processed/stations.json";
import rawLines from "@/data/processed/lines.json";
import rawConnections from "@/data/processed/connections.json";

// ─── Normalizers ─────────────────────────────────────────────────────────────

function normalizeStation(raw: (typeof rawStations)[0]): Station {
  const lines = raw.lines as number[];
  const connected = (raw.connectedStationIds ?? []) as string[];

  let type: StationType = "regular";
  if (lines.length > 1) type = "interchange";
  else if (connected.length === 1) type = "terminal";

  return {
    id: raw.id,
    name: raw.name,
    nameFa: raw.translations?.fa ?? raw.name,
    lines,
    coordinates: {
      lat: raw.coordinates?.latitude ?? 0,
      lng: raw.coordinates?.longitude ?? 0,
    },
    address: raw.address ?? "",
    colors: (raw.colors ?? []) as string[],
    isDisabled: raw.isDisabled ?? false,
    amenities: (raw.amenities ?? {}) as StationAmenities,
    connectedStationIds: connected,
    type,
  };
}

function normalizeLine(raw: (typeof rawLines)[0]): Line {
  const id = raw.id as number;
  return {
    id,
    nameFa: LINE_NAMES_FA[id] ?? `خط ${id}`,
    nameEn: LINE_NAMES_EN[id] ?? `Line ${id}`,
    color: LINE_COLORS[id] ?? "#888",
    stationIds: (raw.stationIds ?? []) as string[],
    stationCount: raw.specifications?.stationCount ?? 0,
    interchangeStationIds: [],  // computed after stations load
  };
}

function normalizeConnection(raw: (typeof rawConnections)[0]): Connection {
  return {
    id: raw.id,
    fromStationId: raw.fromStationId,
    toStationId: raw.toStationId,
    lineIds: (raw.lineIds ?? []) as number[],
    distanceKm: raw.travelMetrics?.distance ?? 1,
    travelTimeMin: raw.travelMetrics?.travelTime ?? 2,
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

class MetroDataServiceClass {
  private _stations: Station[] = [];
  private _lines: Line[] = [];
  private _connections: Connection[] = [];

  private _stationMap = new Map<string, Station>();
  private _lineMap = new Map<number, Line>();
  private _adjacency = new Map<string, string[]>();

  private _ready = false;

  constructor() {
    this._init();
  }

  private _init() {
    // Normalize all data
    this._stations = rawStations.map(normalizeStation);
    this._lines = rawLines.map(normalizeLine);
    this._connections = rawConnections.map(normalizeConnection);

    // Build Maps
    this._stations.forEach((s) => this._stationMap.set(s.id, s));
    this._lines.forEach((l) => this._lineMap.set(l.id, l));

    // Build adjacency
    this._stations.forEach((s) => {
      this._adjacency.set(s.id, s.connectedStationIds);
    });

    // Enrich lines with interchange station IDs
    this._lines.forEach((line) => {
      line.interchangeStationIds = line.stationIds.filter((sid) => {
        const station = this._stationMap.get(sid);
        return station && station.lines.length > 1;
      });
    });

    this._ready = true;
  }

  get isReady() {
    return this._ready;
  }

  // ── Stations ───────────────────────────────────────────────────────────────

  getAllStations(): Station[] {
    return this._stations;
  }

  getStation(id: string): Station | undefined {
    return this._stationMap.get(id);
  }

  getStationsByLine(lineId: number): Station[] {
    const line = this._lineMap.get(lineId);
    if (!line) return [];
    return line.stationIds
      .map((id) => this._stationMap.get(id))
      .filter((s): s is Station => s !== undefined);
  }

  getInterchangeStations(): Station[] {
    return this._stations.filter((s) => s.lines.length > 1);
  }

  getTerminalStations(): Station[] {
    return this._stations.filter((s) => s.connectedStationIds.length === 1);
  }

  getConnectedStations(stationId: string): Station[] {
    const ids = this._adjacency.get(stationId) ?? [];
    return ids.map((id) => this._stationMap.get(id)).filter((s): s is Station => s !== undefined);
  }

  getNearestStations(lat: number, lng: number, limit = 5): Array<Station & { distanceKm: number }> {
    return this._stations
      .map((s) => ({
        ...s,
        distanceKm: this._haversine(lat, lng, s.coordinates.lat, s.coordinates.lng),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);
  }

  // ── Lines ─────────────────────────────────────────────────────────────────

  getAllLines(): Line[] {
    return this._lines;
  }

  getLine(id: number): Line | undefined {
    return this._lineMap.get(id);
  }

  // ── Connections ───────────────────────────────────────────────────────────

  getAllConnections(): Connection[] {
    return this._connections;
  }

  getConnectionsBetween(a: string, b: string): Connection[] {
    return this._connections.filter(
      (c) =>
        (c.fromStationId === a && c.toStationId === b) ||
        (c.fromStationId === b && c.toStationId === a)
    );
  }

  // ── Search ────────────────────────────────────────────────────────────────

  search(query: string, limit = 20): Station[] {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();

    const scored = this._stations
      .map((s) => {
        let score = 0;

        // Exact match gets highest score
        if (s.name.toLowerCase() === q) score += 100;
        if (s.nameFa === q) score += 100;

        // Starts with
        if (s.name.toLowerCase().startsWith(q)) score += 50;
        if (s.nameFa.startsWith(q)) score += 50;

        // Contains
        if (s.name.toLowerCase().includes(q)) score += 20;
        if (s.nameFa.includes(q)) score += 20;

        // Line number search
        const lineNum = parseInt(q);
        if (!isNaN(lineNum) && s.lines.includes(lineNum)) score += 10;

        return { station: s, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map((x) => x.station);
  }

  // ── Routing ───────────────────────────────────────────────────────────────

  /**
   * BFS-based shortest path between two stations.
   * Returns ordered array of station IDs, or null if no path found.
   */
  findPath(fromId: string, toId: string): string[] | null {
    if (fromId === toId) return [fromId];

    const visited = new Set<string>();
    const queue: Array<{ id: string; path: string[] }> = [
      { id: fromId, path: [fromId] },
    ];
    visited.add(fromId);

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;
      const neighbors = this._adjacency.get(id) ?? [];

      for (const neighbor of neighbors) {
        if (neighbor === toId) return [...path, neighbor];
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ id: neighbor, path: [...path, neighbor] });
        }
      }
    }

    return null;
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  getStats() {
    return {
      totalStations: this._stations.length,
      totalLines: this._lines.length,
      totalConnections: this._connections.length,
      interchangeCount: this.getInterchangeStations().length,
      terminalCount: this.getTerminalStations().length,
      activeStations: this._stations.filter((s) => !s.isDisabled).length,
    };
  }

  // ── Private ───────────────────────────────────────────────────────────────

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

// Singleton
export const MetroDataService = new MetroDataServiceClass();
