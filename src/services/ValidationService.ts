import { RawStationData, RawStation } from '../data/RawStationData';
import { MetroStation } from '../domain/MetroStation';
import { MetroLine } from '../domain/MetroLine';
import { MetroConnection } from '../domain/MetroConnection';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

/**
 * Validation error interface
 */
export interface ValidationError {
  type: 'error' | 'critical';
  code: string;
  message: string;
  location?: string;
  field?: string;
  details?: any;
}

/**
 * Validation warning interface
 */
export interface ValidationWarning {
  type: 'warning' | 'info';
  code: string;
  message: string;
  location?: string;
  field?: string;
  suggestions?: string[];
}

/**
 * Validation summary
 */
export interface ValidationSummary {
  totalStations: number;
  totalLines: number;
  totalConnections: number;
  errorCount: number;
  warningCount: number;
  dataQualityScore: number;
}

/**
 * Validation Service
 * Ensures data integrity and quality
 */
export class ValidationService {
  /**
   * Validate raw JSON data
   */
  validateRawData(rawData: RawStationData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    console.log('Validating raw data...');
    
    // Basic structure validation
    if (!rawData || typeof rawData !== 'object') {
      errors.push({
        type: 'critical',
        code: 'INVALID_STRUCTURE',
        message: 'Data is not a valid JSON object',
      });
      return this.createResult(errors, warnings, rawData);
    }
    
    const stationNames = Object.keys(rawData);
    
    // Check if we have stations
    if (stationNames.length === 0) {
      errors.push({
        type: 'critical',
        code: 'NO_STATIONS',
        message: 'No stations found in data',
      });
    }
    
    // Validate each station
    stationNames.forEach((stationName, index) => {
      const station = rawData[stationName];
      this.validateStation(stationName, station, errors, warnings, rawData);
    });
    
    // Check for data consistency issues
    this.checkConsistencyIssues(rawData, errors, warnings);
    
    return this.createResult(errors, warnings, rawData);
  }

  /**
   * Validate parsed domain models
   */
  validateDomainModels(
    stations: MetroStation[],
    lines: MetroLine[],
    connections: MetroConnection[]
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    console.log('Validating domain models...');
    
    // Validate stations
    stations.forEach(station => {
      this.validateParsedStation(station, errors, warnings, stations, connections);
    });
    
    // Validate lines
    lines.forEach(line => {
      this.validateParsedLine(line, errors, warnings, stations);
    });
    
    // Validate connections
    connections.forEach(connection => {
      this.validateParsedConnection(connection, errors, warnings, stations);
    });
    
    // Check graph connectivity
    this.checkGraphConnectivity(stations, connections, errors, warnings);
    
    return this.createResult(errors, warnings, { stations, lines, connections });
  }

  /**
   * Validate individual raw station
   */
  private validateStation(
    stationName: string,
    station: RawStation,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    allStations: RawStationData
  ): void {
    // Required fields validation
    const requiredFields = ['name', 'translations', 'lines', 'longitude', 'latitude', 'relations'];
    requiredFields.forEach(field => {
      if (!(field in station)) {
        errors.push({
          type: 'error',
          code: 'MISSING_FIELD',
          message: `Station '${stationName}' is missing required field '${field}'`,
          location: `stations.${stationName}`,
          field,
        });
      }
    });

    // Data type validation
    if (typeof station.longitude !== 'number' || isNaN(station.longitude)) {
      errors.push({
        type: 'error',
        code: 'INVALID_LONGITUDE',
        message: `Station '${stationName}' has invalid longitude: ${station.longitude}`,
        location: `stations.${stationName}.longitude`,
        field: 'longitude',
        details: { value: station.longitude },
      });
    }

    if (typeof station.latitude !== 'number' || isNaN(station.latitude)) {
      errors.push({
        type: 'error',
        code: 'INVALID_LATITUDE',
        message: `Station '${stationName}' has invalid latitude: ${station.latitude}`,
        location: `stations.${stationName}.latitude`,
        field: 'latitude',
        details: { value: station.latitude },
      });
    }

    // Check for valid lines
    if (!Array.isArray(station.lines) || station.lines.length === 0) {
      errors.push({
        type: 'error',
        code: 'INVALID_LINES',
        message: `Station '${stationName}' has invalid or empty lines array`,
        location: `stations.${stationName}.lines`,
        field: 'lines',
      });
    } else {
      station.lines.forEach(line => {
        if (typeof line !== 'number' || line < 1 || line > 7) {
          warnings.push({
            type: 'warning',
            code: 'UNKNOWN_LINE',
            message: `Station '${stationName}' references unknown line: ${line}`,
            location: `stations.${stationName}.lines`,
            field: 'lines',
            suggestions: ['Lines should be between 1 and 7 for Tehran Metro'],
          });
        }
      });
    }

    // Check for waterCooler null issue
    if (station.waterCooler === null) {
      warnings.push({
        type: 'warning',
        code: 'NULL_WATER_COOLER',
        message: `Station '${stationName}' has null waterCooler field (should be boolean)`,
        location: `stations.${stationName}.waterCooler`,
        field: 'waterCooler',
        suggestions: ['Convert null to false for consistency'],
      });
    }

    // Check for typos in field names
    if ('fastFoodn' in station) {
      errors.push({
        type: 'error',
        code: 'TYPOSQUATTING_FIELD',
        message: `Station '${stationName}' has typo in field name: 'fastFoodn' instead of 'fastFood'`,
        location: `stations.${stationName}`,
        field: 'fastFoodn',
        suggestions: ['Rename field to fastFood'],
      });
    }

    // Check relations exist
    if (Array.isArray(station.relations)) {
      station.relations.forEach(relation => {
        if (!(relation in allStations)) {
          warnings.push({
            type: 'warning',
            code: 'MISSING_RELATION',
            message: `Station '${stationName}' references non-existent station: ${relation}`,
            location: `stations.${stationName}.relations`,
            field: 'relations',
          });
        }
      });
      
      // Check for self-references
      if (station.relations.includes(stationName)) {
        warnings.push({
          type: 'warning',
          code: 'SELF_REFERENCE',
          message: `Station '${stationName}' references itself in relations`,
          location: `stations.${stationName}.relations`,
          field: 'relations',
          suggestions: ['Remove self-reference from relations array'],
        });
      }
    }

    // Check coordinate validity (Tehran bounds)
    if (station.latitude < 35.4 || station.latitude > 35.9 || 
        station.longitude < 50.9 || station.longitude > 51.6) {
      warnings.push({
        type: 'warning',
        code: 'OUT_OF_BOUNDS',
        message: `Station '${stationName}' coordinates may be outside Tehran area`,
        location: `stations.${stationName}.coordinates`,
        field: 'coordinates',
        details: { latitude: station.latitude, longitude: station.longitude },
      });
    }
  }

  /**
   * Validate parsed station
   */
  private validateParsedStation(
    station: MetroStation,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    allStations: MetroStation[],
    connections: MetroConnection[]
  ): void {
    // Check ID uniqueness
    const duplicateId = allStations.filter(s => s.id === station.id).length > 1;
    if (duplicateId) {
      errors.push({
        type: 'error',
        code: 'DUPLICATE_ID',
        message: `Duplicate station ID: ${station.id}`,
        location: `stations.${station.id}`,
        field: 'id',
      });
    }

    // Check connected stations exist
    station.connectedStationIds.forEach(connectedId => {
      const connectedExists = allStations.some(s => s.id === connectedId);
      if (!connectedExists) {
        errors.push({
          type: 'error',
          code: 'INVALID_CONNECTION',
          message: `Station '${station.id}' references non-existent connected station: ${connectedId}`,
          location: `stations.${station.id}.connectedStationIds`,
          field: 'connectedStationIds',
        });
      }
    });

    // Check for isolated stations (no connections)
    if (station.connectedStationIds.length === 0) {
      warnings.push({
        type: 'warning',
        code: 'ISOLATED_STATION',
        message: `Station '${station.name}' has no connections`,
        location: `stations.${station.id}`,
        suggestions: ['Check station relations in raw data'],
      });
    }

    // Validate amenities
    this.validateAmenities(station.amenities, station.id, errors, warnings);
  }

  /**
   * Validate amenities
   */
  private validateAmenities(
    amenities: any,
    stationId: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const amenityFields = [
      'restroom', 'coffeeShop', 'groceryStore', 'fastFood', 'cleanFood',
      'atm', 'elevator', 'bicycleParking', 'waterCooler', 'creditTicketSales',
      'blindPath', 'waitingChair', 'fireSuppressionSystem', 'fireExtinguisher',
      'metroPolice', 'camera', 'trashCan', 'smokingArea', 'petsAllowed',
      'freeWifi', 'prayerRoom'
    ];

    amenityFields.forEach(field => {
      if (!(field in amenities)) {
        warnings.push({
          type: 'warning',
          code: 'MISSING_AMENITY',
          message: `Station '${stationId}' is missing amenity field: ${field}`,
          location: `stations.${stationId}.amenities`,
          field,
        });
      } else if (typeof amenities[field] !== 'boolean') {
        warnings.push({
          type: 'warning',
          code: 'INVALID_AMENITY_TYPE',
          message: `Station '${stationId}' amenity '${field}' is not boolean: ${typeof amenities[field]}`,
          location: `stations.${stationId}.amenities`,
          field,
        });
      }
    });
  }

  /**
   * Validate parsed line
   */
  private validateParsedLine(
    line: MetroLine,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    stations: MetroStation[]
  ): void {
    // Check line ID validity
    if (line.id < 1 || line.id > 7) {
      warnings.push({
        type: 'warning',
        code: 'UNKNOWN_LINE_ID',
        message: `Line ${line.id} is outside expected range (1-7)`,
        location: `lines.${line.id}`,
        field: 'id',
      });
    }

    // Check station references
    line.stationIds.forEach(stationId => {
      const stationExists = stations.some(s => s.id === stationId);
      if (!stationExists) {
        errors.push({
          type: 'error',
          code: 'INVALID_STATION_REFERENCE',
          message: `Line ${line.id} references non-existent station: ${stationId}`,
          location: `lines.${line.id}.stationIds`,
          field: 'stationIds',
        });
      }
    });

    // Check color format
    if (!line.color.match(/^#[0-9A-F]{6}$/i)) {
      warnings.push({
        type: 'warning',
        code: 'INVALID_COLOR_FORMAT',
        message: `Line ${line.id} has invalid color format: ${line.color}`,
        location: `lines.${line.id}`,
        field: 'color',
        suggestions: ['Use HEX format like #E0001F'],
      });
    }
  }

  /**
   * Validate parsed connection
   */
  private validateParsedConnection(
    connection: MetroConnection,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    stations: MetroStation[]
  ): void {
    // Check station references
    const fromStationExists = stations.some(s => s.id === connection.fromStationId);
    const toStationExists = stations.some(s => s.id === connection.toStationId);
    
    if (!fromStationExists) {
      errors.push({
        type: 'error',
        code: 'INVALID_FROM_STATION',
        message: `Connection '${connection.id}' references non-existent from station: ${connection.fromStationId}`,
        location: `connections.${connection.id}`,
        field: 'fromStationId',
      });
    }
    
    if (!toStationExists) {
      errors.push({
        type: 'error',
        code: 'INVALID_TO_STATION',
        message: `Connection '${connection.id}' references non-existent to station: ${connection.toStationId}`,
        location: `connections.${connection.id}`,
        field: 'toStationId',
      });
    }

    // Check for self-connections
    if (connection.fromStationId === connection.toStationId) {
      errors.push({
        type: 'error',
        code: 'SELF_CONNECTION',
        message: `Connection '${connection.id}' connects station to itself`,
        location: `connections.${connection.id}`,
      });
    }

    // Validate travel metrics
    if (connection.travelMetrics.distance <= 0) {
      warnings.push({
        type: 'warning',
        code: 'INVALID_DISTANCE',
        message: `Connection '${connection.id}' has invalid distance: ${connection.travelMetrics.distance}`,
        location: `connections.${connection.id}.travelMetrics`,
        field: 'distance',
      });
    }

    if (connection.travelMetrics.travelTime <= 0) {
      warnings.push({
        type: 'warning',
        code: 'INVALID_TRAVEL_TIME',
        message: `Connection '${connection.id}' has invalid travel time: ${connection.travelMetrics.travelTime}`,
        location: `connections.${connection.id}.travelMetrics`,
        field: 'travelTime',
      });
    }
  }

  /**
   * Check for data consistency issues
   */
  private checkConsistencyIssues(
    rawData: RawStationData,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const stationNames = Object.keys(rawData);
    
    // Check for duplicate station names (case-insensitive)
    const lowerCaseNames = stationNames.map(name => name.toLowerCase());
    const duplicates = lowerCaseNames.filter((name, index) => lowerCaseNames.indexOf(name) !== index);
    
    if (duplicates.length > 0) {
      warnings.push({
        type: 'warning',
        code: 'CASE_DUPLICATES',
        message: `Found ${duplicates.length} potential duplicate station names (case-insensitive)`,
        location: 'stations',
        suggestions: ['Check for case variations of same station'],
      });
    }

    // Check for stations with same coordinates
    const coordinateMap = new Map<string, string[]>();
    stationNames.forEach(name => {
      const station = rawData[name];
      const coordKey = `${station.latitude.toFixed(6)},${station.longitude.toFixed(6)}`;
      if (!coordinateMap.has(coordKey)) {
        coordinateMap.set(coordKey, []);
      }
      coordinateMap.get(coordKey)!.push(name);
    });

    coordinateMap.forEach((stations, coord) => {
      if (stations.length > 1) {
        warnings.push({
          type: 'warning',
          code: 'DUPLICATE_COORDINATES',
          message: `Stations ${stations.join(', ')} share the same coordinates`,
          location: 'stations.coordinates',
          details: { coordinates: coord, stations },
        });
      }
    });
  }

  /**
   * Check graph connectivity
   */
  private checkGraphConnectivity(
    stations: MetroStation[],
    connections: MetroConnection[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Build adjacency list
    const adjacencyList = new Map<string, string[]>();
    stations.forEach(station => {
      adjacencyList.set(station.id, []);
    });

    connections.forEach(connection => {
      adjacencyList.get(connection.fromStationId)!.push(connection.toStationId);
      adjacencyList.get(connection.toStationId)!.push(connection.fromStationId);
    });

    // Check for connected components using BFS
    const visited = new Set<string>();
    const components: string[][] = [];

    stations.forEach(station => {
      if (!visited.has(station.id)) {
        const component: string[] = [];
        const queue: string[] = [station.id];
        
        while (queue.length > 0) {
          const current = queue.shift()!;
          if (!visited.has(current)) {
            visited.add(current);
            component.push(current);
            
            const neighbors = adjacencyList.get(current) || [];
            neighbors.forEach(neighbor => {
              if (!visited.has(neighbor)) {
                queue.push(neighbor);
              }
            });
          }
        }
        
        components.push(component);
      }
    });

    // Report connectivity issues
    if (components.length > 1) {
      warnings.push({
        type: 'warning',
        code: 'DISCONNECTED_GRAPH',
        message: `Graph is disconnected into ${components.length} components`,
        location: 'graph',
        details: { componentSizes: components.map(c => c.length) },
        suggestions: ['Check missing connections between stations'],
      });
    }

    // Check for stations with only one connection (potential terminals)
    const singleConnectionStations = stations.filter(station => {
      const connections = adjacencyList.get(station.id) || [];
      return connections.length === 1;
    });

    if (singleConnectionStations.length > 0) {
      warnings.push({
        type: 'info',
        code: 'TERMINAL_STATIONS',
        message: `Found ${singleConnectionStations.length} stations with only one connection (potential terminals)`,
        location: 'graph',
        details: { stations: singleConnectionStations.map(s => s.name) },
      });
    }
  }

  /**
   * Create validation result
   */
  private createResult(
    errors: ValidationError[],
    warnings: ValidationWarning[],
    data: any
  ): ValidationResult {
    const errorCount = errors.filter(e => e.type === 'error' || e.type === 'critical').length;
    const warningCount = warnings.length + errors.filter(e => e.type === 'warning').length;
    
    // Calculate data quality score (0-100)
    let qualityScore = 100;
    qualityScore -= errorCount * 10; // -10 points per error
    qualityScore -= warningCount * 2; // -2 points per warning
    qualityScore = Math.max(0, qualityScore);
    
    const summary: ValidationSummary = {
      totalStations: 'stations' in data ? 
        (Array.isArray(data.stations) ? data.stations.length : Object.keys(data).length) : 0,
      totalLines: 'lines' in data ? (Array.isArray(data.lines) ? data.lines.length : 0) : 0,
      totalConnections: 'connections' in data ? (Array.isArray(data.connections) ? data.connections.length : 0) : 0,
      errorCount,
      warningCount,
      dataQualityScore: Math.round(qualityScore),
    };

    return {
      isValid: errorCount === 0,
      errors,
      warnings,
      summary,
    };
  }

  /**
   * Generate validation report
   */
  generateReport(result: ValidationResult): string {
    const { isValid, errors, warnings, summary } = result;
    
    let report = `=== VALIDATION REPORT ===\n\n`;
    report += `Status: ${isValid ? '✅ VALID' : '❌ INVALID'}\n`;
    report += `\n=== SUMMARY ===\n`;
    report += `Total Stations: ${summary.totalStations}\n`;
    report += `Total Lines: ${summary.totalLines}\n`;
    report += `Total Connections: ${summary.totalConnections}\n`;
    report += `Errors: ${summary.errorCount}\n`;
    report += `Warnings: ${summary.warningCount}\n`;
    report += `Data Quality Score: ${summary.dataQualityScore}/100\n`;
    
    if (errors.length > 0) {
      report += `\n=== ERRORS ===\n`;
      errors.forEach((error, index) => {
        report += `${index + 1}. [${error.code}] ${error.message}\n`;
        if (error.location) report += `   Location: ${error.location}\n`;
        if (error.field) report += `   Field: ${error.field}\n`;
        if (error.details) report += `   Details: ${JSON.stringify(error.details)}\n`;
      });
    }
    
    if (warnings.length > 0) {
      report += `\n=== WARNINGS ===\n`;
      warnings.forEach((warning, index) => {
        report += `${index + 1}. [${warning.code}] ${warning.message}\n`;
        if (warning.location) report += `   Location: ${warning.location}\n`;
        if (warning.field) report += `   Field: ${warning.field}\n`;
        if (warning.suggestions) {
          report += `   Suggestions:\n`;
          warning.suggestions.forEach(suggestion => {
            report += `     - ${suggestion}\n`;
          });
        }
      });
    }
    
    report += `\n=== RECOMMENDATIONS ===\n`;
    if (summary.errorCount > 0) {
      report += `1. Fix all errors before using data\n`;
    }
    if (summary.warningCount > 0) {
      report += `2. Review and address warnings for better data quality\n`;
    }
    if (summary.dataQualityScore < 80) {
      report += `3. Data quality needs improvement (score: ${summary.dataQualityScore}/100)\n`;
    }
    
    return report;
  }
}