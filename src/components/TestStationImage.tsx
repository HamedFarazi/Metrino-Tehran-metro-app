/**
 * Test Station Image Component
 * 
 * Simple component to test if station images are working
 */

import { useState } from 'react';
import { stationImagesService } from '@/services/station-images.service';

export function TestStationImage() {
  const [stationId, setStationId] = useState('station_1');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testStationImages = () => {
    try {
      setError(null);
      
      // Test the service
      const images = stationImagesService.getStationImages(stationId);
      const primaryImage = stationImagesService.getPrimaryImage(stationId);
      const hasImages = stationImagesService.hasImages(stationId);
      const stats = stationImagesService.getStats();
      
      setResult({
        stationId,
        images,
        primaryImage,
        hasImages,
        stats,
        allImages: stationImagesService.getAllImages().slice(0, 3) // First 3 only
      });
      
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
      <h2 className="text-xl font-bold text-white mb-4">🧪 Test Station Images</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-white/60 mb-2">Station ID</label>
          <input
            type="text"
            value={stationId}
            onChange={(e) => setStationId(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
            placeholder="station_1"
          />
          <p className="text-xs text-white/40 mt-1">
            Try: station_1 (Tajrish), station_2 (Gheytariyeh), station_74 (Abdol Abad)
          </p>
        </div>
        
        <button
          onClick={testStationImages}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
        >
          Test Station Images
        </button>
        
        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-lg">
            <p className="text-red-300 font-medium">Error:</p>
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}
        
        {result && (
          <div className="space-y-4">
            <div className="p-4 bg-white/10 rounded-lg">
              <p className="text-white/80 font-medium">Results for: {result.stationId}</p>
              <p className="text-white/60">Has Images: {result.hasImages ? '✅ Yes' : '❌ No'}</p>
              <p className="text-white/60">Number of Images: {result.images.length}</p>
            </div>
            
            {result.primaryImage && (
              <div className="p-4 bg-white/10 rounded-lg">
                <p className="text-white/80 font-medium mb-2">Primary Image:</p>
                <div className="flex items-start gap-4">
                  <img
                    src={result.primaryImage.src}
                    alt={result.primaryImage.alt}
                    className="w-32 h-32 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/128x128/1a1c2e/ffffff?text=Error';
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-white/70 text-sm">{result.primaryImage.alt}</p>
                    <p className="text-white/50 text-xs">Source: {result.primaryImage.source}</p>
                    <p className="text-white/50 text-xs">License: {result.primaryImage.metadata.license}</p>
                    <a
                      href={result.primaryImage.metadata.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-300 hover:text-emerald-200 text-xs block mt-1"
                    >
                      View Source
                    </a>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-4 bg-white/10 rounded-lg">
              <p className="text-white/80 font-medium mb-2">Service Stats:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-white/60">Total Stations:</div>
                <div className="text-white/80">{result.stats.totalStations}</div>
                
                <div className="text-white/60">Stations With Images:</div>
                <div className="text-white/80">{result.stats.stationsWithImages}</div>
                
                <div className="text-white/60">Total Images:</div>
                <div className="text-white/80">{result.stats.totalImages}</div>
                
                <div className="text-white/60">Coverage:</div>
                <div className="text-white/80">{result.stats.coverage.toFixed(1)}%</div>
              </div>
            </div>
            
            {result.allImages.length > 0 && (
              <div className="p-4 bg-white/10 rounded-lg">
                <p className="text-white/80 font-medium mb-2">Sample Images in System:</p>
                <div className="grid grid-cols-3 gap-2">
                  {result.allImages.map((img: any, index: number) => (
                    <div key={index} className="text-center">
                      <img
                        src={img.src}
                        alt=""
                        className="w-20 h-20 object-cover rounded mx-auto mb-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x80/1a1c2e/ffffff?text=X';
                        }}
                      />
                      <p className="text-white/50 text-xs truncate">
                        {img.stationId.replace('station_', '')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="pt-4 border-t border-white/10">
          <p className="text-white/60 text-sm">
            <strong>Note:</strong> This is testing the station images service. If images don't load:
          </p>
          <ul className="text-white/50 text-sm list-disc list-inside mt-2 space-y-1">
            <li>Check the browser console for errors</li>
            <li>Verify the station-images.ts file exists and has data</li>
            <li>Check if image URLs are accessible (might be blocked by CORS)</li>
            <li>Try different station IDs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}