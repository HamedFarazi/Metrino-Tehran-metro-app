/**
 * Core Metro System Types
 * Production-grade TypeScript definitions for Tehran Metro
 */

// ─── Line Colors ──────────────────────────────────────────────────────────────

export const LINE_COLORS: Record<number, string> = {
  1: "#E0001F",  // Red
  2: "#2F4389",  // Blue
  3: "#67C5F5",  // Light Blue
  4: "#F8E100",  // Yellow
  5: "#8B47AC",  // Purple
  6: "#F97316",  // Orange
  7: "#7F0B74",  // Dark Purple
} as const;

export const LINE_NAMES_FA: Record<number, string> = {
  1: "خط ۱ (قرمز)",
  2: "خط ۲ (آبی)",
  3: "خط ۳ (آبی روشن)",
  4: "خط ۴ (زرد)",
  5: "خط ۵ (بنفش)",
  6: "خط ۶ (نارنجی)",
  7: "خط ۷ (بنفش تیره)",
} as const;

export const LINE_NAMES_EN: Record<number, string> = {
  1: "Line 1 (Red)",
  2: "Line 2 (Blue)",
  3: "Line 3 (Light Blue)",
  4: "Line 4 (Yellow)",
  5: "Line 5 (Purple)",
  6: "Line 6 (Orange)",
  7: "Line 7 (Dark Purple)",
} as const;

// ─── Station Amenities ────────────────────────────────────────────────────────

export interface StationAmenities {
  restroom: boolean;
  coffeeShop: boolean;
  groceryStore: boolean;
  fastFood: boolean;
  cleanFood: boolean;
  atm: boolean;
  elevator: boolean;
  bicycleParking: boolean;
  waterCooler: boolean;
  creditTicketSales: boolean;
  blindPath: boolean;
  waitingChair: boolean;
  fireSuppressionSystem: boolean;
  fireExtinguisher: boolean;
  metroPolice: boolean;
  camera: boolean;
  trashCan: boolean;
  smokingArea: boolean;
  petsAllowed: boolean;
  freeWifi: boolean;
  prayerRoom: boolean;
}

export type AmenityKey = keyof StationAmenities;

export interface AmenityMeta {
  key: AmenityKey;
  labelFa: string;
  labelEn: string;
  icon: string;
  category: "food" | "service" | "accessibility" | "safety" | "comfort";
}

export const AMENITY_META: AmenityMeta[] = [
  { key: "atm", labelFa: "خودپرداز", labelEn: "ATM", icon: "💳", category: "service" },
  { key: "restroom", labelFa: "سرویس بهداشتی", labelEn: "Restroom", icon: "🚻", category: "comfort" },
  { key: "coffeeShop", labelFa: "کافه", labelEn: "Coffee Shop", icon: "☕", category: "food" },
  { key: "fastFood", labelFa: "فست‌فود", labelEn: "Fast Food", icon: "🍔", category: "food" },
  { key: "cleanFood", labelFa: "غذای سالم", labelEn: "Clean Food", icon: "🥗", category: "food" },
  { key: "groceryStore", labelFa: "فروشگاه", labelEn: "Grocery", icon: "🛒", category: "food" },
  { key: "elevator", labelFa: "آسانسور", labelEn: "Elevator", icon: "🛗", category: "accessibility" },
  { key: "blindPath", labelFa: "مسیر نابینایان", labelEn: "Blind Path", icon: "♿", category: "accessibility" },
  { key: "bicycleParking", labelFa: "پارکینگ دوچرخه", labelEn: "Bike Parking", icon: "🚲", category: "service" },
  { key: "freeWifi", labelFa: "وای‌فای رایگان", labelEn: "Free WiFi", icon: "📶", category: "service" },
  { key: "prayerRoom", labelFa: "نمازخانه", labelEn: "Prayer Room", icon: "🕌", category: "comfort" },
  { key: "metroPolice", labelFa: "پلیس مترو", labelEn: "Metro Police", icon: "👮", category: "safety" },
  { key: "camera", labelFa: "دوربین مداربسته", labelEn: "CCTV", icon: "📹", category: "safety" },
  { key: "waitingChair", labelFa: "صندلی انتظار", labelEn: "Waiting Chair", icon: "🪑", category: "comfort" },
  { key: "creditTicketSales", labelFa: "فروش بلیت اعتباری", labelEn: "Credit Ticket", icon: "🎫", category: "service" },
  { key: "waterCooler", labelFa: "آبسردکن", labelEn: "Water Cooler", icon: "💧", category: "comfort" },
];

// ─── Station ──────────────────────────────────────────────────────────────────

export interface Station {
  id: string;
  name: string;               // English
  nameFa: string;             // Farsi
  lines: number[];
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  colors: string[];
  isDisabled: boolean;
  amenities: StationAmenities;
  connectedStationIds: string[];
  type: StationType;
}

export type StationType = "regular" | "interchange" | "terminal" | "major";

// ─── Line ─────────────────────────────────────────────────────────────────────

export interface Line {
  id: number;
  nameFa: string;
  nameEn: string;
  color: string;
  stationIds: string[];
  stationCount: number;
  interchangeStationIds: string[];
}

// ─── Connection ───────────────────────────────────────────────────────────────

export interface Connection {
  id: string;
  fromStationId: string;
  toStationId: string;
  lineIds: number[];
  distanceKm: number;
  travelTimeMin: number;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export interface RouteSegment {
  fromStation: Station;
  toStation: Station;
  lineId: number;
  stationCount: number;
}

export interface RouteTransfer {
  atStation: Station;
  fromLineId: number;
  toLineId: number;
  transferTimeMin: number;
}

export interface Route {
  id: string;
  origin: Station;
  destination: Station;
  segments: RouteSegment[];
  transfers: RouteTransfer[];
  totalStations: number;
  totalTimeMin: number;
  totalDistanceKm: number;
  transferCount: number;
  stationSequence: Station[];
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchResult {
  station: Station;
  score: number;
  matchedOn: "name" | "nameFa" | "address" | "line";
  highlights: string[];
}

// ─── App State ────────────────────────────────────────────────────────────────

export interface RouteQuery {
  originId: string | null;
  destinationId: string | null;
}

export type AppTab = "home" | "search" | "map" | "favorites";

export type MapMode = "offline" | "online";

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export interface FavoriteStation {
  stationId: string;
  label?: string;
  addedAt: number;
}

export interface RecentRoute {
  originId: string;
  destinationId: string;
  usedAt: number;
}
