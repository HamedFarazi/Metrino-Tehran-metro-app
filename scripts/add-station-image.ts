#!/usr/bin/env tsx
/**
 * Add Station Image URL Helper
 * 
 * Helps add Wikimedia Commons image URLs to pics_clean.json
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const PROJECT_ROOT = join(__dirname, '..');
const PICS_JSON_PATH = join(PROJECT_ROOT, 'githubfile/data/pics_clean.json');
const STATIONS_JSON_PATH = join(PROJECT_ROOT, 'src/data/processed/stations.json');

interface StationPicData {
  name: string;
  translations: {
    fa: string;
    pic?: string[];
  };
}

interface StationData {
  id: string;
  name: string;
  translations: {
    fa: string;
  };
}

/**
 * Read user input
 */
function question(query: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(query, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Find station by name or Farsi name
 */
function findStation(
  stations: StationData[],
  searchTerm: string
): StationData | undefined {
  const term = searchTerm.toLowerCase();
  
  return stations.find(station => 
    station.name.toLowerCase().includes(term) ||
    station.translations.fa.includes(term)
  );
}

/**
 * Validate Wikimedia Commons URL
 */
function validateWikimediaUrl(url: string): boolean {
  return url.includes('commons.wikimedia.org') && url.includes('/File:');
}

/**
 * Main function
 */
async function addStationImage(): Promise<void> {
  console.log('🖼️  Add Station Image URL to pics_clean.json\n');
  
  // Load data
  const picsData: Record<string, StationPicData> = JSON.parse(
    await readFile(PICS_JSON_PATH, 'utf-8')
  );
  
  const stationsData: StationData[] = JSON.parse(
    await readFile(STATIONS_JSON_PATH, 'utf-8')
  );
  
  console.log(`📊 Total stations: ${stationsData.length}`);
  console.log(`📊 Stations with images: ${Object.values(picsData).filter(s => s.translations?.pic?.filter(url => url).length > 0).length}\n`);
  
  // Search for station
  const searchTerm = await question('🔍 Search for station (English or Farsi): ');
  
  const foundStations = stationsData.filter(station => 
    station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.translations.fa.includes(searchTerm)
  );
  
  if (foundStations.length === 0) {
    console.log('❌ No stations found');
    return;
  }
  
  console.log('\n📋 Found stations:');
  foundStations.forEach((station, index) => {
    console.log(`${index + 1}. ${station.translations.fa} (${station.name}) - ID: ${station.id}`);
    
    // Check if already has images
    const existingPics = picsData[station.name]?.translations?.pic?.filter(url => url) || [];
    if (existingPics.length > 0) {
      console.log(`   📸 Has ${existingPics.length} image(s)`);
      existingPics.forEach((url, i) => {
        console.log(`      ${i + 1}. ${url.substring(0, 80)}...`);
      });
    }
  });
  
  const stationIndex = parseInt(await question('\nSelect station number: ')) - 1;
  
  if (stationIndex < 0 || stationIndex >= foundStations.length) {
    console.log('❌ Invalid selection');
    return;
  }
  
  const selectedStation = foundStations[stationIndex];
  console.log(`\n✅ Selected: ${selectedStation.translations.fa} (${selectedStation.name})`);
  
  // Get image URL
  const imageUrl = await question('Enter Wikimedia Commons image URL: ');
  
  if (!validateWikimediaUrl(imageUrl)) {
    console.log('⚠️  Warning: URL does not appear to be a valid Wikimedia Commons file URL');
    const confirm = await question('Continue anyway? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('❌ Cancelled');
      return;
    }
  }
  
  // Get image description
  const description = await question('Image description (optional): ');
  
  // Update pics data
  if (!picsData[selectedStation.name]) {
    picsData[selectedStation.name] = {
      name: selectedStation.name,
      translations: {
        fa: selectedStation.translations.fa,
        pic: [imageUrl]
      }
    };
  } else {
    if (!picsData[selectedStation.name].translations) {
      picsData[selectedStation.name].translations = { fa: selectedStation.translations.fa };
    }
    
    if (!picsData[selectedStation.name].translations.pic) {
      picsData[selectedStation.name].translations.pic = [imageUrl];
    } else {
      picsData[selectedStation.name].translations.pic.push(imageUrl);
    }
  }
  
  // Save updated data
  await writeFile(PICS_JSON_PATH, JSON.stringify(picsData, null, '\t'), 'utf-8');
  
  console.log('\n✅ Successfully added image!');
  console.log(`📸 Station: ${selectedStation.translations.fa}`);
  console.log(`🔗 URL: ${imageUrl}`);
  if (description) console.log(`📝 Description: ${description}`);
  
  console.log('\n🚀 Next steps:');
  console.log('   1. Run `npm run images:local` to download the image');
  console.log('   2. Run `npm run build` to rebuild the project');
  console.log('   3. Test the image in the UI');
  
  // Show how to find more images
  console.log('\n💡 Tip: Find more Tehran Metro images at:');
  console.log('   https://commons.wikimedia.org/wiki/Category:Tehran_Metro_stations');
  console.log('   Search for: "[Station Name] Metro Station"');
}

// Run the script
addStationImage().catch(console.error);