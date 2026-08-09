#!/usr/bin/env tsx
/**
 * Test Wikimedia Commons API for Tajrish station
 * 
 * This script tests the complete flow for ONE station (Tajrish) before processing all stations.
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
    
    const license = extmetadata.LicenseShortName?.value || 
                   extmetadata.License?.value || 
                   'Unknown license';
    
    const licenseUrl = extmetadata.LicenseUrl?.value || 
                      extmetadata.License?.value || 
                      'https://creativecommons.org/licenses/by-sa/4.0/';
    
    const author = extmetadata.Artist?.value || 
                  extmetadata.Author?.value || 
                  'Wikimedia Commons Contributor';
    
    const description = extmetadata.ImageDescription?.value || 
                       extmetadata.ObjectName?.value || 
                       `Image of ${filename.replace(/_/g, ' ')}`;
    
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
): Promise<{ success: boolean; localPath?: string; error?: string }> {
  const outputFileName = `${stationId.replace('station_', '')}${index > 0 ? `-${index}` : ''}.webp`;
  const outputPath = join(PUBLIC_STATIONS_DIR, outputFileName);
  
  // Skip if already exists
  if (existsSync(outputPath)) {
    console.log(`    Image already exists: ${outputFileName}`);
    return { success: true, localPath: `/stations/${outputFileName}` };
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
    
    console.log(`    ✅ Saved: ${outputFileName}`);
    return { success: true, localPath: `/stations/${outputFileName}` };
    
  } catch (error) {
    const errorMsg = (error as Error).message;
    console.error(`    ❌ Failed: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Process Tajrish station only
 */
async function processTajrishStation(): Promise<void> {
  console.log('🏙️  Tehran Metro - Testing Wikimedia Commons API for Tajrish Station');
  console.log('==================================================================\n');
  
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
  
  // Find Tajrish station
  const tajrishPicData = picsData['Tajrish'];
  if (!tajrishPicData) {
    throw new Error('Tajrish station not found in pics_clean.json');
  }
  
  const tajrishStation = stationsData.find(s => s.name === 'Tajrish');
  if (!tajrishStation) {
    throw new Error('Tajrish station not found in processed stations.json');
  }
  
  const stationId = tajrishStation.id;
  const stationNameFa = tajrishPicData.translations?.fa || 'Tajrish';
  const imageUrls = tajrishPicData.translations?.pic || [];
  
  console.log(`🔍 Processing: ${stationNameFa} (Tajrish)`);
  console.log(`   Station ID: ${stationId}`);
  console.log(`   Image URLs: ${imageUrls.filter(url => url).length}`);
  console.log('');
  
  const results = [];
  
  // Process each image URL
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    if (!url || url === '') continue;
    
    console.log(`🖼️  Image ${i + 1}:`);
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
      
      console.log(`   API resolved URL: ${imageInfo.directUrl}`);
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
        
        results.push({
          stationId,
          filename,
          localPath: downloadResult.localPath,
          imageInfo
        });
        
      } else {
        throw new Error(`Download failed: ${downloadResult.error}`);
      }
      
    } catch (error) {
      console.error(`   ❌ Failed: ${(error as Error).message}`);
    }
    
    console.log('');
    
    // Rate limiting between requests
    if (i < imageUrls.length - 1) {
      console.log('   ⏳ Waiting 1 second before next request...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Summary
  console.log('📊 Tajrish Station Test Results:');
  console.log(`   Total images in source: ${imageUrls.filter(url => url).length}`);
  console.log(`   Successfully processed: ${results.length}`);
  console.log(`   Failed: ${imageUrls.filter(url => url).length - results.length}`);
  
  if (results.length > 0) {
    console.log('\n✅ Test successful! Images saved to:');
    for (const result of results) {
      console.log(`   - ${result.localPath}`);
    }
    
    // Verify the files exist and are valid
    console.log('\n🔍 Verifying downloaded files...');
    for (const result of results) {
      const filePath = join(PROJECT_ROOT, 'public', result.localPath);
      if (existsSync(filePath)) {
        try {
          const metadata = await sharp(filePath).metadata();
          console.log(`   ✓ ${result.localPath}: ${metadata.width}×${metadata.height} (WebP)`);
        } catch (error) {
          console.error(`   ✗ ${result.localPath}: Invalid WebP file`);
        }
      } else {
        console.error(`   ✗ ${result.localPath}: File not found`);
      }
    }
    
    console.log('\n🎉 Tajrish station test completed successfully!');
    console.log('You can now proceed to process all stations.');
    
  } else {
    console.error('\n❌ Test failed! No images were successfully processed.');
    console.log('Check the error messages above and fix the issues before proceeding.');
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    await processTajrishStation();
    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].includes('test-wikimedia-api-fixed')) {
  main();
}