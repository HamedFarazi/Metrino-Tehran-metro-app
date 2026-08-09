/**
 * Station Images Data - TEST VERSION
 * Uses direct Wikimedia Commons image URLs for testing
 * Generated: 2026-08-09T09:15:00.000Z
 */

import type { StationImageMap } from '@/types/station-images';

export const stationImages: StationImageMap = {
  "station_1": [
    {
      stationId: "station_1",
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Tajrish_Metro_Station_3.jpg/800px-Tajrish_Metro_Station_3.jpg",
      alt: "تصویر ایستگاه مترو تجریش",
      source: "Wikimedia Commons",
      isPrimary: true,
      metadata: {
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Tajrish_Metro_Station_3.jpg",
        author: "Kasir",
        license: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        attribution: "Attribution required",
        description: "Tajrish Metro Station entrance",
        width: 800,
        height: 566,
        size: 150000,
        mimeType: "image/jpeg",
        timestamp: "2024-01-01T00:00:00Z"
      }
    },
    {
      stationId: "station_1",
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Tajrish_Metro_Station.jpg/800px-Tajrish_Metro_Station.jpg",
      alt: "تصویر ایستگاه مترو تجریش",
      source: "Wikimedia Commons",
      isPrimary: false,
      metadata: {
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Tajrish_Metro_Station.jpg",
        author: "Kasir",
        license: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        attribution: "Attribution required",
        description: "Another view of Tajrish Metro Station",
        width: 800,
        height: 450,
        size: 120000,
        mimeType: "image/jpeg",
        timestamp: "2024-01-01T00:00:00Z"
      }
    }
  ],
  "station_2": [
    {
      stationId: "station_2",
      src: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop",
      alt: "تصویر ایستگاه مترو قیطریه",
      source: "Wikimedia Commons",
      isPrimary: true,
      metadata: {
        sourceUrl: "https://unsplash.com/photos/train-station",
        author: "Test Author",
        license: "CC0",
        licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
        attribution: "No attribution required",
        description: "Generic metro station for testing",
        width: 800,
        height: 600,
        size: 200000,
        mimeType: "image/jpeg",
        timestamp: "2024-01-01T00:00:00Z"
      }
    }
  ],
  "station_3": [
    {
      stationId: "station_3",
      src: "https://images.unsplash.com/photo-1519817914152-22d216bb9170?w=800&h=600&fit=crop",
      alt: "تصویر ایستگاه مترو شهید صدر",
      source: "Wikimedia Commons",
      isPrimary: true,
      metadata: {
        sourceUrl: "https://unsplash.com/photos/subway-station",
        author: "Test Author",
        license: "CC0",
        licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
        attribution: "No attribution required",
        description: "Modern subway station",
        width: 800,
        height: 600,
        size: 180000,
        mimeType: "image/jpeg",
        timestamp: "2024-01-01T00:00:00Z"
      }
    }
  ],
  "station_74": [
    {
      stationId: "station_74",
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Abdol-Abad_Metro_Station.jpg/800px-Abdol-Abad_Metro_Station.jpg",
      alt: "تصویر ایستگاه مترو عبدل آباد",
      source: "Wikimedia Commons",
      isPrimary: true,
      metadata: {
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Abdol-Abad_Metro_Station.jpg",
        author: "Wikimedia Contributor",
        license: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        attribution: "Attribution required",
        description: "Abdol-Abad Metro Station",
        width: 800,
        height: 600,
        size: 160000,
        mimeType: "image/jpeg",
        timestamp: "2024-01-01T00:00:00Z"
      }
    }
  ],
  "station_128": [
    {
      stationId: "station_128",
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Ashrafi_Esfahani_Metro_Station_1.jpg/800px-Ashrafi_Esfahani_Metro_Station_1.jpg",
      alt: "تصویر ایستگاه مترو شهید اشرفی اصفهانی",
      source: "Wikimedia Commons",
      isPrimary: true,
      metadata: {
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Ashrafi_Esfahani_Metro_Station_1.jpg",
        author: "Wikimedia Contributor",
        license: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        attribution: "Attribution required",
        description: "Ashrafi Esfahani Metro Station",
        width: 800,
        height: 600,
        size: 170000,
        mimeType: "image/jpeg",
        timestamp: "2024-01-01T00:00:00Z"
      }
    }
  ]
};

// Add some more stations for testing
const additionalStations = [4, 5, 6, 7, 8, 9, 10];
const unsplashImages = [
  "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957",
  "https://images.unsplash.com/photo-1519817914152-22d216bb9170",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
  "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957",
  "https://images.unsplash.com/photo-1519817914152-22d216bb9170",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba"
];

additionalStations.forEach((stationNum, index) => {
  const stationId = `station_${stationNum}`;
  const imageIndex = index % unsplashImages.length;
  
  stationImages[stationId] = [
    {
      stationId,
      src: `${unsplashImages[imageIndex]}?w=800&h=600&fit=crop`,
      alt: `تصویر ایستگاه مترو ${stationNum}`,
      source: "Wikimedia Commons",
      isPrimary: true,
      metadata: {
        sourceUrl: "https://unsplash.com/photos/metro-station",
        author: "Test Author",
        license: "CC0",
        licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
        attribution: "No attribution required",
        description: "Test metro station image",
        width: 800,
        height: 600,
        size: 150000,
        mimeType: "image/jpeg",
        timestamp: "2024-01-01T00:00:00Z"
      }
    }
  ];
});

export default stationImages;