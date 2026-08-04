/**
 * Metro Data Module - Main Exports
 */

// Domain Models
export * from '../domain/MetroStation';
export * from '../domain/MetroLine';
export * from '../domain/MetroConnection';
export * from '../domain/MetroRoute';

// Raw Data Interfaces
export * from './RawStationData';

// Services
export * from '../services/DataParserService';
export * from '../services/ValidationService';
export * from '../services/MetroDataService';

// Utilities
export * from '../utils/DataLoader';

/**
 * Default export for the main data service
 */
export { MetroDataService } from '../services/MetroDataService';

/**
 * Helper function to create and initialize MetroDataService
 */
export async function createMetroDataService(data?: any): Promise<MetroDataService> {
  const service = new MetroDataService();
  
  if (data) {
    await service.initialize(data);
  }
  
  return service;
}

/**
 * Metro Data Types
 */
export type {
  // From domain
  MetroStation,
  MetroLine,
  MetroConnection,
  MetroRoute,
  
  // From services
  ValidationResult,
  InitializationResult,
  SystemStatistics,
  ExportedData,
  
  // From raw data
  RawStationData,
  RawStation,
} from './index';

/**
 * Constants
 */
export { LINE_COLORS, LINE_NAMES, COMMON_INTERCHANGES } from './RawStationData';