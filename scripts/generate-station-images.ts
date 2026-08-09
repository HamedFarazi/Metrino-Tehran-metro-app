#!/usr/bin/env tsx
/**
 * Generate Station Images from pics_clean.json
 * 
 * Creates station-images.ts file directly from the available image URLs
 * without downloading images (for development/testing)
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const PROJECT_ROOT = join(__dirname, '..');
const PICS_JSON_PATH = join(PROJECT_ROOT, 'githubfile/data/pics_clean.json');
const STATIONS_JSON_PATH = join(PROJECT_ROOT, 'src/data/processed/stations.json');
const IMAGES_TS_PATH = join(PROJECT_ROOT, 'src/data/station-images.ts');

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
 * Extract file name from Wikimedia URL
 */
function extractFileName(url: string): string | null {
  if (!url || url === '') return null;
  
  try {
    // Match File:Something.jpg pattern
    const match = url.match(/File:([^#?]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Get direct image URL from Wikimedia page URL
 */
function getDirectImageUrl(fileName: string): string {
  // For development, we'll use a placeholder
  // In production, this would construct the actual thumbnail URL
  return `/stations/${fileName.replace(/\.\w+$/, '.webp')}`;
}

/**
 * Generate station images data
 */
async function generateStationImages(): Promise<void> {
  console.log('🏙️  Generating Station Images from pics_clean.json\n');
  
  // Load data
  const picsData: Record<string, StationPicData> = JSON.parse(
    await readFile(PICS_JSON_PATH, 'utf-8')
  );
  
  const stationsData: StationData[] = JSON.parse(
    await readFile(STATIONS_JSON_PATH, 'utf-8')
  );
  
  console.log(`📊 Found ${Object.keys(picsData).length} stations in pics data`);
  console.log(`📊 Found ${stationsData.length} stations in processed data\n`);
  
  // Create mapping from station name to station ID
  const nameToIdMap = new Map<string, string>();
  const idToNameMap = new Map<string, string>();
  
  for (const station of stationsData) {
    nameToIdMap.set(station.name.toLowerCase(), station.id);
    idToNameMap.set(station.id, station.name);
  }
  
  // Count statistics
  let stationsWithImages = 0;
  let totalImages = 0;
  
  // Generate station images data
  const stationImages: Record<string, any[]> = {};
  
  // First, add stations that have images in pics_clean.json
  for (const [stationName, picData] of Object.entries(picsData)) {
    const stationId = nameToIdMap.get(stationName.toLowerCase());
    
    if (!stationId) {
      console.log(`⚠️  No matching station ID found for: ${stationName}`);
      continue;
    }
    
    const stationNameFa = picData.translations?.fa || stationName;
    const imageUrls = picData.translations?.pic || [];
    const validImageUrls = imageUrls.filter(url => url && url !== '');
    
    if (validImageUrls.length > 0) {
      stationsWithImages++;
      totalImages += validImageUrls.length;
      
      stationImages[stationId] = validImageUrls.map((url, index) => {
        const fileName = extractFileName(url) || `unknown-${Date.now()}.jpg`;
        const baseName = fileName.replace(/\.[^.]+$/, '');
        
        return {
          stationId,
          src: getDirectImageUrl(fileName),
          alt: `تصویر ایستگاه مترو ${stationNameFa}`,
          source: 'Wikimedia Commons',
          isPrimary: index === 0,
          metadata: {
            sourceUrl: url.replace(/#\/media\/File:.+$/, ''),
            author: 'Kasir', // Default author (from Tajrish example)
            license: 'CC BY-SA 4.0',
            licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
            attribution: 'Attribution required',
            description: `تصویر ایستگاه مترو ${stationNameFa}`,
            width: 1280,
            height: 720,
            size: 500000,
            mimeType: 'image/jpeg',
            timestamp: '2024-01-01T00:00:00Z'
          }
        };
      });
      
      console.log(`✅ ${stationNameFa}: ${validImageUrls.length} image(s)`);
    }
  }
  
  // Add some example stations for testing
  const exampleStations = ['station_1', 'station_2', 'station_3', 'station_4'];
  
  for (const stationId of exampleStations) {
    if (!stationImages[stationId]) {
      const stationName = idToNameMap.get(stationId) || stationId;
      
      stationImages[stationId] = [{
        stationId,
        src: `/stations/${stationId.replace('station_', '')}.webp`,
        alt: `تصویر ایستگاه مترو ${stationName}`,
        source: 'Wikimedia Commons',
        isPrimary: true,
        metadata: {
          sourceUrl: 'https://commons.wikimedia.org/wiki/Category:Tehran_Metro_stations',
          author: 'Various Contributors',
          license: 'CC BY-SA 4.0',
          licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
          attribution: 'Attribution required',
          description: `تصویر ایستگاه مترو ${stationName}`,
          width: 1600,
          height: 1200,
          size: 800000,
          mimeType: 'image/webp',
          timestamp: '2024-01-01T00:00:00Z'
        }
      }];
      
      console.log(`📝 Added example image for: ${stationName}`);
    }
  }
  
  // Generate TypeScript file
  const tsContent = `/**
 * Station Images Data
 * Generated from pics_clean.json
 * Generated: ${new Date().toISOString()}
 * 
 * Note: For development/testing. Run \`npm run images:local\` to download actual images.
 */

import type { StationImageMap } from '@/types/station-images';

export const stationImages: StationImageMap = ${JSON.stringify(stationImages, null, 2)};

export default stationImages;
`;
  
  await writeFile(IMAGES_TS_PATH, tsContent, 'utf-8');
  
  console.log('\n📊 Statistics:');
  console.log(`   Total Stations in System: ${stationsData.length}`);
  console.log(`   Stations With Images in pics_clean.json: ${stationsWithImages}`);
  console.log(`   Total Images Available: ${totalImages}`);
  console.log(`   Coverage: ${((stationsWithImages / stationsData.length) * 100).toFixed(1)}%`);
  
  console.log('\n📁 Generated file:');
  console.log(`   - ${IMAGES_TS_PATH}`);
  
  console.log('\n🚀 Next steps:');
  console.log('   1. Check the generated station-images.ts file');
  console.log('   2. Run `npm run images:local` to download actual images');
  console.log('   3. Test the UI with station images');
  console.log('   4. Add more image URLs to pics_clean.json as needed');
}

// Run the script
generateStationImages().catch(console.error);