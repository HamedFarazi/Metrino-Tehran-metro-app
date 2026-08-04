import { RawStationData, RawStation } from '../data/RawStationData';
import { MetroStation, StationAmenities, StationType } from '../domain/MetroStation';
import { MetroLine, LineStatus, LineInterchange, InterchangeType } from '../domain/MetroLine';
import { MetroConnection, ConnectionType, ConnectionStatus } from '../domain/MetroConnection';
import { LINE_COLORS, LINE_NAMES, COMMON_INTERCHANGES } from '../data/RawStationData';

/**
 * Data Parser Service
 * Converts raw JSON data into clean domain models
 */
export class DataParserService {
  private stationIdMap: Map<string, string> = new Map(); // raw name -> stable ID
  private parsedStations: Map<string, MetroStation> = new Map();
  private parsedLines: Map<number, MetroLine> = new Map();
  private parsedConnections: Map<string, MetroConnection> = new Map();

  /**
   * Parse raw station data into clean domain models
   */
  parseRawData(rawData: RawStationData): {
    stations: MetroStation[];
    lines: MetroLine[];
    connections: MetroConnection[];
  } {
    console.log('Starting data parsing...');
    
    // Step 1: Generate stable IDs for all stations
    this.generateStationIds(rawData);
    
    // Step 2: Parse stations
    const stations = this.parseStations(rawData);
    
    // Step 3: Parse lines from station data
    const lines = this.parseLines(stations);
    
    // Step 4: Parse connections between stations
    const connections = this.parseConnections(rawData, stations);
    
    console.log(`Parsing complete: ${stations.length} stations, ${lines.length} lines, ${connections.length} connections`);
    
    return {
      stations,
      lines,
      connections
    };
  }

  /**
   * Generate stable UUIDs for all stations
   */
  private generateStationIds(rawData: RawStationData): void {
    Object.keys(rawData).forEach(stationName => {
      // Create a stable ID based on station name hash
      const stableId = this.generateStableId(stationName);
      this.stationIdMap.set(stationName, stableId);
    });
  }

  /**
   * Generate a stable ID from station name
   */
  private generateStableId(stationName: string): string {
    // Simple hash function for demo - in production use UUID or other stable method
    let hash = 0;
    for (let i = 0; i < stationName.length; i++) {
      const char = stationName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `station_${Math.abs(hash)}`;
  }

  /**
   * Generate connection ID from station IDs
   */
  private generateConnectionId(stationId1: string, stationId2: string): string {
    const sortedIds = [stationId1, stationId2].sort();
    let hash = 0;
    for (let i = 0; i < sortedIds.join('').length; i++) {
      const char = sortedIds.join('').charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `conn_${Math.abs(hash)}`;
  }

  /**
   * Parse raw stations into MetroStation objects
   */
  private parseStations(rawData: RawStationData): MetroStation[] {
    const stations: MetroStation[] = [];
    const now = new Date();

    Object.entries(rawData).forEach(([rawName, rawStation]) => {
      const stationId = this.stationIdMap.get(rawName)!;
      
      // Determine station type
      const stationType = this.determineStationType(rawStation, rawName);
      
      const station: MetroStation = {
        id: stationId,
        name: rawStation.name,
        translations: {
          fa: rawStation.translations.fa,
          // Can add more languages here as needed
        },
        lineIds: rawStation.lines,
        coordinates: {
          longitude: rawStation.longitude,
          latitude: rawStation.latitude,
        },
        address: rawStation.address,
        colors: rawStation.colors,
        isDisabled: rawStation.disabled,
        amenities: this.parseAmenities(rawStation),
        connectedStationIds: this.mapConnectedStationIds(rawStation.relations),
        metadata: {
          createdAt: now,
          updatedAt: now,
          sourceId: rawName,
        },
      };

      this.parsedStations.set(stationId, station);
      stations.push(station);
    });

    return stations;
  }

  /**
   * Parse amenities from raw station data
   */
  private parseAmenities(rawStation: RawStation): StationAmenities {
    return {
      restroom: rawStation.wc,
      coffeeShop: rawStation.coffeeShop,
      groceryStore: rawStation.groceryStore,
      fastFood: rawStation.fastFood,
      cleanFood: rawStation.cleanFood,
      atm: rawStation.atm,
      elevator: rawStation.elevator,
      bicycleParking: rawStation.bicycleParking,
      waterCooler: rawStation.waterCooler === null ? false : rawStation.waterCooler,
      creditTicketSales: rawStation.creditTicketSales,
      blindPath: rawStation.blindPath,
      waitingChair: rawStation.waitingChair,
      fireSuppressionSystem: rawStation.fireSuppressionSystem,
      fireExtinguisher: rawStation.fireExtinguisher,
      metroPolice: rawStation.metroPolice,
      camera: rawStation.camera,
      trashCan: rawStation.trashCan,
      smokingArea: rawStation.smoking,
      petsAllowed: rawStation.petsAllowed,
      freeWifi: rawStation.freeWifi,
      prayerRoom: rawStation.prayerRoom,
    };
  }

  /**
   * Map connected station names to IDs
   */
  private mapConnectedStationIds(relationNames: string[]): string[] {
    return relationNames
      .map(name => this.stationIdMap.get(name))
      .filter((id): id is string => id !== undefined);
  }

  /**
   * Determine station type based on data
   */
  private determineStationType(rawStation: RawStation, rawName: string): StationType {
    // Check if it's an interchange station
    if (rawStation.lines.length > 1) {
      return StationType.INTERCHANGE;
    }
    
    // Check if it's in common interchange list
    if (COMMON_INTERCHANGES.includes(rawName as any)) {
      return StationType.INTERCHANGE;
    }
    
    // Check if it's likely a terminal (few connections)
    if (rawStation.relations.length === 1) {
      return StationType.TERMINAL;
    }
    
    // Default to regular station
    return StationType.REGULAR;
  }

  /**
   * Parse lines from station data
   */
  private parseLines(stations: MetroStation[]): MetroLine[] {
    const lines = new Map<number, MetroLine>();
    const now = new Date();
    
    // Group stations by line
    const stationsByLine = new Map<number, string[]>();
    
    stations.forEach(station => {
      station.lineIds.forEach(lineId => {
        if (!stationsByLine.has(lineId)) {
          stationsByLine.set(lineId, []);
        }
        stationsByLine.get(lineId)!.push(station.id);
      });
    });
    
    // Create line objects
    stationsByLine.forEach((stationIds, lineId) => {
      const line: MetroLine = {
        id: lineId,
        name: LINE_NAMES[lineId] || { en: `Line ${lineId}`, fa: `خط ${lineId}` },
        color: LINE_COLORS[lineId] || '#000000',
        description: {
          en: `Tehran Metro Line ${lineId}`,
          fa: `خط مترو تهران ${lineId}`,
        },
        stationIds: this.orderStationsInLine(lineId, stationIds, stations),
        status: LineStatus.OPERATIONAL,
        operational: {
          firstTrain: '05:30',
          lastTrain: '23:00',
          peakFrequency: 5,
          offPeakFrequency: 10,
          is24Hours: false,
        },
        specifications: {
          length: this.calculateLineLength(lineId, stationIds, stations),
          stationCount: stationIds.length,
          trainType: 'Standard Gauge',
          openingYear: this.getLineOpeningYear(lineId),
          gauge: 1435,
          electrification: '750V DC third rail',
        },
        interchanges: this.findLineInterchanges(lineId, stations),
        metadata: {
          createdAt: now,
          updatedAt: now,
        },
      };
      
      this.parsedLines.set(lineId, line);
      lines.set(lineId, line);
    });
    
    return Array.from(lines.values());
  }

  /**
   * Order stations in a line (simplified - would need actual sequence data)
   */
  private orderStationsInLine(lineId: number, stationIds: string[], stations: MetroStation[]): string[] {
    // This is a simplified ordering - in reality would need actual sequence data
    // For now, return stations as-is (they might be in order in the JSON)
    return stationIds;
  }

  /**
   * Calculate approximate line length
   */
  private calculateLineLength(lineId: number, stationIds: string[], stations: MetroStation[]): number {
    // Simplified calculation - would need actual route data
    return stationIds.length * 1.5; // ~1.5km between stations on average
  }

  /**
   * Get line opening year
   */
  private getLineOpeningYear(lineId: number): number {
    const openingYears: Record<number, number> = {
      1: 1999,
      2: 2000,
      3: 2012,
      4: 2008,
      5: 1999,
      6: 2019,
      7: 2017,
    };
    return openingYears[lineId] || 2000;
  }

  /**
   * Find interchange stations for a line
   */
  private findLineInterchanges(lineId: number, stations: MetroStation[]): LineInterchange[] {
    const interchanges: LineInterchange[] = [];
    
    stations.forEach(station => {
      if (station.lineIds.includes(lineId) && station.lineIds.length > 1) {
        interchanges.push({
          stationId: station.id,
          connectedLineIds: station.lineIds.filter(id => id !== lineId),
          type: InterchangeType.SAME_STATION,
          transferTime: 3, // Estimated 3 minutes for transfer
          isCrossPlatform: this.isCrossPlatformInterchange(station.name),
        });
      }
    });
    
    return interchanges;
  }

  /**
   * Check if station has cross-platform interchange
   */
  private isCrossPlatformInterchange(stationName: string): boolean {
    // Simplified check - would need actual platform data
    const crossPlatformStations = ['Shahid Beheshti', 'Imam Khomeini', 'Darvazeh Dolat'];
    return crossPlatformStations.includes(stationName);
  }

  /**
   * Parse connections between stations
   */
  private parseConnections(rawData: RawStationData, stations: MetroStation[]): MetroConnection[] {
    const connections: MetroConnection[] = [];
    const connectionMap = new Set<string>(); // To avoid duplicates
    const now = new Date();

    stations.forEach(station => {
      station.connectedStationIds.forEach(connectedId => {
        // Create unique key for connection (sorted to avoid duplicates)
        const connectionKey = [station.id, connectedId].sort().join('-');
        
        if (!connectionMap.has(connectionKey)) {
          const connectedStation = this.parsedStations.get(connectedId);
          if (!connectedStation) return;
          
          // Find common lines between stations
          const commonLines = station.lineIds.filter(lineId => 
            connectedStation.lineIds.includes(lineId)
          );
          
          if (commonLines.length > 0) {
            const connection: MetroConnection = {
              id: `conn_${this.generateConnectionId(station.id, connectedId)}`,
              fromStationId: station.id,
              toStationId: connectedId,
              lineIds: commonLines,
              type: this.determineConnectionType(station, connectedStation),
              travelMetrics: {
                distance: this.calculateDistance(station, connectedStation),
                travelTime: this.estimateTravelTime(station, connectedStation),
                isUnderground: true, // Most Tehran Metro connections are underground
                tracks: 2, // Double track for most lines
              },
              constraints: {
                maxSpeed: 80, // km/h
                isBidirectional: true,
                status: ConnectionStatus.ACTIVE,
              },
              geography: {
                start: station.coordinates,
                end: connectedStation.coordinates,
                crossesWater: this.doesCrossWater(station, connectedStation),
              },
              metadata: {
                createdAt: now,
                updatedAt: now,
              },
            };
            
            connections.push(connection);
            this.parsedConnections.set(connection.id, connection);
            connectionMap.add(connectionKey);
          }
        }
      });
    });

    return connections;
  }

  /**
   * Determine connection type
   */
  private determineConnectionType(station1: MetroStation, station2: MetroStation): ConnectionType {
    // Check if stations are on different lines (interchange)
    const hasDifferentLines = station1.lineIds.some(lineId => 
      !station2.lineIds.includes(lineId)
    );
    
    if (hasDifferentLines && station1.lineIds.length > 1 && station2.lineIds.length > 1) {
      return ConnectionType.INTERCHANGE;
    }
    
    return ConnectionType.REGULAR;
  }

  /**
   * Calculate distance between stations using Haversine formula
   */
  private calculateDistance(station1: MetroStation, station2: MetroStation): number {
    const R = 6371; // Earth's radius in kilometers
    const lat1 = station1.coordinates.latitude * Math.PI / 180;
    const lat2 = station2.coordinates.latitude * Math.PI / 180;
    const deltaLat = (station2.coordinates.latitude - station1.coordinates.latitude) * Math.PI / 180;
    const deltaLon = (station2.coordinates.longitude - station1.coordinates.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in kilometers
  }

  /**
   * Estimate travel time between stations
   */
  private estimateTravelTime(station1: MetroStation, station2: MetroStation): number {
    const distance = this.calculateDistance(station1, station2);
    // Estimate 2 minutes per km + 30 seconds stop time
    return (distance * 2) + 0.5;
  }

  /**
   * Check if connection crosses water bodies
   */
  private doesCrossWater(station1: MetroStation, station2: MetroStation): boolean {
    // Simplified check - would need geographic data
    // Tehran has few water crossings in metro system
    return false;
  }

  /**
   * Get station by ID
   */
  getStationById(id: string): MetroStation | undefined {
    return this.parsedStations.get(id);
  }

  /**
   * Get line by ID
   */
  getLineById(id: number): MetroLine | undefined {
    return this.parsedLines.get(id);
  }

  /**
   * Get connection by ID
   */
  getConnectionById(id: string): MetroConnection | undefined {
    return this.parsedConnections.get(id);
  }

  /**
   * Get all stations
   */
  getAllStations(): MetroStation[] {
    return Array.from(this.parsedStations.values());
  }

  /**
   * Get all lines
   */
  getAllLines(): MetroLine[] {
    return Array.from(this.parsedLines.values());
  }

  /**
   * Get all connections
   */
  getAllConnections(): MetroConnection[] {
    return Array.from(this.parsedConnections.values());
  }
}