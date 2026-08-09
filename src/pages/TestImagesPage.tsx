/**
 * Test Images Page
 * 
 * Page to test station image functionality
 */

import { TestStationImage } from '@/components/TestStationImage';
import { StationImage } from '@/features/station/StationImage';
import { stationImagesService } from '@/services/station-images.service';
import { MetroDataService } from '@/services/metro-data.service';

export function TestImagesPage() {
  // Get some sample stations for testing
  const sampleStations = [
    MetroDataService.getStation('station_1'), // Tajrish
    MetroDataService.getStation('station_2'), // Gheytariyeh
    MetroDataService.getStation('station_3'), // Shahid Sadr
    MetroDataService.getStation('station_74'), // Abdol Abad
    MetroDataService.getStation('station_128'), // Shahid Ashrafi Esfahani
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-gray-900/30 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🧪 Test Station Images</h1>
          <p className="text-white/60">Testing the station image system with Wikimedia Commons integration</p>
        </div>

        {/* Service Test */}
        <div className="mb-8">
          <TestStationImage />
        </div>

        {/* Visual Test - Station Images */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">🖼️ Visual Test - Station Images</h2>
          <p className="text-white/60 mb-4">Testing the StationImage component with different stations:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleStations.map((station) => {
              if (!station) return null;
              
              const stationImage = stationImagesService.getImageForStation(station);
              
              return (
                <div key={station.id} className="bg-white/5 rounded-2xl border border-white/10 p-4">
                  <h3 className="text-lg font-semibold text-white mb-2" dir="rtl">
                    {station.nameFa} <span className="text-white/40 text-sm">({station.name})</span>
                  </h3>
                  
                  <div className="mb-3">
                    <div className="flex gap-1">
                      {station.lines.map(lineId => (
                        <div
                          key={lineId}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: `var(--line-${lineId})` }}
                        >
                          {lineId}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Station Image Component */}
                  <div className="mb-3">
                    <StationImage
                      station={station}
                      stationImage={stationImage}
                      className="h-48"
                      showAttribution={true}
                    />
                  </div>
                  
                  <div className="text-sm text-white/60">
                    <p>Station ID: {station.id}</p>
                    <p>Has Image: {stationImage ? '✅ Yes' : '❌ No'}</p>
                    {stationImage && (
                      <>
                        <p>Source: {stationImage.source}</p>
                        <p>License: {stationImage.metadata.license}</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold text-white mb-3">🔧 Troubleshooting Guide</h2>
          
          <div className="space-y-3 text-white/70">
            <div>
              <h3 className="font-medium text-white mb-1">If images don't load:</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Check browser console for CORS errors</li>
                <li>Verify image URLs in station-images.ts are accessible</li>
                <li>Try using different image URLs (Unsplash works better for testing)</li>
                <li>Check if the station has images defined in the data</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-white mb-1">Common issues:</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li><strong>CORS errors:</strong> Wikimedia Commons may block direct image loading from localhost</li>
                <li><strong>Wrong station ID:</strong> Make sure station IDs match between data files</li>
                <li><strong>Missing data:</strong> Check if station-images.ts is properly imported</li>
                <li><strong>Image loading errors:</strong> The component should show fallback design</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-white mb-1">Testing without external images:</h3>
              <p className="text-sm">
                For local development, you can use placeholder images or download actual images 
                using <code className="bg-black/30 px-1 py-0.5 rounded">npm run images:local</code>
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Station Image System Status</p>
              <p className="text-white text-lg font-medium">
                {sampleStations.filter(s => stationImagesService.hasImages(s!.id)).length} / {sampleStations.length} sample stations have images
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm">Total Coverage</p>
              <p className="text-white text-lg font-medium">
                {stationImagesService.getStats().coverage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}