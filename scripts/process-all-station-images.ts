#!/usr/bin/env tsx
/**
 * Process All Station Images
 * 
 * Processes all stations with images in pics_clean.json using Wikimedia Commons API.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const PROJECT_ROOT = join(__dirname, '..');
const PICS_JSON_PATH = join(PROJECT_ROOT, 'githubfile/data/pics_clean.json');
const STATIONS_JSON_PATH = join(PROJECT_ROOT, 'src/data/processed/stations.json');
const IMAGES_TS_PATH = join(PROJECT_ROOT, 'src/data/station-images.ts');
const PUBLIC_STATIONS_DIR = join(PROJECT_ROOT, 'public/stations');

// Wikimedia Commons API configuration
const WIKIMEDIA_API_URL = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'TehranMetroApp/1.0 (https://github.com/tehran-metro-app)';

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

interface ProcessedImage {
  stationId: string;
  src: string;
  alt: string;
  source: "Wikimedia Commons";
  isPrimary: boolean;
  metadata: {
    sourceUrl: string;
    author: string;
    license: string;
    licenseUrl: string;
    attribution: string;
    description: string;
    width: number;
    height: number;
    size: number;
    mimeType: string;
    timestamp: string;
  };
}

interface ProcessResult {
  stationId: string;
  stationName: string;
  stationNameFa: string;
  imagesProcessed: ProcessedImage[];
  errors: string[];
}

interface Stats {
  totalStations: number;
  stationsWithImageUrls: number;
  totalImageUrls: number;
  imagesDownloaded: number;
  imagesFailed: number;
  stationsWithoutImages: number;
}

/**
 * Extract filename from Wikimedia Commons file page URL
 */
function extractFilenameFromUrl(url: string): string | null {
  if (!url || url === '') return null;
  
  try {
    // Example: https://commons.wikimedia.org/wiki/File:Tajrish_Metro_Station_3.jpg#/media/File:Tajrish_Metro_Station_3.jpg
    const match = url.match(/File:([^#\?]+)/);
    if (!match) return null;
    
    return match[1];
  } catch (error) {
    console.error(`Failed to parse URL: ${url}`, error);
    return null;
  }
}

/**
 * Clean HTML tags from text
 */
function cleanHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}

/**
 * Get image info from Wikimedia Commons API
 */
async function getImageInfoFromWikimedia(filename: string): Promise<any> {
  console.log(`  📡 Querying Wikimedia API for: ${filename}`);
  
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'imageinfo',
    titles: `File:${filename}`,
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: '1600',
    origin: '*'
  });
  
  try {
    const response = await fetch(`${WIKIMEDIA_API_URL}?${params}`, {
      headers: {
        'User-Agent': USER_AGENT
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Extract image info from API response
    const pages = data.query?.pages;
    if (!pages) {
      throw new Error('No pages in API response');
    }
    
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];
    
    if (page.missing || !page.imageinfo) {
      throw new Error(`File not found: ${filename}`);
    }
    
    const imageInfo = page.imageinfo[0];
    
    // Extract license and author information
    const extmetadata = imageInfo.extmetadata || {};
    
    const license = cleanHtml(extmetadata.LicenseShortName?.value || 
                   extmetadata.License?.value || 
                   'CC BY-SA 4.0');
    
    const licenseUrl = cleanHtml(extmetadata.LicenseUrl?.value || 
                      extmetadata.License?.value || 
                      'https://creativecommons.org/licenses/by-sa/4.0/');
    
    const author = cleanHtml(extmetadata.Artist?.value || 
                  extmetadata.Author?.value || 
                  'Wikimedia Commons Contributor');
    
    const description = cleanHtml(extmetadata.ImageDescription?.value || 
                       extmetadata.ObjectName?.value || 
                       `Image of ${filename.replace(/_/g, ' ')}`);
    
    return {
      filename,
      directUrl: imageInfo.url,
      width: imageInfo.width,
      height: imageInfo.height,
      size: imageInfo.size,
      mimeType: imageInfo.mime,
      description,
      license,
      licenseUrl,
      author,
      pageUrl: `https://commons.wikimedia.org/wiki/File:${filename}`
    };
    
  } catch (error) {
    console.error(`  ❌ Wikimedia API error for ${filename}:`, (error as Error).message);
    throw error;
  }
}

/**
 * Download and convert image to WebP
 */
async function downloadAndConvertImage(
  imageUrl: string,
  stationId: string,
  index: number,
  imageInfo: any
): Promise<{ success: boolean; localPath?: string; error?: string; width?: number; height?: number }> {
  const outputFileName = `${stationId.replace('station_', '')}${index > 0 ? `-${index}` : ''}.webp`;
  const outputPath = join(PUBLIC_STATIONS_DIR, outputFileName);
  
  // Skip if already exists
  if (existsSync(outputPath)) {
    console.log(`    Image already exists: ${outputFileName}`);
    const metadata = await sharp(outputPath).metadata();
    return { 
      success: true, 
      localPath: `/stations/${outputFileName}`,
      width: metadata.width,
      height: metadata.height
    };
  }
  
  try {
    console.log(`    📥 Downloading: ${imageUrl.substring(0, 80)}...`);
    
    // Download image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': USER_AGENT
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    
    // Validate and convert with sharp
    console.log(`    🛠️  Converting to WebP...`);
    const sharpInstance = sharp(Buffer.from(buffer));
    const originalMetadata = await sharpInstance.metadata();
    
    // Resize if necessary (max 1600px on the longest side)
    const maxSize = 1600;
    let resizeOptions = {};
    
    if (originalMetadata.width && originalMetadata.height) {
      const width = originalMetadata.width;
      const height = originalMetadata.height;
      
      if (width > maxSize || height > maxSize) {
        resizeOptions = {
          width: width > height ? maxSize : undefined,
          height: height > width ? maxSize : undefined,
          fit: 'inside',
          withoutEnlargement: true
        };
      }
    }
    
    const result = await sharpInstance
      .resize(resizeOptions)
      .webp({ 
        quality: 85,
        effort: 6
      })
      .toFile(outputPath);
    
    console.log(`    ✅ Saved: ${outputFileName} (${result.width}×${result.height})`);
    return { 
      success: true, 
      localPath: `/stations/${outputFileName}`,
      width: result.width,
      height: result.height
    };
    
  } catch (error) {
    const errorMsg = (error as Error).message;
    console.error(`    ❌ Failed: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Process all stations with images
 */
async function processAllStations(): Promise<void> {
  console.log('🏙️  Tehran Metro - Processing All Station Images');
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
    stationsWithImageUrls: 0,
    totalImageUrls: 0,
    imagesDownloaded: 0,
    imagesFailed: 0,
    stationsWithoutImages: 0
  };
  
  const results: ProcessResult[] = [];
  const allImages: Record<string, ProcessedImage[]> = {};
  
  // Create mapping from station name to station ID
  const nameToIdMap = new Map<string, string>();
  for (const station of stationsData) {
    nameToIdMap.set(station.name.toLowerCase(), station.id);
  }
  
  // Process stations that have image URLs
  const stationsToProcess = Object.entries(picsData).filter(([_, data]) => {
    const imageUrls = data.translations?.pic || [];
    return imageUrls.some(url => url && url !== '');
  });
  
  console.log(`🎯 Found ${stationsToProcess.length} stations with image URLs\n`);
  
  for (const [stationName, picData] of stationsToProcess) {
    const stationId = nameToIdMap.get(stationName.toLowerCase());
    
    if (!stationId) {
      console.log(`⚠️  No matching station ID found for: ${stationName}`);
      continue;
    }
    
    const stationNameFa = picData.translations?.fa || stationName;
    const imageUrls = picData.translations?.pic || [];
    
    console.log(`🔍 Processing: ${stationNameFa} (${stationName})`);
    console.log(`   Station ID: ${stationId}`);
    console.log(`   Image URLs: ${imageUrls.filter(url => url && url !== '').length}`);
    
    const result: ProcessResult = {
      stationId,
      stationName,
      stationNameFa,
      imagesProcessed: [],
      errors: []
    };
    
    const validImageUrls = imageUrls.filter(url => url && url !== '');
    if (validImageUrls.length > 0) {
      stats.stationsWithImageUrls++;
      stats.totalImageUrls += validImageUrls.length;
      
      // Process each image URL
      for (let i = 0; i < validImageUrls.length; i++) {
        const url = validImageUrls[i];
        
        console.log(`\n🖼️  Image ${i + 1}:`);
        console.log(`   Source URL: ${url}`);
        
        try {
          // Step 1: Extract filename
          const filename = extractFilenameFromUrl(url);
          if (!filename) {
            throw new Error(`Could not extract filename from URL: ${url}`);
          }
          console.log(`   Extracted file: ${filename}`);
          
          // Step 2: Get image info from Wikimedia API
          const imageInfo = await getImageInfoFromWikimedia(filename);
          
          console.log(`   API resolved URL: ${imageInfo.directUrl.substring(0, 80)}...`);
          console.log(`   License: ${imageInfo.license}`);
          console.log(`   Author: ${imageInfo.author}`);
          console.log(`   Dimensions: ${imageInfo.width} × ${imageInfo.height}`);
          
          // Step 3: Download and convert
          const downloadResult = await downloadAndConvertImage(
            imageInfo.directUrl,
            stationId,
            i,
            imageInfo
          );
          
          if (downloadResult.success && downloadResult.localPath) {
            console.log(`   ✅ Converted: ${downloadResult.localPath}`);
            
            // Create processed image record
            const processedImage: ProcessedImage = {
              stationId,
              src: downloadResult.localPath,
              alt: `تصویر ایستگاه مترو ${stationNameFa}`,
              source: "Wikimedia Commons",
              isPrimary: i === 0,
              metadata: {
                sourceUrl: imageInfo.pageUrl,
                author: imageInfo.author,
                license: imageInfo.license,
                licenseUrl: imageInfo.licenseUrl,
                attribution: 'Attribution required',
                description: imageInfo.description,
                width: downloadResult.width || imageInfo.width || 1600,
                height: downloadResult.height || imageInfo.height || 1200,
                size: imageInfo.size || 100000,
                mimeType: 'image/webp',
                timestamp: new Date().toISOString()
              }
            };
            
            result.imagesProcessed.push(processedImage);
            stats.imagesDownloaded++;
            
            // Add to all images
            if (!allImages[stationId]) {
              allImages[stationId] = [];
            }
            allImages[stationId].push(processedImage);
            
          } else {
            const errorMsg = `Download failed: ${downloadResult.error}`;
            result.errors.push(errorMsg);
            stats.imagesFailed++;
            console.error(`   ❌ ${errorMsg}`);
          }
          
        } catch (error) {
          const errorMsg = `Processing failed: ${(error as Error).message}`;
          result.errors.push(errorMsg);
          stats.imagesFailed++;
          console.error(`   ❌ ${errorMsg}`);
        }
        
        // Rate limiting between requests (1 second)
        if (i < validImageUrls.length - 1) {
          console.log('   ⏳ Waiting 1 second before next request...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log(`\n   ✅ Processed: ${result.imagesProcessed.length} image(s)`);
      console.log(`   ❌ Errors: ${result.errors.length}`);
      
    } else {
      console.log(`   ℹ️  No valid images available`);
    }
    
    results.push(result);
    console.log('─'.repeat(60) + '\n');
    
    // Save progress every 5 stations
    if (results.length % 5 === 0) {
      await saveProgress(allImages, stats);
    }
  }
  
  // Calculate final stats
  stats.stationsWithoutImages = stats.totalStations - stats.stationsWithImageUrls;
  
  // Generate final TypeScript file
  await generateTypeScriptFile(allImages, stats);
  
  // Summary
  console.log('📊 Final Statistics:');
  console.log(`   Total Stations: ${stats.totalStations}`);
  console.log(`   Stations With Image URLs: ${stats.stationsWithImageUrls}`);
  console.log(`   Total Image URLs: ${stats.totalImageUrls}`);
  console.log(`   Images Downloaded: ${stats.imagesDownloaded}`);
  console.log(`   Images Failed: ${stats.imagesFailed}`);
  console.log(`   Stations Without Images: ${stats.stationsWithoutImages}`);
  console.log(`   Coverage: ${((stats.stationsWithImageUrls / stats.totalStations) * 100).toFixed(1)}%`);
  
  if (stats.imagesDownloaded > 0) {
    console.log('\n✅ Image processing completed successfully!');
    console.log(`📁 Generated: ${IMAGES_TS_PATH}`);
    console.log(`📁 Images saved to: ${PUBLIC_STATIONS_DIR}/`);
  } else {
    console.error('\n❌ No images were successfully processed.');
  }
}

/**
 * Save progress to a temporary file
 */
async function saveProgress(
  allImages: Record<string, ProcessedImage[]>,
  stats: Stats
): Promise<void> {
  const progressPath = join(PROJECT_ROOT, 'scripts/images-progress.json');
  const progress = {
    timestamp: new Date().toISOString(),
    stats,
    images: allImages
  };
  
  await writeFile(progressPath, JSON.stringify(progress, null, 2), 'utf-8');
  console.log(`💾 Progress saved to: ${progressPath}`);
}

/**
 * Generate TypeScript file with all images
 */
async function generateTypeScriptFile(
  allImages: Record<string, ProcessedImage[]>,
  stats: Stats
): Promise<void> {
  const tsContent = `/**
 * Station Images Data
 * Processed from pics_clean.json using Wikimedia Commons API
 * Generated: ${new Date().toISOString()}
 * 
 * Statistics:
 * - Total Stations: ${stats.totalStations}
 * - Stations With Images: ${stats.stationsWithImageUrls}
 * - Total Images: ${stats.imagesDownloaded}
 * - Coverage: ${((stats.stationsWithImageUrls / stats.totalStations) * 100).toFixed(1)}%
 */

import type { StationImageMap } from '@/types/station-images';

export const stationImages: StationImageMap = ${JSON.stringify(allImages, null, 2)};

export default stationImages;
`;
  
  await writeFile(IMAGES_TS_PATH, tsContent, 'utf-8');
  console.log(`📝 Generated TypeScript file: ${IMAGES_TS_PATH}`);
}

/**
 * Main execution
 */
async function main() {
  try {
    await processAllStations();
    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].includes('process-all-station-images')) {
  main();
}