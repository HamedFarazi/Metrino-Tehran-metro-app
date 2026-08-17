import { RawStationData } from '../data/RawStationData';
import { MetroStation } from '../domain/MetroStation';
import { MetroLine } from '../domain/MetroLine';
import { MetroConnection } from '../domain/MetroConnection';
import { DataParserService } from './DataParserService';
import { ValidationService, ValidationResult } from './ValidationService';

/**
 * Metro Data Service
 * Main service for managing metro data operations
 */
export class MetroDataService {
  private parser: DataParserService;
  private validator: ValidationService;
  private isInitialized = false;
  
  private stations: MetroStation[] = [];
  private lines: MetroLine[] = [];
  private connections: MetroConnection[] = [];
  
  private stationMap: Map<string, MetroStation> = new Map();
  private lineMap: Map<number, MetroLine> = new Map();
  private connectionMap: Map<string, MetroConnection> = new Map();
  
  private adjacencyList: Map<string, string[]> = new Map(); // stationId -> connected stationIds
  private lineStations: Map<number, string[]> = new Map(); // lineId -> stationIds in order
  
  constructor() {
    this.parser = new DataParserService();
    this.validator = new ValidationService();
  }
  
  /**
   * Initialize service with raw data
   */
  async initialize(rawData: RawStationData): Promise<InitializationResult> {
    if (import.meta.env.DEV) {
      console.log('Initializing MetroDataService...');
    }
    
    try {
      // Step 1: Validate raw data
      const rawValidation = this.validator.validateRawData(rawData);
      if (import.meta.env.DEV) {
        console.log('Raw data validation completed');
      }
      
      if (!rawValidation.isValid && rawValidation.errors.length > 0) {
        return {
          success: false,
          validation: rawValidation,
          error: 'Raw data validation failed',
        };
      }
      
      // Step 2: Parse data
      const parsedData = this.parser.parseRawData(rawData);
      this.stations = parsedData.stations;
      this.lines = parsedData.lines;
      this.connections = parsedData.connections;
      
      // Step 3: Validate parsed data
      const domainValidation = this.validator.validateDomainModels(
        this.stations,
        this.lines,
        this.connections
      );
      if (import.meta.env.DEV) {
        console.log('Domain model validation completed');
      }
      
      if (!domainValidation.isValid && domainValidation.errors.length > 0) {
        return {
          success: false,
          validation: domainValidation,
          error: 'Domain model validation failed',
        };
      }
      
      // Step 4: Build internal data structures
      this.buildInternalStructures();
      
      // Step 5: Mark as initialized
      this.isInitialized = true;
      
      if (import.meta.env.DEV) {
        console.log(`Service initialized with ${this.stations.length} stations, ${this.lines.length} lines, ${this.connections.length} connections`);
      }
      
      return {
        success: true,
        validation: domainValidation,
        stats: {
          stations: this.stations.length,
          lines: this.lines.length,
          connections: this.connections.length,
        },
      };
      
    } catch (error) {
      console.error('Initialization failed:', error);
      return {
        success: false,
        validation: {
          isValid: false,
          errors: [{
            type: 'critical',
            code: 'INITIALIZATION_ERROR',
            message: `Initialization failed: ${error instanceof Error ? error.message : String(error)}`,
          }],
          warnings: [],
          summary: {
            totalStations: 0,
            totalLines: 0,
            totalConnections: 0,
            errorCount: 1,
            warningCount: 0,
            dataQualityScore: 0,
          },
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Build internal data structures for efficient querying
   */
  private buildInternalStructures(): void {
    // Build station map
    this.stations.forEach(station => {
      this.stationMap.set(station.id, station);
    });
    
    // Build line map
    this.lines.forEach(line => {
      this.lineMap.set(line.id, line);
      this.lineStations.set(line.id, line.stationIds);
    });
    
    // Build connection map
    this.connections.forEach(connection => {
      this.connectionMap.set(connection.id, connection);
    });
    
    // Build adjacency list
    this.stations.forEach(station => {
      this.adjacencyList.set(station.id, station.connectedStationIds);
    });
  }
  
  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
  
  /**
   * Get all stations
   */
  getAllStations(): MetroStation[] {
    this.ensureInitialized();
    return [...this.stations];
  }
  
  /**
   * Get station by ID
   */
  getStationById(id: string): MetroStation | undefined {
    this.ensureInitialized();
    return this.stationMap.get(id);
  }
  
  /**
   * Get station by name (case-insensitive)
   */
  getStationByName(name: string): MetroStation | undefined {
    this.ensureInitialized();
    const lowerName = name.toLowerCase();
    return this.stations.find(station => 
      station.name.toLowerCase() === lowerName ||
      station.translations.fa.toLowerCase() === lowerName
    );
  }
  
  /**
   * Get all lines
   */
  getAllLines(): MetroLine[] {
    this.ensureInitialized();
    return [...this.lines];
  }
  
  /**
   * Get line by ID
   */
  getLineById(id: number): MetroLine | undefined {
    this.ensureInitialized();
    return this.lineMap.get(id);
  }
  
  /**
   * Get stations on a specific line
   */
  getStationsByLine(lineId: number): MetroStation[] {
    this.ensureInitialized();
    const stationIds = this.lineStations.get(lineId) || [];
    return stationIds
      .map(id => this.stationMap.get(id))
      .filter((station): station is MetroStation => station !== undefined);
  }
  
  /**
   * Get all connections
   */
  getAllConnections(): MetroConnection[] {
    this.ensureInitialized();
    return [...this.connections];
  }
  
  /**
   * Get connections between two stations
   */
  getConnectionsBetween(stationId1: string, stationId2: string): MetroConnection[] {
    this.ensureInitialized();
    return this.connections.filter(connection => 
      (connection.fromStationId === stationId1 && connection.toStationId === stationId2) ||
      (connection.fromStationId === stationId2 && connection.toStationId === stationId1)
    );
  }
  
  /**
   * Get stations connected to a specific station
   */
  getConnectedStations(stationId: string): MetroStation[] {
    this.ensureInitialized();
    const connectedIds = this.adjacencyList.get(stationId) || [];
    return connectedIds
      .map(id => this.stationMap.get(id))
      .filter((station): station is MetroStation => station !== undefined);
  }
  
  /**
   * Find interchange stations (stations on multiple lines)
   */
  getInterchangeStations(): MetroStation[] {
    this.ensureInitialized();
    return this.stations.filter(station => station.lineIds.length > 1);
  }
  
  /**
   * Find terminal stations (stations with only one connection)
   */
  getTerminalStations(): MetroStation[] {
    this.ensureInitialized();
    return this.stations.filter(station => 
      this.adjacencyList.get(station.id)?.length === 1
    );
  }
  
  /**
   * Search stations by query
   */
  searchStations(query: string): MetroStation[] {
    this.ensureInitialized();
    const lowerQuery = query.toLowerCase();
    
    return this.stations.filter(station => 
      station.name.toLowerCase().includes(lowerQuery) ||
      station.translations.fa.toLowerCase().includes(lowerQuery) ||
      station.address.toLowerCase().includes(lowerQuery)
    );
  }
  
  /**
   * Get stations near a location
   */
  getStationsNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): MetroStation[] {
    this.ensureInitialized();
    
    return this.stations.filter(station => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        station.coordinates.latitude,
        station.coordinates.longitude
      );
      return distance <= radiusKm;
    }).sort((a, b) => {
      const distA = this.calculateDistance(
        latitude,
        longitude,
        a.coordinates.latitude,
        a.coordinates.longitude
      );
      const distB = this.calculateDistance(
        latitude,
        longitude,
        b.coordinates.latitude,
        b.coordinates.longitude
      );
      return distA - distB;
    });
  }
  
  /**
   * Get stations with specific amenities
   */
  getStationsWithAmenities(amenityFilters: Partial<Record<keyof MetroStation['amenities'], boolean>>): MetroStation[] {
    this.ensureInitialized();
    
    return this.stations.filter(station => {
      return Object.entries(amenityFilters).every(([amenity, required]) => {
        if (!required) return true;
        return station.amenities[amenity as keyof MetroStation['amenities']] === true;
      });
    });
  }
  
  /**
   * Get statistics about the metro system
   */
  getSystemStatistics(): SystemStatistics {
    this.ensureInitialized();
    
    const totalAmenities = this.stations.reduce((sum, station) => {
      const amenityCount = Object.values(station.amenities).filter(v => v === true).length;
      return sum + amenityCount;
    }, 0);
    
    const averageAmenities = totalAmenities / this.stations.length;
    
    const lineStats = this.lines.map(line => ({
      lineId: line.id,
      stationCount: line.stationIds.length,
      length: line.specifications.length,
    }));
    
    const interchangeCount = this.getInterchangeStations().length;
    const terminalCount = this.getTerminalStations().length;
    
    return {
      totalStations: this.stations.length,
      totalLines: this.lines.length,
      totalConnections: this.connections.length,
      interchangeStations: interchangeCount,
      terminalStations: terminalCount,
      averageAmenitiesPerStation: parseFloat(averageAmenities.toFixed(2)),
      lineStatistics: lineStats,
      connectivity: {
        averageConnectionsPerStation: parseFloat(
          (this.connections.length * 2 / this.stations.length).toFixed(2)
        ),
        graphDensity: parseFloat(
          (this.connections.length / (this.stations.length * (this.stations.length - 1) / 2)).toFixed(4)
        ),
      },
    };
  }
  
  /**
   * Export current data state
   */
  exportData(): ExportedData {
    this.ensureInitialized();
    
    return {
      stations: this.stations,
      lines: this.lines,
      connections: this.connections,
      metadata: {
        exportedAt: new Date(),
        version: '1.0.0',
        stationCount: this.stations.length,
        lineCount: this.lines.length,
        connectionCount: this.connections.length,
      },
    };
  }
  
  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('MetroDataService is not initialized. Call initialize() first.');
    }
  }
}

/**
 * Initialization result interface
 */
export interface InitializationResult {
  success: boolean;
  validation: ValidationResult;
  stats?: {
    stations: number;
    lines: number;
    connections: number;
  };
  error?: string;
}

/**
 * System statistics interface
 */
export interface SystemStatistics {
  totalStations: number;
  totalLines: number;
  totalConnections: number;
  interchangeStations: number;
  terminalStations: number;
  averageAmenitiesPerStation: number;
  lineStatistics: Array<{
    lineId: number;
    stationCount: number;
    length: number;
  }>;
  connectivity: {
    averageConnectionsPerStation: number;
    graphDensity: number;
  };
}

/**
 * Exported data interface
 */
export interface ExportedData {
  stations: MetroStation[];
  lines: MetroLine[];
  connections: MetroConnection[];
  metadata: {
    exportedAt: Date;
    version: string;
    stationCount: number;
    lineCount: number;
    connectionCount: number;
  };
}