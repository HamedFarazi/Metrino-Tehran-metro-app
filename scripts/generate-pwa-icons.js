/**
 * Generate PWA icons from pwaV2Logo.png
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

const sizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 32, name: 'favicon-32x32.png', output: publicDir },
  { size: 16, name: 'favicon-16x16.png', output: publicDir },
];

async function generateIcons() {
  const inputPath = join(publicDir, 'pwaV2Logo.png');
  
  console.log('🎨 Generating PWA icons from pwaV2Logo.png...\n');

  for (const { size, name, output } of sizes) {
    const outputPath = join(output || join(publicDir, 'icons'), name);
    
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Generated ${name} (${size}×${size})`);
  }
  
  console.log('\n✨ All icons generated successfully!');
}

generateIcons().catch(console.error);
