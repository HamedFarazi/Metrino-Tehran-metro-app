import { RawStationData } from '../data/RawStationData';

/**
 * Data Loader Utility
 * Handles loading and processing of JSON data files
 */
export class DataLoader {
  /**
   * Load raw station data from JSON file
   */
  static async loadRawStationData(): Promise<RawStationData> {
    try {
      console.log('Loading raw station data...');
      
      // In a real application, this would fetch from a URL or file system
      // For now, we'll return a placeholder that will be replaced with actual data
      const placeholderData: RawStationData = {};
      
      // Note: In production, you would implement actual file loading:
      // const response = await fetch('/path/to/stations.json');
      // const data = await response.json();
      // return data as RawStationData;
      
      console.warn('Using placeholder data - implement actual file loading');
      return placeholderData;
    } catch (error) {
      console.error('Failed to load raw station data:', error);
      throw new Error(`Failed to load station data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate JSON structure
   */
  static validateJsonStructure(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check if it has the expected structure of RawStationData
    const sampleKey = Object.keys(data)[0];
    if (!sampleKey) {
      return true; // Empty object is valid structure
    }

    const sampleStation = data[sampleKey];
    if (!sampleStation || typeof sampleStation !== 'object') {
      return false;
    }

    // Check for required fields
    const requiredFields = ['name', 'translations', 'lines', 'longitude', 'latitude', 'relations'];
    return requiredFields.every(field => field in sampleStation);
  }

  /**
   * Transform data if needed (fix common issues)
   */
  static transformData(data: any): RawStationData {
    if (!this.validateJsonStructure(data)) {
      throw new Error('Invalid JSON structure');
    }

    const transformed: RawStationData = { ...data };

    // Fix common data issues
    Object.keys(transformed).forEach(stationName => {
      const station = transformed[stationName];

      // Fix waterCooler null issue
      if (station.waterCooler === null) {
        station.waterCooler = false;
      }

      // Fix fastFoodn typo if present
      if ('fastFoodn' in station) {
        station.fastFood = station.fastFoodn;
        delete station.fastFoodn;
      }

      // Ensure relations is an array
      if (!Array.isArray(station.relations)) {
        station.relations = [];
      }

      // Ensure colors is an array
      if (!Array.isArray(station.colors)) {
        station.colors = [];
      }

      // Ensure lines is an array
      if (!Array.isArray(station.lines)) {
        station.lines = [];
      }

      // Ensure coordinates are numbers
      if (typeof station.longitude === 'string') {
        station.longitude = parseFloat(station.longitude);
      }
      if (typeof station.latitude === 'string') {
        station.latitude = parseFloat(station.latitude);
      }

      // Remove self-references from relations
      station.relations = station.relations.filter(
        (relation: string) => relation !== stationName
      );
    });

    return transformed;
  }

  /**
   * Create sample data for testing
   */
  static createSampleData(): RawStationData {
    return {
      "Tajrish": {
        "name": "Tajrish",
        "translations": { "fa": "تجریش" },
        "lines": [1],
        "longitude": 51.43348783883829,
        "latitude": 35.80464927254761,
        "address": "خیابان شریعتی-ضلع جنوب غربی میدان قدس",
        "colors": ["#E0001F"],
        "disabled": false,
        "wc": false,
        "coffeeShop": false,
        "groceryStore": false,
        "fastFood": true,
        "atm": false,
        "elevator": false,
        "bicycleParking": false,
        "waterCooler": false,
        "cleanFood": true,
        "blindPath": true,
        "fireSuppressionSystem": true,
        "fireExtinguisher": true,
        "metroPolice": true,
        "creditTicketSales": true,
        "waitingChair": true,
        "camera": true,
        "trashCan": true,
        "smoking": false,
        "petsAllowed": false,
        "freeWifi": false,
        "prayerRoom": true,
        "relations": ["Gheytariyeh"]
      },
      "Gheytariyeh": {
        "name": "Gheytariyeh",
        "translations": { "fa": "قیطریه" },
        "lines": [1],
        "longitude": 51.435008131547185,
        "latitude": 35.79304519418441,
        "address": "خیابان دکترشریعتی - روبه روی پل رومی",
        "colors": ["#E0001F"],
        "disabled": false,
        "wc": false,
        "coffeeShop": false,
        "groceryStore": false,
        "fastFood": true,
        "atm": false,
        "elevator": false,
        "bicycleParking": true,
        "waterCooler": false,
        "cleanFood": true,
        "blindPath": true,
        "fireSuppressionSystem": true,
        "fireExtinguisher": true,
        "metroPolice": true,
        "creditTicketSales": true,
        "waitingChair": true,
        "camera": true,
        "trashCan": true,
        "smoking": false,
        "petsAllowed": false,
        "freeWifi": false,
        "prayerRoom": true,
        "relations": ["Tajrish", "Shahid Sadr"]
      },
      "Shahid Beheshti": {
        "name": "Shahid Beheshti",
        "translations": { "fa": "شهید بهشتی" },
        "lines": [1, 3],
        "longitude": 51.42707272534462,
        "latitude": 35.730966425953845,
        "address": "تقاطع خیابان های شهید بهشتی و شهید مفتح",
        "colors": ["#E0001F", "#67C5F5"],
        "disabled": false,
        "wc": false,
        "coffeeShop": false,
        "groceryStore": false,
        "fastFood": false,
        "atm": false,
        "elevator": true,
        "bicycleParking": false,
        "waterCooler": false,
        "cleanFood": false,
        "blindPath": true,
        "fireSuppressionSystem": true,
        "fireExtinguisher": true,
        "metroPolice": true,
        "creditTicketSales": true,
        "waitingChair": true,
        "camera": true,
        "trashCan": true,
        "smoking": false,
        "petsAllowed": false,
        "freeWifi": true,
        "prayerRoom": true,
        "relations": ["Mosalla-ye Imam Khomeini", "Sohrevardi", "Mirza-ye Shirazi", "Shahid Mofattah"]
      }
    };
  }

  /**
   * Create mock data for development
   */
  static createMockData(count: number = 10): RawStationData {
    const mockData: RawStationData = {};
    const stationNames = [
      "Station A", "Station B", "Station C", "Station D", "Station E",
      "Station F", "Station G", "Station H", "Station I", "Station J"
    ];

    for (let i = 0; i < Math.min(count, stationNames.length); i++) {
      const name = stationNames[i];
      mockData[name] = {
        name,
        translations: { fa: `ایستگاه ${String.fromCharCode(65 + i)}` },
        lines: [Math.floor(Math.random() * 7) + 1],
        longitude: 51.4 + (Math.random() * 0.1 - 0.05),
        latitude: 35.7 + (Math.random() * 0.1 - 0.05),
        address: `Mock address for ${name}`,
        colors: ["#E0001F"],
        disabled: false,
        wc: Math.random() > 0.5,
        coffeeShop: Math.random() > 0.7,
        groceryStore: Math.random() > 0.8,
        fastFood: Math.random() > 0.6,
        atm: Math.random() > 0.4,
        elevator: Math.random() > 0.3,
        bicycleParking: Math.random() > 0.5,
        waterCooler: Math.random() > 0.6,
        cleanFood: Math.random() > 0.5,
        blindPath: true,
        fireSuppressionSystem: true,
        fireExtinguisher: true,
        metroPolice: Math.random() > 0.8,
        creditTicketSales: true,
        waitingChair: true,
        camera: true,
        trashCan: true,
        smoking: false,
        petsAllowed: false,
        freeWifi: Math.random() > 0.4,
        prayerRoom: Math.random() > 0.7,
        relations: []
      };
    }

    // Add some relations
    const stationKeys = Object.keys(mockData);
    stationKeys.forEach((key, index) => {
      if (index < stationKeys.length - 1) {
        mockData[key].relations.push(stationKeys[index + 1]);
      }
      if (index > 0) {
        mockData[key].relations.push(stationKeys[index - 1]);
      }
    });

    return mockData;
  }

  /**
   * Generate data quality report
   */
  static generateDataQualityReport(data: RawStationData): string {
    const totalStations = Object.keys(data).length;
    
    if (totalStations === 0) {
      return "No data available for quality report";
    }

    let report = `=== DATA QUALITY REPORT ===\n\n`;
    report += `Total Stations: ${totalStations}\n\n`;

    // Count stations by line
    const lineCounts: Record<number, number> = {};
    Object.values(data).forEach(station => {
      station.lines.forEach(line => {
        lineCounts[line] = (lineCounts[line] || 0) + 1;
      });
    });

    report += `Stations by Line:\n`;
    Object.entries(lineCounts).sort(([a], [b]) => parseInt(a) - parseInt(b)).forEach(([line, count]) => {
      report += `  Line ${line}: ${count} stations\n`;
    });
    report += `\n`;

    // Count amenities
    const amenityStats: Record<string, { total: number; percentage: number }> = {};
    const amenityFields = [
      'wc', 'coffeeShop', 'groceryStore', 'fastFood', 'atm', 'elevator',
      'bicycleParking', 'waterCooler', 'cleanFood', 'blindPath', 'freeWifi', 'prayerRoom'
    ];

    amenityFields.forEach(field => {
      const count = Object.values(data).filter(station => station[field as keyof typeof data[string]] === true).length;
      const percentage = (count / totalStations) * 100;
      amenityStats[field] = { total: count, percentage };
    });

    report += `Amenity Statistics:\n`;
    Object.entries(amenityStats).forEach(([field, stats]) => {
      report += `  ${field}: ${stats.total} (${stats.percentage.toFixed(1)}%)\n`;
    });
    report += `\n`;

    // Check for data issues
    const issues: string[] = [];
    
    // Check for null waterCooler
    const nullWaterCooler = Object.values(data).filter(station => station.waterCooler === null).length;
    if (nullWaterCooler > 0) {
      issues.push(`${nullWaterCooler} stations have null waterCooler field`);
    }

    // Check for disabled stations
    const disabledStations = Object.values(data).filter(station => station.disabled).length;
    if (disabledStations > 0) {
      issues.push(`${disabledStations} stations are disabled`);
    }

    // Check for stations with no relations
    const isolatedStations = Object.values(data).filter(station => station.relations.length === 0).length;
    if (isolatedStations > 0) {
      issues.push(`${isolatedStations} stations have no relations (isolated)`);
    }

    // Check for self-references
    const selfReferences = Object.entries(data).filter(([name, station]) => 
      station.relations.includes(name)
    ).length;
    if (selfReferences > 0) {
      issues.push(`${selfReferences} stations have self-references in relations`);
    }

    if (issues.length > 0) {
      report += `Data Issues:\n`;
      issues.forEach(issue => {
        report += `  ⚠️  ${issue}\n`;
      });
      report += `\n`;
    } else {
      report += `✅ No major data issues found\n\n`;
    }

    // Calculate data quality score
    let qualityScore = 100;
    qualityScore -= nullWaterCooler * 2;
    qualityScore -= isolatedStations * 5;
    qualityScore -= selfReferences * 3;
    qualityScore = Math.max(0, qualityScore);

    report += `Data Quality Score: ${qualityScore.toFixed(1)}/100\n`;
    
    if (qualityScore >= 90) {
      report += `Status: ✅ Excellent\n`;
    } else if (qualityScore >= 70) {
      report += `Status: ⚠️  Good (needs minor improvements)\n`;
    } else if (qualityScore >= 50) {
      report += `Status: ⚠️  Fair (needs improvements)\n`;
    } else {
      report += `Status: ❌ Poor (needs major improvements)\n`;
    }

    return report;
  }
}