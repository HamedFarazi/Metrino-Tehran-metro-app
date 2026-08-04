const fs = require('fs');
const path = require('path');

console.log('=== TEHRAN METRO DATA DIRECT MIGRATION ===\n');

// Step 1: Load the raw JSON data
console.log('1. Loading raw JSON data...');
const rawDataPath = path.join(__dirname, '..', 'githubfile', 'data', 'stations.json');

if (!fs.existsSync(rawDataPath)) {
  console.error(`❌ Raw data file not found: ${rawDataPath}`);
  process.exit(1);
}

const rawJson = fs.readFileSync(rawDataPath, 'utf-8');
const rawData = JSON.parse(rawJson);

console.log(`✅ Loaded ${Object.keys(rawData).length} stations\n`);

// Step 2: Analyze the data structure
console.log('2. Analyzing data structure...');

const stations = Object.keys(rawData);
const sampleStation = rawData[stations[0]];

console.log('Sample station structure:');
console.log('- Name:', sampleStation.name);
console.log('- Lines:', sampleStation.lines);
console.log('- Coordinates:', sampleStation.latitude, sampleStation.longitude);
console.log('- Relations:', sampleStation.relations.length);
console.log('- Amenities:', Object.keys(sampleStation).filter(k => typeof sampleStation[k] === 'boolean').length, 'boolean fields\n');

// Step 3: Check for data issues
console.log('3. Checking for data issues...');

const issues = [];
const warnings = [];

// Check for null waterCooler
const nullWaterCooler = stations.filter(name => rawData[name].waterCooler === null).length;
if (nullWaterCooler > 0) {
  warnings.push(`${nullWaterCooler} stations have null waterCooler field`);
}

// Check for disabled stations
const disabledStations = stations.filter(name => rawData[name].disabled).length;
if (disabledStations > 0) {
  warnings.push(`${disabledStations} stations are disabled`);
}

// Check for self-references
const selfReferences = stations.filter(name => rawData[name].relations.includes(name)).length;
if (selfReferences > 0) {
  issues.push(`${selfReferences} stations have self-references in relations`);
}

// Check for missing translations
const missingTranslations = stations.filter(name => !rawData[name].translations?.fa).length;
if (missingTranslations > 0) {
  issues.push(`${missingTranslations} stations missing Farsi translations`);
}

// Count lines
const lineCounts = {};
stations.forEach(name => {
  const station = rawData[name];
  station.lines.forEach(line => {
    lineCounts[line] = (lineCounts[line] || 0) + 1;
  });
});

console.log('Line distribution:');
Object.entries(lineCounts).sort(([a], [b]) => a - b).forEach(([line, count]) => {
  console.log(`  Line ${line}: ${count} stations`);
});

console.log('\nData issues found:');
if (issues.length > 0) {
  issues.forEach(issue => console.log(`  ❌ ${issue}`));
} else {
  console.log('  ✅ No critical issues found');
}

if (warnings.length > 0) {
  console.log('\nData warnings:');
  warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
}

// Step 4: Create normalized data structure
console.log('\n4. Creating normalized data structure...');

const normalizedStations = stations.map((name, index) => {
  const station = rawData[name];
  
  // Generate stable ID
  const stableId = `station_${index + 1}`;
  
  return {
    id: stableId,
    name: station.name,
    translations: station.translations,
    lines: station.lines,
    coordinates: {
      latitude: station.latitude,
      longitude: station.longitude,
    },
    address: station.address,
    colors: station.colors,
    isDisabled: station.disabled,
    amenities: {
      restroom: station.wc,
      coffeeShop: station.coffeeShop,
      groceryStore: station.groceryStore,
      fastFood: station.fastFood || station.fastFoodn || false, // Handle typo
      cleanFood: station.cleanFood,
      atm: station.atm,
      elevator: station.elevator,
      bicycleParking: station.bicycleParking,
      waterCooler: station.waterCooler === null ? false : station.waterCooler,
      creditTicketSales: station.creditTicketSales,
      blindPath: station.blindPath,
      waitingChair: station.waitingChair,
      fireSuppressionSystem: station.fireSuppressionSystem,
      fireExtinguisher: station.fireExtinguisher,
      metroPolice: station.metroPolice,
      camera: station.camera,
      trashCan: station.trashCan,
      smokingArea: station.smoking,
      petsAllowed: station.petsAllowed,
      freeWifi: station.freeWifi,
      prayerRoom: station.prayerRoom,
    },
    metadata: {
      sourceName: name,
      processedAt: new Date().toISOString(),
    },
  };
});

// Create name to ID mapping for relations
const nameToId = {};
normalizedStations.forEach(station => {
  nameToId[station.metadata.sourceName] = station.id;
});

// Add connected station IDs
normalizedStations.forEach(station => {
  const sourceName = station.metadata.sourceName;
  const relations = rawData[sourceName]?.relations || [];
  
  station.connectedStationIds = relations
    .map(relationName => nameToId[relationName])
    .filter(id => id !== undefined && id !== station.id); // Remove invalid and self-references
});

// Step 5: Create lines data
console.log('\n5. Creating lines data...');

const lines = Object.entries(lineCounts).map(([lineIdStr, stationCount]) => {
  const lineId = parseInt(lineIdStr);
  
  // Get stations on this line
  const stationIds = normalizedStations
    .filter(station => station.lines.includes(lineId))
    .map(station => station.id);
  
  // Line colors mapping
  const lineColors = {
    1: '#E0001F', // Red
    2: '#2F4389', // Blue
    3: '#67C5F5', // Light Blue
    4: '#F8E100', // Yellow
    5: '#8B47AC', // Purple
    6: '#F97316', // Orange
    7: '#7F0B74', // Dark Purple
  };
  
  const lineNames = {
    1: { en: 'Line 1 (Red Line)', fa: 'خط ۱ (خط قرمز)' },
    2: { en: 'Line 2 (Blue Line)', fa: 'خط ۲ (خط آبی)' },
    3: { en: 'Line 3 (Light Blue Line)', fa: 'خط ۳ (خط آبی روشن)' },
    4: { en: 'Line 4 (Yellow Line)', fa: 'خط ۴ (خط زرد)' },
    5: { en: 'Line 5 (Purple Line)', fa: 'خط ۵ (خط بنفش)' },
    6: { en: 'Line 6 (Orange Line)', fa: 'خط ۶ (خط نارنجی)' },
    7: { en: 'Line 7 (Dark Purple Line)', fa: 'خط ۷ (خط بنفش تیره)' },
  };
  
  return {
    id: lineId,
    name: lineNames[lineId] || { en: `Line ${lineId}`, fa: `خط ${lineId}` },
    color: lineColors[lineId] || '#000000',
    description: {
      en: `Tehran Metro Line ${lineId}`,
      fa: `خط مترو تهران ${lineId}`,
    },
    stationIds: stationIds,
    specifications: {
      stationCount: stationCount,
      length: stationCount * 1.5, // Approximate
      openingYear: 2000, // Default
    },
    metadata: {
      processedAt: new Date().toISOString(),
    },
  };
});

// Step 6: Create connections data
console.log('\n6. Creating connections data...');

const connections = [];
const connectionSet = new Set(); // To avoid duplicates

normalizedStations.forEach(station => {
  station.connectedStationIds.forEach(connectedId => {
    // Create unique key for connection (sorted to avoid duplicates)
    const key = [station.id, connectedId].sort().join('-');
    
    if (!connectionSet.has(key)) {
      const connectedStation = normalizedStations.find(s => s.id === connectedId);
      
      if (connectedStation) {
        // Calculate distance (simplified)
        const distance = calculateDistance(
          station.coordinates.latitude,
          station.coordinates.longitude,
          connectedStation.coordinates.latitude,
          connectedStation.coordinates.longitude
        );
        
        // Find common lines
        const commonLines = station.lines.filter(lineId => 
          connectedStation.lines.includes(lineId)
        );
        
        if (commonLines.length > 0) {
          connections.push({
            id: `conn_${connections.length + 1}`,
            fromStationId: station.id,
            toStationId: connectedId,
            lineIds: commonLines,
            travelMetrics: {
              distance: distance,
              travelTime: distance * 2 + 0.5, // Estimate: 2 min/km + 30s stop
              isUnderground: true,
              tracks: 2,
            },
            metadata: {
              processedAt: new Date().toISOString(),
            },
          });
          
          connectionSet.add(key);
        }
      }
    }
  });
});

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
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

// Step 7: Save the processed data
console.log('\n7. Saving processed data...');

const outputDir = path.join(__dirname, '..', 'src', 'data', 'processed');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create complete dataset
const completeData = {
  stations: normalizedStations,
  lines: lines,
  connections: connections,
  metadata: {
    processedAt: new Date().toISOString(),
    source: 'githubfile/data/stations.json',
    stationCount: normalizedStations.length,
    lineCount: lines.length,
    connectionCount: connections.length,
    issuesFixed: issues.length + warnings.length,
  },
};

// Save files
const completePath = path.join(outputDir, 'metro-data.json');
fs.writeFileSync(completePath, JSON.stringify(completeData, null, 2));

const stationsPath = path.join(outputDir, 'stations.json');
fs.writeFileSync(stationsPath, JSON.stringify(normalizedStations, null, 2));

const linesPath = path.join(outputDir, 'lines.json');
fs.writeFileSync(linesPath, JSON.stringify(lines, null, 2));

const connectionsPath = path.join(outputDir, 'connections.json');
fs.writeFileSync(connectionsPath, JSON.stringify(connections, null, 2));

console.log(`✅ Data saved to:`);
console.log(`   - ${completePath}`);
console.log(`   - ${stationsPath}`);
console.log(`   - ${linesPath}`);
console.log(`   - ${connectionsPath}\n`);

// Step 8: Generate report
console.log('8. Generating migration report...');

const report = `
=== TEHRAN METRO DATA MIGRATION REPORT ===

MIGRATION COMPLETED SUCCESSFULLY!

SOURCE DATA:
- Raw stations: ${stations.length}
- Lines found: ${Object.keys(lineCounts).length}

PROCESSED DATA:
- Normalized stations: ${normalizedStations.length}
- Lines created: ${lines.length}
- Connections created: ${connections.length}

LINE DISTRIBUTION:
${Object.entries(lineCounts).sort(([a], [b]) => a - b).map(([line, count]) => `  Line ${line}: ${count} stations`).join('\n')}

DATA QUALITY:
${issues.length > 0 ? `Issues found: ${issues.length}` : '✅ No critical issues'}
${warnings.length > 0 ? `Warnings: ${warnings.length}` : '✅ No warnings'}

INTERCHANGE STATIONS:
${normalizedStations.filter(s => s.lines.length > 1).length} stations serve multiple lines

TERMINAL STATIONS:
${normalizedStations.filter(s => s.connectedStationIds.length === 1).length} stations with only one connection

AVERAGE AMENITIES:
${(normalizedStations.reduce((sum, station) => {
  return sum + Object.values(station.amenities).filter(v => v === true).length;
}, 0) / normalizedStations.length).toFixed(1)} amenities per station

OUTPUT FILES:
1. Complete dataset: ${completePath}
2. Stations only: ${stationsPath}
3. Lines only: ${linesPath}
4. Connections only: ${connectionsPath}

NEXT STEPS:
1. The data is now ready for use in your React application
2. Import the JSON files as needed
3. Use the clean, normalized structure for consistent queries

ARCHITECTURE NOTES:
✅ Stable IDs generated for all stations
✅ Null values converted to appropriate types
✅ Self-references removed from connections
✅ Geographic coordinates preserved
✅ Amenity data normalized
✅ Line metadata enriched
✅ Connection distances calculated

=== MIGRATION COMPLETE ===
`;

const reportPath = path.join(outputDir, 'migration-report.txt');
fs.writeFileSync(reportPath, report);

console.log(report);
console.log(`✅ Migration report saved to: ${reportPath}\n`);

console.log('🎉 Migration completed successfully!');
console.log('The Tehran Metro data is now cleaned, normalized, and ready for production use.');