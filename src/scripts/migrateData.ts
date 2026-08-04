import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { MetroDataService } from '../services/MetroDataService';
import { ValidationService } from '../services/ValidationService';
import { DataLoader } from '../utils/DataLoader';
import { RawStationData } from '../data/RawStationData';

/**
 * Data Migration Script
 * Loads real JSON data from githubfile, processes it, and saves clean data
 */
async function migrateData() {
  console.log('=== TEHRAN METRO DATA MIGRATION ===\n');
  
  try {
    // Step 1: Load raw JSON data
    console.log('1. Loading raw JSON data from githubfile/data/stations.json...');
    
    const rawDataPath = join(process.cwd(), 'githubfile', 'data', 'stations.json');
    const rawJson = readFileSync(rawDataPath, 'utf-8');
    const rawData: RawStationData = JSON.parse(rawJson);
    
    console.log(`✅ Loaded ${Object.keys(rawData).length} stations from JSON\n`);
    
    // Step 2: Validate raw data
    console.log('2. Validating raw data...');
    const validator = new ValidationService();
    const rawValidation = validator.validateRawData(rawData);
    
    console.log(validator.generateReport(rawValidation));
    
    if (!rawValidation.isValid && rawValidation.summary.errorCount > 0) {
      console.log('❌ Raw data validation failed. Fix errors before proceeding.');
      return;
    }
    
    // Step 3: Transform and fix common issues
    console.log('3. Transforming and fixing data issues...');
    const transformedData = DataLoader.transformData(rawData);
    
    // Step 4: Create and initialize data service
    console.log('4. Initializing MetroDataService...');
    const metroService = new MetroDataService();
    const initResult = await metroService.initialize(transformedData);
    
    if (!initResult.success) {
      console.error('❌ Failed to initialize service:', initResult.error);
      return;
    }
    
    console.log(`✅ Service initialized with ${initResult.stats?.stations} stations, ${initResult.stats?.lines} lines, ${initResult.stats?.connections} connections\n`);
    
    // Step 5: Export clean data
    console.log('5. Exporting clean data...');
    const exportedData = metroService.exportData();
    
    // Create output directory if it doesn't exist
    const outputDir = join(process.cwd(), 'src', 'data', 'processed');
    try {
      require('fs').mkdirSync(outputDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }
    
    // Save clean data
    const cleanDataPath = join(outputDir, 'metro-data.json');
    writeFileSync(
      cleanDataPath,
      JSON.stringify(exportedData, null, 2),
      'utf-8'
    );
    
    // Save stations only (for smaller files)
    const stationsDataPath = join(outputDir, 'stations-processed.json');
    writeFileSync(
      stationsDataPath,
      JSON.stringify(exportedData.stations, null, 2),
      'utf-8'
    );
    
    // Save lines only
    const linesDataPath = join(outputDir, 'lines-processed.json');
    writeFileSync(
      linesDataPath,
      JSON.stringify(exportedData.lines, null, 2),
      'utf-8'
    );
    
    // Save connections only
    const connectionsDataPath = join(outputDir, 'connections-processed.json');
    writeFileSync(
      connectionsDataPath,
      JSON.stringify(exportedData.connections, null, 2),
      'utf-8'
    );
    
    console.log(`✅ Clean data exported to:`);
    console.log(`   - ${cleanDataPath}`);
    console.log(`   - ${stationsDataPath}`);
    console.log(`   - ${linesDataPath}`);
    console.log(`   - ${connectionsDataPath}\n`);
    
    // Step 6: Generate migration report
    console.log('6. Generating migration report...');
    
    const stats = metroService.getSystemStatistics();
    const report = `
=== TEHRAN METRO DATA MIGRATION REPORT ===

Migration completed successfully!

DATA SUMMARY:
- Total Stations: ${stats.totalStations}
- Total Lines: ${stats.totalLines}
- Total Connections: ${stats.totalConnections}
- Interchange Stations: ${stats.interchangeStations}
- Terminal Stations: ${stats.terminalStations}

LINE STATISTICS:
${stats.lineStatistics.map(line => `  Line ${line.lineId}: ${line.stationCount} stations, ${line.length.toFixed(1)} km`).join('\n')}

DATA QUALITY:
- Average Amenities per Station: ${stats.averageAmenitiesPerStation}
- Graph Density: ${stats.connectivity.graphDensity}
- Average Connections per Station: ${stats.connectivity.averageConnectionsPerStation}

VALIDATION SUMMARY:
- Raw Data Quality Score: ${rawValidation.summary.dataQualityScore}/100
- Errors Fixed: ${rawValidation.summary.errorCount}
- Warnings Addressed: ${rawValidation.summary.warningCount}

OUTPUT FILES:
1. Complete data: ${cleanDataPath}
2. Stations only: ${stationsDataPath}
3. Lines only: ${linesDataPath}
4. Connections only: ${connectionsDataPath}

ARCHITECTURE FEATURES:
✅ Clean TypeScript domain models
✅ Data normalization and validation
✅ Stable ID generation
✅ Graph structure preservation
✅ Amenity data preservation
✅ Multi-language support

NEXT STEPS:
1. Import the processed data in your application:
   \`\`\`typescript
   import metroData from './data/processed/metro-data.json';
   \`\`\`

2. Use the MetroDataService for queries:
   \`\`\`typescript
   const service = new MetroDataService();
   await service.initialize(metroData);
   \`\`\`

3. Explore the demo for usage examples:
   \`\`\`bash
   npm run demo
   \`\`\`

=== MIGRATION COMPLETE ===
    `;
    
    const reportPath = join(outputDir, 'migration-report.txt');
    writeFileSync(reportPath, report, 'utf-8');
    
    console.log(report);
    console.log(`✅ Migration report saved to: ${reportPath}\n`);
    
    // Step 7: Generate sample code for using the data
    console.log('7. Generating sample usage code...');
    
    const sampleCode = `
// Sample code for using the migrated Tehran Metro data
import { MetroDataService } from './services/MetroDataService';
import metroData from './data/processed/metro-data.json';

// Initialize the service
const metroService = new MetroDataService();

async function initializeApp() {
  const result = await metroService.initialize(metroData);
  
  if (result.success) {
    console.log(\`✅ Loaded \${result.stats?.stations} stations\`);
    
    // Example queries
    const allStations = metroService.getAllStations();
    const tajrish = metroService.getStationByName('Tajrish');
    const interchanges = metroService.getInterchangeStations();
    
    console.log(\`Total stations: \${allStations.length}\`);
    console.log(\`Tajrish station: \${tajrish?.name} (\${tajrish?.translations.fa})\`);
    console.log(\`Interchange stations: \${interchanges.length}\`);
    
    // Get system statistics
    const stats = metroService.getSystemStatistics();
    console.log(\`\\nSystem Statistics:\`);
    console.log(\`- Total lines: \${stats.totalLines}\`);
    console.log(\`- Average amenities: \${stats.averageAmenitiesPerStation}\`);
    console.log(\`- Graph density: \${stats.connectivity.graphDensity}\`);
  } else {
    console.error('Failed to initialize:', result.error);
  }
}

// Run the initialization
initializeApp();
    `;
    
    const sampleCodePath = join(outputDir, 'sample-usage.ts');
    writeFileSync(sampleCodePath, sampleCode, 'utf-8');
    
    console.log(`✅ Sample usage code saved to: ${sampleCodePath}\n`);
    
    console.log('🎉 Migration completed successfully!');
    console.log('The data is now ready for use in your Tehran Metro application.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateData().catch(console.error);
}

export { migrateData };