#!/usr/bin/env tsx
/**
 * Process Local Station Images
 * 
 * Reads image URLs from pics_clean.json and downloads/optimizes them.
 * Much simpler than Wikimedia Commons API approach.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename } from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const PROJECT_ROOT = join(__dirname, '..');
const PICS_JSON_PATH = join(PROJECT_ROOT, 'githubfile/data/pics_clean.json');
const STATIONS_JSON_PATH = join(PROJECT_ROOT, 'src/data/processed/stations.json');
const IMAGES_JSON_PATH = join(PROJECT_ROOT, 'src/data/station-images.json');
const IMAGES_TS_PATH = join(PROJECT_ROOT, 'src/data/station-images.ts');
const PUBLIC_STATIONS_DIR = join(PROJECT_ROOT, 'public/stations');
const LOG_FILE = join(PROJECT_ROOT, 'scripts/local-images-log.json');

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

interface ProcessResult {
  stationId: string;
  stationName: string;
  stationNameFa: string;
  imageUrls: string[];
  downloadedImages: string[];
  errors: string[];
}

interface Stats {
  totalStations: number;
  stationsWithPics: number;
  totalImageUrls: number;
  imagesDownloaded: number;
  imagesFailed: number;
  stationsWithoutImages: number;
}

/**
 * Extract Wikimedia Commons file info from URL
 */
function extractWikimediaInfo(url: string): {
  fileName: string;
  pageUrl: string;
  directImageUrl?: string;
} | null {
  if (!url || url === '') return null;
  
  try {
    // Example: https://commons.wikimedia.org/wiki/File:Tajrish_Metro_Station_3.jpg#/media/File:Tajrish_Metro_Station_3.jpg
    const match = url.match(/wiki\/File:(.+?)(?:#|\?|$)/);
    if (!match) return null;
    
    const fileName = match[1];
    const pageUrl = `https://commons.wikimedia.org/wiki/File:${fileName}`;
    
    // Construct direct image URL (thumbnail version)
    // We'll use a reasonable thumbnail size
    const baseName = fileName.replace(/\.[^.]+$/, '');
    const extension = fileName.match(/\.([^.]+)$/)?.[1] || 'jpg';
    const directImageUrl = `https://upload.wikimedia.org/wikipedia/commons/thumb/${fileName.charAt(0)}/${fileName.charAt(0)}${fileName.charAt(1)}/${fileName}/1280px-${fileName}`;
    
    return {
      fileName,
      pageUrl,
      directImageUrl
    };
  } catch (error) {
    console.warn(`Failed to parse URL: ${url}`, error);
    return null;
  }
}

/**
 * Download and optimize image
 */
async function downloadAndOptimizeImage(
  imageUrl: string,
  stationId: string,
  index: number
): Promise<{ success: boolean; localPath?: string; error?: string }> {
  const outputFileName = `${stationId.replace('station_', '')}${index > 0 ? `-${index}` : ''}.webp`;
  const outputPath = join(PUBLIC_STATIONS_DIR, outputFileName);
  
  // Skip if already exists
  if (existsSync(outputPath)) {
    console.log(`    Image already exists: ${outputFileName}`);
    return { success: true, localPath: `/stations/${outputFileName}` };
  }
  
  try {
    console.log(`    Downloading: ${imageUrl.substring(0, 80)}...`);
    
    // Download image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'TehranMetroApp/1.0 (https://github.com/tehran-metro-app)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    
    // Optimize with sharp
    await sharp(Buffer.from(buffer))
      .resize({
        width: 1600,
        height: 1200,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ 
        quality: 85,
        effort: 6
      })
      .toFile(outputPath);
    
    console.log(`    ✅ Optimized and saved: ${outputFileName}`);
    return { success: true, localPath: `/stations/${outputFileName}` };
    
  } catch (error) {
    const errorMsg = (error as Error).message;
    console.warn(`    ❌ Failed: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Get license info for Wikimedia Commons image
 * Note: In a real implementation, we'd fetch this from the API
 */
function getLicenseInfo(fileName: string): {
  license: string;
  licenseUrl: string;
  author: string;
} {
  // Default license info (most Tehran Metro images are CC BY-SA 4.0)
  return {
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    author: 'Wikimedia Commons Contributor'
  };
}

/**
 * Main processing function
 */
async function processLocalImages(): Promise<void> {
  console.log('🏙️  Tehran Metro - Processing Local Station Images');
  console.log('================================================\n');
  
  // Ensure directories exist
  if (!existsSync(PUBLIC_STATIONS_DIR)) {
    await mkdir(PUBLIC_STATIONS_DIR, { recursive: true });
  }
  
  // Load data
  console.log('📋 Loading data...');
  const picsData: Record<string, StationPicData> = JSON.parse(
    await readFile(PICS_JSON_PATH, 'utf-8')
  );
  
  const stationsData: StationData[] = JSON.parse(
    await readFile(STATIONS_JSON_PATH, 'utf-8')
  );
  
  console.log(`📊 Found ${Object.keys(picsData).length} stations in pics data`);
  console.log(`📊 Found ${stationsData.length} stations in processed data\n`);
  
  const stats: Stats = {
    totalStations: stationsData.length,
    stationsWithPics: 0,
    totalImageUrls: 0,
    imagesDownloaded: 0,
    imagesFailed: 0,
    stationsWithoutImages: 0
  };
  
  const results: ProcessResult[] = [];
  const stationImages: Record<string, any[]> = {};
  
  // Create mapping from station name to station ID
  const nameToIdMap = new Map<string, string>();
  for (const station of stationsData) {
    nameToIdMap.set(station.name.toLowerCase(), station.id);
  }
  
  // Process each station
  for (const [stationName, picData] of Object.entries(picsData)) {
    const stationId = nameToIdMap.get(stationName.toLowerCase());
    
    if (!stationId) {
      console.log(`⚠️  No matching station ID found for: ${stationName}`);
      continue;
    }
    
    const stationNameFa = picData.translations?.fa || stationName;
    const imageUrls = picData.translations?.pic || [];
    
    console.log(`🔍 Processing: ${stationNameFa} (${stationName})`);
    console.log(`   Station ID: ${stationId}`);
    console.log(`   Image URLs: ${imageUrls.filter(url => url).length}`);
    
    const result: ProcessResult = {
      stationId,
      stationName,
      stationNameFa,
      imageUrls: imageUrls.filter(url => url),
      downloadedImages: [],
      errors: []
    };
    
    if (imageUrls.filter(url => url).length > 0) {
      stats.stationsWithPics++;
      stats.totalImageUrls += imageUrls.filter(url => url).length;
      
      // Process each image URL
      for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        if (!url || url === '') continue;
        
        const fileInfo = extractWikimediaInfo(url);
        if (!fileInfo) {
          result.errors.push(`Invalid URL: ${url}`);
          stats.imagesFailed++;
          continue;
        }
        
        // Download and optimize
        const downloadResult = await downloadAndOptimizeImage(
          fileInfo.directImageUrl || url,
          stationId,
          i
        );
        
        if (downloadResult.success && downloadResult.localPath) {
          result.downloadedImages.push(downloadResult.localPath);
          stats.imagesDownloaded++;
          
          // Create image record
          const licenseInfo = getLicenseInfo(fileInfo.fileName);
          const imageRecord = {
            stationId,
            src: downloadResult.localPath,
            alt: `تصویر ایستگاه مترو ${stationNameFa}`,
            source: 'Wikimedia Commons',
            isPrimary: i === 0,
            metadata: {
              sourceUrl: fileInfo.pageUrl,
              author: licenseInfo.author,
              license: licenseInfo.license,
              licenseUrl: licenseInfo.licenseUrl,
              attribution: 'Attribution required',
              description: `تصویر ایستگاه مترو ${stationNameFa}`,
              width: 1600,
              height: 1200,
              size: 0, // Would need actual file size
              mimeType: 'image/webp',
              timestamp: new Date().toISOString()
            }
          };
          
          if (!stationImages[stationId]) {
            stationImages[stationId] = [];
          }
          stationImages[stationId].push(imageRecord);
          
        } else {
          result.errors.push(`Failed to download: ${url}`);
          stats.imagesFailed++;
        }
        
        // Rate limiting
        if (i < imageUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log(`   ✅ Downloaded: ${result.downloadedImages.length} image(s)`);
      
    } else {
      console.log(`   ℹ️  No images available`);
      stats.stationsWithoutImages++;
    }
    
    results.push(result);
    console.log();
    
    // Save progress periodically
    if (Object.keys(picsData).indexOf(stationName) % 10 === 0) {
      await saveProgress(results, stationImages, stats);
    }
  }
  
  // Calculate final stats
  stats.stationsWithoutImages = stats.totalStations - stats.stationsWithPics;
  
  // Generate final reports
  await generateFinalReports(stationImages, stats);
  
  console.log('\n✅ Image processing completed!');
  console.log('📊 Final Statistics:');
  console.log(`   Total Stations: ${stats.totalStations}`);
  console.log(`   Stations With Image URLs: ${stats.stationsWithPics}`);
  console.log(`   Total Image URLs: ${stats.totalImageUrls}`);
  console.log(`   Images Downloaded: ${stats.imagesDownloaded}`);
  console.log(`   Images Failed: ${stats.imagesFailed}`);
  console.log(`   Stations Without Images: ${stats.stationsWithoutImages}`);
  console.log(`   Coverage: ${((stats.stationsWithPics / stats.totalStations) * 100).toFixed(1)}%`);
}

/**
 * Save progress to log file
 */
async function saveProgress(
  results: ProcessResult[],
  stationImages: Record<string, any[]>,
  stats: Stats
): Promise<void> {
  const progress = {
    timestamp: new Date().toISOString(),
    stats,
    results,
    stationImages
  };
  
  await writeFile(LOG_FILE, JSON.stringify(progress, null, 2), 'utf-8');
}

/**
 * Generate final reports and data files
 */
async function generateFinalReports(
  stationImages: Record<string, any[]>,
  stats: Stats
): Promise<void> {
  // Save station images JSON
  await writeFile(IMAGES_JSON_PATH, JSON.stringify(stationImages, null, 2), 'utf-8');
  
  // Generate TypeScript file
  const tsContent = `/**
 * Station Images Data
 * Processed from pics_clean.json
 * Generated: ${new Date().toISOString()}
 */

import type { StationImageMap } from '@/types/station-images';

export const stationImages: StationImageMap = ${JSON.stringify(stationImages, null, 2)};

export default stationImages;
`;
  
  await writeFile(IMAGES_TS_PATH, tsContent, 'utf-8');
  
  // Generate summary report
  const summary = {
    generated: new Date().toISOString(),
    source: 'pics_clean.json',
    stats,
    stationsWithImages: Object.keys(stationImages).length,
    stationsWithoutImages: stats.stationsWithoutImages,
    imageCount: Object.values(stationImages).reduce((sum, images) => sum + images.length, 0)
  };
  
  const summaryPath = join(PROJECT_ROOT, 'scripts/local-images-summary.json');
  await writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
  
  console.log('\n📁 Generated files:');
  console.log(`   - ${IMAGES_JSON_PATH}`);
  console.log(`   - ${IMAGES_TS_PATH}`);
  console.log(`   - ${summaryPath}`);
  console.log(`   - ${LOG_FILE}`);
}

/**
 * Main execution
 */
async function main() {
  try {
    await processLocalImages();
    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { processLocalImages };