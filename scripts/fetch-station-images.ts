#!/usr/bin/env tsx
/**
 * Tehran Metro Station Image Fetcher
 * 
 * Fetches station images from Wikimedia Commons with proper license validation.
 * 
 * Usage:
 *   pnpm tsx scripts/fetch-station-images.ts
 *   npm run images:fetch
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename, extname } from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Types
import type {
  WikimediaImageMetadata,
  StationImage,
  StationImageMap,
  ImageFetchResult,
  FetchStats,
  WikimediaConfig,
  AcceptableLicense
} from '../src/types/station-images.js';
import {
  DEFAULT_CONFIG,
  ACCEPTABLE_LICENSES
} from '../src/types/station-images.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG: WikimediaConfig = {
  ...DEFAULT_CONFIG,
  userAgent: 'TehranMetroApp/1.0 (https://github.com/tehran-metro-app)'
};

// Paths
const PROJECT_ROOT = join(__dirname, '..');
const STATIONS_JSON_PATH = join(PROJECT_ROOT, 'src/data/processed/stations.json');
const IMAGES_JSON_PATH = join(PROJECT_ROOT, 'src/data/station-images.json');
const IMAGES_TS_PATH = join(PROJECT_ROOT, 'src/data/station-images.ts');
const PUBLIC_STATIONS_DIR = join(PROJECT_ROOT, 'public/stations');
const LOG_FILE = join(PROJECT_ROOT, 'scripts/image-fetch-log.json');

// Rate limiting
let lastRequestTime = 0;

// Stats
const stats: FetchStats = {
  totalStations: 0,
  imagesFound: 0,
  imagesDownloaded: 0,
  imagesRejected: 0,
  stationsWithoutImage: 0,
  licenseIssues: 0,
  errors: 0
};

/**
 * Sleep for specified milliseconds
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Rate-limited fetch with retry logic
 */
async function fetchWithRateLimit(url: string, options?: RequestInit): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < CONFIG.rateLimitDelay) {
    await sleep(CONFIG.rateLimitDelay - timeSinceLastRequest);
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'User-Agent': CONFIG.userAgent,
      ...options?.headers
    }
  });
  
  lastRequestTime = Date.now();
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response;
}

/**
 * Generate possible Wikimedia Commons category names for a station
 */
function generateCategoryNames(stationName: string, stationNameFa: string): string[] {
  const names: string[] = [];
  
  // English variations
  names.push(`${stationName} Metro Station`);
  names.push(`${stationName} station (Tehran Metro)`);
  names.push(`Tehran Metro ${stationName} station`);
  
  // Farsi variations (URL encoded)
  if (stationNameFa) {
    names.push(`${stationNameFa} metro station`);
    names.push(`${stationNameFa} station (Tehran Metro)`);
  }
  
  // Remove duplicates
  return [...new Set(names)];
}

/**
 * Search Wikimedia Commons for station category
 */
async function searchStationCategory(stationName: string, stationNameFa: string): Promise<string[]> {
  const categoryNames = generateCategoryNames(stationName, stationNameFa);
  const foundCategories: string[] = [];
  
  for (const categoryName of categoryNames) {
    try {
      const encodedName = encodeURIComponent(`Category:${categoryName}`);
      const url = `${CONFIG.apiUrl}?action=query&format=json&list=search&srsearch=${encodedName}&srnamespace=14&srlimit=5`;
      
      const response = await fetchWithRateLimit(url);
      const data = await response.json();
      
      if (data.query?.search?.length > 0) {
        for (const result of data.query.search) {
          if (result.title.toLowerCase().includes(categoryName.toLowerCase())) {
            foundCategories.push(result.title);
          }
        }
      }
    } catch (error) {
      console.warn(`  Warning: Failed to search for category "${categoryName}":`, (error as Error).message);
    }
    
    await sleep(500); // Additional delay between searches
  }
  
  return foundCategories;
}

/**
 * Get images from a Wikimedia Commons category
 */
async function getImagesFromCategory(categoryTitle: string): Promise<WikimediaImageMetadata[]> {
  const images: WikimediaImageMetadata[] = [];
  let continueToken: string | undefined;
  
  do {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'categorymembers',
      gcmtitle: categoryTitle,
      gcmlimit: '50',
      gcmtype: 'file',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata|size|mime|timestamp',
      iiextmetadatafilter: 'LicenseShortName|LicenseUrl|Artist|AttributionRequired|ImageDescription',
      iilimit: '50'
    });
    
    if (continueToken) {
      params.set('gcmcontinue', continueToken);
    }
    
    const url = `${CONFIG.apiUrl}?${params.toString()}`;
    
    try {
      const response = await fetchWithRateLimit(url);
      const data = await response.json();
      
      if (data.query?.pages) {
        for (const page of Object.values(data.query.pages) as any[]) {
          if (page.imageinfo?.[0]) {
            const info = page.imageinfo[0];
            const extmetadata = info.extmetadata || {};
            
            const metadata: WikimediaImageMetadata = {
              fileName: page.title.replace('File:', ''),
              sourceUrl: `${CONFIG.baseUrl}/wiki/${encodeURIComponent(page.title)}`,
              imageUrl: info.url,
              author: extmetadata.Artist?.value || 'Unknown',
              license: extmetadata.LicenseShortName?.value || 'Unknown',
              licenseUrl: extmetadata.LicenseUrl?.value || '',
              attribution: extmetadata.AttributionRequired?.value || '',
              description: extmetadata.ImageDescription?.value || '',
              width: info.width,
              height: info.height,
              size: info.size,
              mimeType: info.mime,
              timestamp: info.timestamp
            };
            
            images.push(metadata);
          }
        }
      }
      
      continueToken = data.continue?.gcmcontinue;
    } catch (error) {
      console.warn(`  Warning: Failed to fetch images from category "${categoryTitle}":`, (error as Error).message);
      break;
    }
    
    if (continueToken) {
      await sleep(1000); // Delay between continuation requests
    }
  } while (continueToken && images.length < CONFIG.maxImagesPerStation);
  
  return images;
}

/**
 * Validate image license and quality
 */
function validateImage(image: WikimediaImageMetadata): { valid: boolean; reason?: string } {
  // Check license
  const license = image.license.toUpperCase();
  const hasAcceptableLicense = ACCEPTABLE_LICENSES.some(acceptable => 
    license.includes(acceptable.toUpperCase())
  );
  
  if (!hasAcceptableLicense) {
    return { valid: false, reason: `Unacceptable license: ${image.license}` };
  }
  
  // Check image dimensions
  if (image.width < CONFIG.minImageWidth || image.height < CONFIG.minImageHeight) {
    return { valid: false, reason: `Image too small: ${image.width}x${image.height}` };
  }
  
  // Check file size
  if (image.size > CONFIG.maxFileSize) {
    return { valid: false, reason: `File too large: ${(image.size / 1024 / 1024).toFixed(2)}MB` };
  }
  
  // Check MIME type
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedMimeTypes.includes(image.mimeType.toLowerCase())) {
    return { valid: false, reason: `Unsupported MIME type: ${image.mimeType}` };
  }
  
  // Check if attribution is required but missing
  if (image.license.includes('CC BY') && !image.author) {
    return { valid: false, reason: 'CC license requires attribution but author is unknown' };
  }
  
  return { valid: true };
}

/**
 * Select the best image from candidates
 */
function selectBestImage(images: WikimediaImageMetadata[]): WikimediaImageMetadata | undefined {
  const validImages = images.filter(img => validateImage(img).valid);
  
  if (validImages.length === 0) {
    return undefined;
  }
  
  // Sort by quality metrics
  return validImages.sort((a, b) => {
    // Prefer larger images
    const areaA = a.width * a.height;
    const areaB = b.width * b.height;
    
    // Prefer more permissive licenses (CC0, Public Domain)
    const licenseScore = (license: string) => {
      if (license.includes('CC0') || license.includes('Public Domain')) return 3;
      if (license.includes('CC BY')) return 2;
      if (license.includes('CC BY-SA')) return 1;
      return 0;
    };
    
    const scoreA = areaA + licenseScore(a.license) * 1000000;
    const scoreB = areaB + licenseScore(b.license) * 1000000;
    
    return scoreB - scoreA;
  })[0];
}

/**
 * Download and optimize image
 */
async function downloadAndOptimizeImage(
  image: WikimediaImageMetadata,
  stationId: string,
  stationNameFa: string
): Promise<string | undefined> {
  const outputFileName = `${stationId.replace('station_', '')}.webp`;
  const outputPath = join(PUBLIC_STATIONS_DIR, outputFileName);
  
  // Skip if already exists
  if (existsSync(outputPath)) {
    console.log(`    Image already exists: ${outputFileName}`);
    return `/stations/${outputFileName}`;
  }
  
  try {
    console.log(`    Downloading: ${image.fileName}`);
    
    // Download image
    const response = await fetchWithRateLimit(image.imageUrl);
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
    
    console.log(`    Optimized and saved: ${outputFileName}`);
    return `/stations/${outputFileName}`;
    
  } catch (error) {
    console.warn(`    Failed to download/optimize image:`, (error as Error).message);
    return undefined;
  }
}

/**
 * Main function to fetch images for all stations
 */
async function fetchStationImages(): Promise<void> {
  console.log('🚇 Tehran Metro Station Image Fetcher');
  console.log('=====================================\n');
  
  // Ensure directories exist
  if (!existsSync(PUBLIC_STATIONS_DIR)) {
    await mkdir(PUBLIC_STATIONS_DIR, { recursive: true });
  }
  
  // Load station data
  console.log('📋 Loading station data...');
  const stationsData = JSON.parse(await readFile(STATIONS_JSON_PATH, 'utf-8'));
  stats.totalStations = stationsData.length;
  
  console.log(`📊 Found ${stats.totalStations} stations\n`);
  
  const results: ImageFetchResult[] = [];
  const stationImages: StationImageMap = {};
  
  // Process each station
  for (let i = 0; i < stationsData.length; i++) {
    const station = stationsData[i];
    const stationId = station.id;
    const stationName = station.name;
    const stationNameFa = station.translations?.fa || stationName;
    
    console.log(`🔍 Processing: ${stationNameFa} (${stationName}) [${i + 1}/${stats.totalStations}]`);
    
    const result: ImageFetchResult = {
      stationId,
      stationName,
      stationNameFa,
      candidateImages: []
    };
    
    try {
      // Search for station category
      console.log(`  Searching Wikimedia Commons...`);
      const categories = await searchStationCategory(stationName, stationNameFa);
      
      if (categories.length === 0) {
        console.log(`  ❌ No categories found`);
        result.error = 'No Wikimedia Commons categories found';
        stats.stationsWithoutImage++;
      } else {
        console.log(`  Found ${categories.length} category(ies): ${categories.join(', ')}`);
        
        // Get images from categories
        let allImages: WikimediaImageMetadata[] = [];
        for (const category of categories) {
          const images = await getImagesFromCategory(category);
          allImages = [...allImages, ...images];
        }
        
        result.candidateImages = allImages;
        stats.imagesFound += allImages.length;
        
        if (allImages.length > 0) {
          console.log(`  Found ${allImages.length} candidate image(s)`);
          
          // Select best image
          const bestImage = selectBestImage(allImages);
          
          if (bestImage) {
            console.log(`  ✅ Selected best image: ${bestImage.fileName}`);
            result.selectedImage = bestImage;
            
            // Validate license
            const validation = validateImage(bestImage);
            if (!validation.valid) {
              console.log(`  ⚠️  License issue: ${validation.reason}`);
              stats.licenseIssues++;
              result.error = validation.reason;
            } else {
              // Download and optimize
              const localPath = await downloadAndOptimizeImage(bestImage, stationId, stationNameFa);
              
              if (localPath) {
                // Create station image record
                const stationImage: StationImage = {
                  stationId,
                  src: localPath,
                  alt: `تصویر ایستگاه مترو ${stationNameFa}`,
                  source: 'Wikimedia Commons',
                  metadata: {
                    sourceUrl: bestImage.sourceUrl,
                    author: bestImage.author,
                    license: bestImage.license,
                    licenseUrl: bestImage.licenseUrl,
                    attribution: bestImage.attribution,
                    description: bestImage.description,
                    width: bestImage.width,
                    height: bestImage.height,
                    size: bestImage.size,
                    mimeType: bestImage.mimeType,
                    timestamp: bestImage.timestamp
                  },
                  isPrimary: true
                };
                
                stationImages[stationId] = [stationImage];
                stats.imagesDownloaded++;
                
                console.log(`  🎉 Successfully processed image for ${stationNameFa}`);
              } else {
                console.log(`  ❌ Failed to download image`);
                stats.imagesRejected++;
                stats.stationsWithoutImage++;
                result.error = 'Failed to download image';
              }
            }
          } else {
            console.log(`  ❌ No suitable images found`);
            stats.imagesRejected += allImages.length;
            stats.stationsWithoutImage++;
            result.error = 'No suitable images found';
          }
        } else {
          console.log(`  ❌ No images found in categories`);
          stats.stationsWithoutImage++;
          result.error = 'No images found in categories';
        }
      }
    } catch (error) {
      console.error(`  💥 Error processing station:`, (error as Error).message);
      result.error = (error as Error).message;
      stats.errors++;
      stats.stationsWithoutImage++;
    }
    
    results.push(result);
    console.log(); // Empty line for readability
    
    // Save progress periodically
    if ((i + 1) % 10 === 0 || i === stationsData.length - 1) {
      await saveProgress(results, stationImages);
    }
    
    // Rate limiting between stations
    if (i < stationsData.length - 1) {
      await sleep(2000);
    }
  }
  
  // Generate final reports
  await generateFinalReports(results, stationImages);
  
  console.log('\n✅ Image fetching completed!');
  console.log('📊 Final Statistics:');
  console.log(`   Total Stations: ${stats.totalStations}`);
  console.log(`   Images Found: ${stats.imagesFound}`);
  console.log(`   Images Downloaded: ${stats.imagesDownloaded}`);
  console.log(`   Images Rejected: ${stats.imagesRejected}`);
  console.log(`   Stations Without Image: ${stats.stationsWithoutImage}`);
  console.log(`   License Issues: ${stats.licenseIssues}`);
  console.log(`   Errors: ${stats.errors}`);
}

/**
 * Save progress to log file
 */
async function saveProgress(results: ImageFetchResult[], stationImages: StationImageMap): Promise<void> {
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
async function generateFinalReports(results: ImageFetchResult[], stationImages: StationImageMap): Promise<void> {
  // Save station images JSON
  await writeFile(IMAGES_JSON_PATH, JSON.stringify(stationImages, null, 2), 'utf-8');
  
  // Generate TypeScript file
  const tsContent = `/**
 * Station Images Data
 * Auto-generated from Wikimedia Commons
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
    config: CONFIG,
    stats,
    stationsWithImages: Object.keys(stationImages).length,
    stationsWithoutImages: stats.totalStations - Object.keys(stationImages).length,
    imageCount: Object.values(stationImages).reduce((sum, images) => sum + images.length, 0)
  };
  
  const summaryPath = join(PROJECT_ROOT, 'scripts/image-fetch-summary.json');
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
    await fetchStationImages();
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

export { fetchStationImages };