#!/usr/bin/env tsx
/**
 * Station Name Mapper
 * 
 * Generates mapping between station IDs and Wikimedia Commons category names.
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const STATIONS_JSON_PATH = join(PROJECT_ROOT, 'src/data/processed/stations.json');

interface Station {
  id: string;
  name: string;
  translations: {
    fa: string;
  };
}

interface StationMapping {
  stationId: string;
  englishName: string;
  farsiName: string;
  possibleCategoryNames: string[];
  notes: string;
}

/**
 * Convert station name to Wikimedia Commons-friendly format
 */
function formatForWikimedia(name: string): string {
  // Remove special characters and normalize
  return name
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate possible category names for a station
 */
function generateCategoryNames(englishName: string, farsiName: string): string[] {
  const names: string[] = [];
  
  // English variations
  const formattedEnglish = formatForWikimedia(englishName);
  names.push(`${formattedEnglish} Metro Station`);
  names.push(`${formattedEnglish} station (Tehran Metro)`);
  names.push(`Tehran Metro ${formattedEnglish} station`);
  
  // Check for common naming variations
  if (englishName.includes('Shahid')) {
    const withoutShahid = englishName.replace('Shahid', '').trim();
    if (withoutShahid) {
      names.push(`${withoutShahid} Metro Station`);
    }
  }
  
  // Farsi variations
  if (farsiName) {
    // Note: Wikimedia Commons categories are typically in English
    // But we include Farsi for reference
    names.push(`${farsiName} metro station (Farsi)`);
  }
  
  return [...new Set(names)];
}

/**
 * Load stations and generate mappings
 */
async function generateStationMappings(): Promise<void> {
  console.log('🗺️  Generating station name mappings for Wikimedia Commons\n');
  
  // Load station data
  const stationsData: Station[] = JSON.parse(await readFile(STATIONS_JSON_PATH, 'utf-8'));
  
  const mappings: StationMapping[] = [];
  
  console.log(`Found ${stationsData.length} stations\n`);
  
  // Generate mapping for each station
  for (const station of stationsData) {
    const englishName = station.name;
    const farsiName = station.translations?.fa || '';
    
    const possibleCategories = generateCategoryNames(englishName, farsiName);
    
    const mapping: StationMapping = {
      stationId: station.id,
      englishName,
      farsiName,
      possibleCategoryNames: possibleCategories,
      notes: ''
    };
    
    // Add notes for special cases
    if (englishName.includes('Shahid')) {
      mapping.notes = 'Includes "Shahid" (Martyr) prefix, may need alternative search';
    }
    
    if (!farsiName) {
      mapping.notes = 'Missing Farsi name';
    }
    
    mappings.push(mapping);
  }
  
  // Display summary
  console.log('📋 Station Name Mappings:\n');
  
  mappings.slice(0, 10).forEach((mapping, index) => {
    console.log(`${index + 1}. ${mapping.farsiName} (${mapping.englishName})`);
    console.log(`   ID: ${mapping.stationId}`);
    console.log(`   Possible Wikimedia Categories:`);
    mapping.possibleCategoryNames.forEach(name => {
      console.log(`     - ${name}`);
    });
    if (mapping.notes) {
      console.log(`   Note: ${mapping.notes}`);
    }
    console.log();
  });
  
  if (mappings.length > 10) {
    console.log(`... and ${mappings.length - 10} more stations\n`);
  }
  
  // Generate statistics
  const stationsWithFarsi = mappings.filter(m => m.farsiName).length;
  const stationsWithShahid = mappings.filter(m => m.englishName.includes('Shahid')).length;
  
  console.log('📊 Statistics:');
  console.log(`   Total stations: ${mappings.length}`);
  console.log(`   Stations with Farsi names: ${stationsWithFarsi}`);
  console.log(`   Stations with "Shahid" prefix: ${stationsWithShahid}`);
  console.log(`   Average categories per station: ${(mappings.reduce((sum, m) => sum + m.possibleCategoryNames.length, 0) / mappings.length).toFixed(1)}`);
  
  // Save mappings to file
  const outputPath = join(PROJECT_ROOT, 'scripts/station-wikimedia-mappings.json');
  await Bun.write(outputPath, JSON.stringify(mappings, null, 2));
  
  console.log(`\n💾 Mappings saved to: ${outputPath}`);
  
  // Generate search suggestions
  console.log('\n🔍 Search Strategy:');
  console.log('   1. Search for each possible category name');
  console.log('   2. Try English variations first');
  console.log('   3. For "Shahid" stations, also try without the prefix');
  console.log('   4. Check parent category for station-specific subcategories');
  console.log('   5. Use MediaWiki API with rate limiting');
}

// Run the script
generateStationMappings().catch(console.error);