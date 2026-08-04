/**
 * Raw station data interface matching the current JSON structure
 * This represents the exact format of data/stations.json
 */
export interface RawStationData {
  [stationName: string]: RawStation;
}

/**
 * Individual raw station from JSON file
 */
export interface RawStation {
  name: string;
  translations: {
    fa: string;
  };
  lines: number[];
  longitude: number;
  latitude: number;
  address: string;
  colors: string[];
  disabled: boolean;
  wc: boolean;
  coffeeShop: boolean;
  groceryStore: boolean;
  fastFood: boolean;
  atm: boolean;
  elevator: boolean;
  bicycleParking: boolean;
  waterCooler: null; // Note: Should be boolean but is null in data
  cleanFood: boolean;
  blindPath: boolean;
  fireSuppressionSystem: boolean;
  fireExtinguisher: boolean;
  metroPolice: boolean;
  creditTicketSales: boolean;
  waitingChair: boolean;
  camera: boolean;
  trashCan: boolean;
  smoking: boolean;
  petsAllowed: boolean;
  freeWifi: boolean;
  prayerRoom: boolean;
  relations: string[];
}

/**
 * Line color mapping for Tehran Metro
 */
export const LINE_COLORS: Record<number, string> = {
  1: '#E0001F', // Red
  2: '#2F4389', // Blue
  3: '#67C5F5', // Light Blue
  4: '#F8E100', // Yellow
  5: '#8B47AC', // Purple
  6: '#F97316', // Orange
  7: '#7F0B74', // Dark Purple
};

/**
 * Line names in English and Farsi
 */
export const LINE_NAMES: Record<number, { en: string; fa: string }> = {
  1: { en: 'Line 1 (Red Line)', fa: 'خط ۱ (خط قرمز)' },
  2: { en: 'Line 2 (Blue Line)', fa: 'خط ۲ (خط آبی)' },
  3: { en: 'Line 3 (Light Blue Line)', fa: 'خط ۳ (خط آبی روشن)' },
  4: { en: 'Line 4 (Yellow Line)', fa: 'خط ۴ (خط زرد)' },
  5: { en: 'Line 5 (Purple Line)', fa: 'خط ۵ (خط بنفش)' },
  6: { en: 'Line 6 (Orange Line)', fa: 'خط ۶ (خط نارنجی)' },
  7: { en: 'Line 7 (Dark Purple Line)', fa: 'خط ۷ (خط بنفش تیره)' },
};

/**
 * Common interchange stations identified from data
 */
export const COMMON_INTERCHANGES = [
  'Shahid Beheshti',     // Lines 1 & 3
  'Darvazeh Dolat',      // Lines 1 & 4
  'Imam Khomeini',       // Lines 1 & 2
  'Meydan-e Mohammadiyeh', // Lines 1 & 7
  'Shohada-ye Haftom-e Tir', // Lines 1 & 6
  'Sohrevardi',          // Lines 3 & 7
  'Mirza-ye Shirazi',    // Lines 3 & 4
  'Meydan-e Shohada',    // Lines 2 & 4
  'Teatre Shahr',        // Lines 4 & 6
  'Daneshgah-e Elm-o Sanat', // Lines 4 & 6
] as const;