#!/usr/bin/env tsx
/**
 * Create Test Images
 * 
 * Creates placeholder images for testing the station image system
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { createCanvas } from 'canvas';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const PROJECT_ROOT = join(__dirname, '..');
const STATIONS_JSON_PATH = join(PROJECT_ROOT, 'src/data/processed/stations.json');
const PUBLIC_STATIONS_DIR = join(PROJECT_ROOT, 'public/stations');

interface StationData {
  id: string;
  name: string;
  translations: {
    fa: string;
  };
  lines: number[];
}

/**
 * Create a simple placeholder image
 */
function createPlaceholderImage(stationName: string, stationNameFa: string, lines: number[]): Buffer {
  const width = 800;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1a1c2e');
  gradient.addColorStop(1, '#2d3250');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Station icon (metro symbol)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 120px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🚇', width / 2, height / 2 - 80);
  
  // Station name (Farsi)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px Arial';
  ctx.fillText(stationNameFa, width / 2, height / 2 + 20);
  
  // Station name (English)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '24px Arial';
  ctx.fillText(stationName, width / 2, height / 2 + 70);
  
  // Lines indicator
  const lineColors = ['#E0001F', '#2F4389', '#67C5F5', '#F8E100', '#8B47AC', '#F97316', '#7F0B74'];
  const lineCount = Math.min(lines.length, 5);
  const startX = width / 2 - (lineCount * 20);
  
  for (let i = 0; i < lineCount; i++) {
    const lineId = lines[i];
    const color = lineColors[lineId - 1] || '#888888';
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(startX + (i * 40), height - 80, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // White outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Line number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lineId.toString(), startX + (i * 40), height - 80);
  }
  
  // Bottom text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '18px Arial';
  ctx.fillText('تهران مترو', width / 2, height - 30);
  
  return canvas.toBuffer('image/png');
}

/**
 * Create test images for all stations
 */
async function createTestImages(): Promise<void> {
  console.log('🎨 Creating test images for stations\n');
  
  // Ensure directories exist
  if (!existsSync(PUBLIC_STATIONS_DIR)) {
    await mkdir(PUBLIC_STATIONS_DIR, { recursive: true });
  }
  
  // Load station data
  const stationsData: StationData[] = JSON.parse(
    await readFile(STATIONS_JSON_PATH, 'utf-8')
  );
  
  console.log(`📊 Found ${stationsData.length} stations\n`);
  
  // Create images for first 10 stations
  const stationsToProcess = stationsData.slice(0, 10);
  
  for (const station of stationsToProcess) {
    const stationId = station.id;
    const stationName = station.name;
    const stationNameFa = station.translations?.fa || stationName;
    const lines = station.lines || [];
    
    const outputFileName = `${stationId.replace('station_', '')}.webp`;
    const outputPath = join(PUBLIC_STATIONS_DIR, outputFileName);
    
    // Skip if already exists
    if (existsSync(outputPath)) {
      console.log(`✅ Already exists: ${outputFileName}`);
      continue;
    }
    
    try {
      console.log(`🎨 Creating: ${stationNameFa} (${stationName})`);
      
      // Create placeholder image
      const imageBuffer = createPlaceholderImage(stationName, stationNameFa, lines);
      
      // Convert to WebP (using sharp if available, otherwise save as PNG)
      try {
        const sharp = await import('sharp');
        await sharp.default(imageBuffer)
          .webp({ quality: 80 })
          .toFile(outputPath);
        console.log(`   ✅ Saved as WebP: ${outputFileName}`);
      } catch (sharpError) {
        // Fallback: save as PNG
        const fs = await import('fs/promises');
        await fs.writeFile(outputPath.replace('.webp', '.png'), imageBuffer);
        console.log(`   ✅ Saved as PNG: ${outputFileName.replace('.webp', '.png')}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Failed: ${(error as Error).message}`);
    }
  }
  
  // Also create specific images for stations that have URLs in pics_clean.json
  const specificImages = [
    { id: 'station_1', name: 'Tajrish', nameFa: 'تجریش' },
    { id: 'station_74', name: 'Abdol Abad', nameFa: 'عبدل آباد' },
    { id: 'station_128', name: 'Shahid Ashrafi Esfahani', nameFa: 'شهید اشرفی اصفهانی' }
  ];
  
  console.log('\n📸 Creating specific station images:');
  
  for (const station of specificImages) {
    const outputFileName = `${station.id.replace('station_', '')}.webp`;
    const outputPath = join(PUBLIC_STATIONS_DIR, outputFileName);
    
    if (existsSync(outputPath)) {
      console.log(`✅ Already exists: ${outputFileName}`);
      continue;
    }
    
    try {
      // Create a special image for these stations
      const imageBuffer = createPlaceholderImage(station.name, station.nameFa, [1]);
      
      try {
        const sharp = await import('sharp');
        await sharp.default(imageBuffer)
          .webp({ quality: 85 })
          .toFile(outputPath);
        console.log(`   ✅ Created: ${station.nameFa}`);
      } catch {
        const fs = await import('fs/promises');
        await fs.writeFile(outputPath.replace('.webp', '.png'), imageBuffer);
        console.log(`   ✅ Created (PNG): ${station.nameFa}`);
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${(error as Error).message}`);
    }
  }
  
  console.log('\n✅ Test images created!');
  console.log(`📁 Location: ${PUBLIC_STATIONS_DIR}`);
  console.log('\n🚀 Next: Run the app and test station images');
}

// Run the script
createTestImages().catch(console.error);