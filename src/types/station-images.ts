/**
 * Station Image Types
 * Defines types for Wikimedia Commons image metadata
 */

export interface WikimediaImageMetadata {
  /** Wikimedia Commons file name */
  fileName: string;
  
  /** Image source URL on Wikimedia Commons */
  sourceUrl: string;
  
  /** Direct image URL (original size) */
  imageUrl: string;
  
  /** Author/creator of the image */
  author: string;
  
  /** License type (e.g., "CC BY-SA 4.0") */
  license: string;
  
  /** License URL */
  licenseUrl: string;
  
  /** Attribution requirement text */
  attribution: string;
  
  /** File description */
  description: string;
  
  /** Original width in pixels */
  width: number;
  
  /** Original height in pixels */
  height: number;
  
  /** File size in bytes */
  size: number;
  
  /** MIME type */
  mimeType: string;
  
  /** Upload timestamp */
  timestamp: string;
}

export interface StationImage {
  /** Station ID (matches station.id) */
  stationId: string;
  
  /** Local image path (e.g., "/stations/tajrish.webp") */
  src: string;
  
  /** Alt text for accessibility */
  alt: string;
  
  /** Source information */
  source: "Wikimedia Commons";
  
  /** Metadata from Wikimedia */
  metadata: Omit<WikimediaImageMetadata, 'fileName' | 'imageUrl'>;
  
  /** Whether this is the primary image for the station */
  isPrimary: boolean;
}

export interface StationImageMap {
  [stationId: string]: StationImage[];
}

export interface ImageFetchResult {
  stationId: string;
  stationName: string;
  stationNameFa: string;
  candidateImages: WikimediaImageMetadata[];
  selectedImage?: WikimediaImageMetadata;
  error?: string;
}

export interface FetchStats {
  totalStations: number;
  imagesFound: number;
  imagesDownloaded: number;
  imagesRejected: number;
  stationsWithoutImage: number;
  licenseIssues: number;
  errors: number;
}

/**
 * License validation rules
 */
export const ACCEPTABLE_LICENSES = [
  "CC BY-SA 4.0",
  "CC BY-SA 3.0",
  "CC BY-SA 2.0",
  "CC BY 4.0",
  "CC BY 3.0",
  "CC BY 2.0",
  "CC0",
  "Public Domain",
  "GFDL",
  "CC BY-SA",
  "CC BY"
] as const;

export type AcceptableLicense = typeof ACCEPTABLE_LICENSES[number];

/**
 * Wikimedia API configuration
 */
export interface WikimediaConfig {
  baseUrl: string;
  category: string;
  apiUrl: string;
  userAgent: string;
  rateLimitDelay: number; // ms
  maxImagesPerStation: number;
  minImageWidth: number;
  minImageHeight: number;
  maxFileSize: number; // bytes
}

export const DEFAULT_CONFIG: WikimediaConfig = {
  baseUrl: "https://commons.wikimedia.org",
  category: "Category:Tehran_Metro_stations",
  apiUrl: "https://commons.wikimedia.org/w/api.php",
  userAgent: "TehranMetroApp/1.0 (https://github.com/tehran-metro-app)",
  rateLimitDelay: 1000, // 1 second between requests
  maxImagesPerStation: 10,
  minImageWidth: 800,
  minImageHeight: 600,
  maxFileSize: 10 * 1024 * 1024, // 10MB
};