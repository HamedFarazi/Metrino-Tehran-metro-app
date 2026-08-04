import { MetroDataService, DataLoader, ValidationService } from '../data';

/**
 * Metro Data Architecture Demo
 * Demonstrates the clean architecture for Tehran Metro application
 */
export async function runMetroDemo() {
  console.log('=== TEHRAN METRO DATA ARCHITECTURE DEMO ===\n');
  
  try {
    // Step 1: Load and validate raw data
    console.log('1. Loading and validating raw data...');
    const rawData = DataLoader.createSampleData();
    
    const validator = new ValidationService();
    const rawValidation = validator.validateRawData(rawData);
    
    console.log(`Raw data validation: ${rawValidation.isValid ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Errors: ${rawValidation.summary.errorCount}, Warnings: ${rawValidation.summary.warningCount}`);
    console.log(`Data Quality Score: ${rawValidation.summary.dataQualityScore}/100\n`);
    
    // Step 2: Create and initialize data service
    console.log('2. Initializing MetroDataService...');
    const metroService = new MetroDataService();
    const initResult = await metroService.initialize(rawData);
    
    if (!initResult.success) {
      console.error('Failed to initialize service:', initResult.error);
      return;
    }
    
    console.log(`Service initialized successfully!`);
    console.log(`Stats: ${initResult.stats?.stations} stations, ${initResult.stats?.lines} lines, ${initResult.stats?.connections} connections\n`);
    
    // Step 3: Demonstrate data querying
    console.log('3. Data Querying Examples:');
    
    // Get all stations
    const allStations = metroService.getAllStations();
    console.log(`- Total stations: ${allStations.length}`);
    
    // Get specific station
    const tajrish = metroService.getStationByName('Tajrish');
    if (tajrish) {
      console.log(`- Tajrish station: ${tajrish.name} (${tajrish.translations.fa})`);
      console.log(`  Coordinates: ${tajrish.coordinates.latitude}, ${tajrish.coordinates.longitude}`);
      console.log(`  Lines: ${tajrish.lineIds.join(', ')}`);
      console.log(`  Amenities: ${Object.entries(tajrish.amenities).filter(([_, v]) => v).map(([k]) => k).join(', ')}`);
    }
    
    // Get interchange stations
    const interchangeStations = metroService.getInterchangeStations();
    console.log(`- Interchange stations: ${interchangeStations.length} (e.g., ${interchangeStations[0]?.name})`);
    
    // Get stations with specific amenities
    const stationsWithWifi = metroService.getStationsWithAmenities({ freeWifi: true });
    console.log(`- Stations with free WiFi: ${stationsWithWifi.length}`);
    
    // Get connected stations
    if (tajrish) {
      const connected = metroService.getConnectedStations(tajrish.id);
      console.log(`- Stations connected to Tajrish: ${connected.map(s => s.name).join(', ')}`);
    }
    
    // Step 4: Demonstrate system statistics
    console.log('\n4. System Statistics:');
    const stats = metroService.getSystemStatistics();
    console.log(`- Total lines: ${stats.totalLines}`);
    console.log(`- Total connections: ${stats.totalConnections}`);
    console.log(`- Interchange stations: ${stats.interchangeStations}`);
    console.log(`- Terminal stations: ${stats.terminalStations}`);
    console.log(`- Average amenities per station: ${stats.averageAmenitiesPerStation}`);
    console.log(`- Graph density: ${stats.connectivity.graphDensity}`);
    
    // Step 5: Demonstrate search functionality
    console.log('\n5. Search Functionality:');
    const searchResults = metroService.searchStations('shahid');
    console.log(`- Search for "shahid": ${searchResults.length} results`);
    searchResults.forEach((station, index) => {
      console.log(`  ${index + 1}. ${station.name} (${station.translations.fa})`);
    });
    
    // Step 6: Export data
    console.log('\n6. Data Export:');
    const exportedData = metroService.exportData();
    console.log(`- Exported ${exportedData.metadata.stationCount} stations, ${exportedData.metadata.lineCount} lines, ${exportedData.metadata.connectionCount} connections`);
    console.log(`- Export timestamp: ${exportedData.metadata.exportedAt.toISOString()}`);
    
    // Step 7: Data quality report
    console.log('\n7. Data Quality Report:');
    const qualityReport = DataLoader.generateDataQualityReport(rawData);
    console.log(qualityReport);
    
    console.log('\n=== DEMO COMPLETED SUCCESSFULLY ===');
    console.log('\nArchitecture Features Demonstrated:');
    console.log('1. ✅ Clean TypeScript domain models');
    console.log('2. ✅ Data parsing and normalization');
    console.log('3. ✅ Comprehensive validation');
    console.log('4. ✅ Service layer with SOLID principles');
    console.log('5. ✅ Feature-based architecture');
    console.log('6. ✅ Strong typing throughout');
    console.log('7. ✅ Scalable query system');
    console.log('8. ✅ Data quality monitoring');
    
  } catch (error) {
    console.error('Demo failed:', error);
  }
}

/**
 * Run advanced demonstrations
 */
export async function runAdvancedDemo() {
  console.log('\n=== ADVANCED FEATURES DEMO ===\n');
  
  try {
    // Create service with mock data
    const mockData = DataLoader.createMockData(20);
    const metroService = new MetroDataService();
    await metroService.initialize(mockData);
    
    console.log('1. Location-based Queries:');
    const tehranCenter = { latitude: 35.6892, longitude: 51.3890 };
    const nearbyStations = metroService.getStationsNearLocation(
      tehranCenter.latitude,
      tehranCenter.longitude,
      10 // 10km radius
    );
    console.log(`- Stations within 10km of Tehran center: ${nearbyStations.length}`);
    
    console.log('\n2. Line-specific Operations:');
    const line1 = metroService.getLineById(1);
    if (line1) {
      const line1Stations = metroService.getStationsByLine(1);
      console.log(`- Line 1: ${line1Stations.length} stations`);
      console.log(`  First station: ${line1Stations[0]?.name}`);
      console.log(`  Last station: ${line1Stations[line1Stations.length - 1]?.name}`);
    }
    
    console.log('\n3. Connection Analysis:');
    const allConnections = metroService.getAllConnections();
    console.log(`- Total connections: ${allConnections.length}`);
    
    if (allConnections.length > 0) {
      const sampleConnection = allConnections[0];
      console.log(`- Sample connection: ${sampleConnection.fromStationId} ↔ ${sampleConnection.toStationId}`);
      console.log(`  Distance: ${sampleConnection.travelMetrics.distance.toFixed(2)} km`);
      console.log(`  Travel time: ${sampleConnection.travelMetrics.travelTime.toFixed(1)} min`);
      console.log(`  Lines: ${sampleConnection.lineIds.join(', ')}`);
    }
    
    console.log('\n4. Amenity-based Filtering:');
    const accessibleStations = metroService.getStationsWithAmenities({
      elevator: true,
      blindPath: true,
    });
    console.log(`- Fully accessible stations (elevator + blind path): ${accessibleStations.length}`);
    
    const foodStations = metroService.getStationsWithAmenities({
      fastFood: true,
      cleanFood: true,
      coffeeShop: true,
    });
    console.log(`- Stations with food options: ${foodStations.length}`);
    
    console.log('\n=== ADVANCED DEMO COMPLETED ===');
    
  } catch (error) {
    console.error('Advanced demo failed:', error);
  }
}

// Run demos if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMetroDemo().then(() => runAdvancedDemo());
}