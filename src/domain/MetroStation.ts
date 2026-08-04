/**
 * Metro Station Domain Model
 * Represents a station in the Tehran Metro system
 */
export interface MetroStation {
  /** Unique stable identifier */
  id: string;
  
  /** English station name */
  name: string;
  
  /** Localized station names */
  translations: {
    /** Persian/Farsi name */
    fa: string;
    /** Additional languages can be added here */
    [language: string]: string;
  };
  
  /** Metro lines that pass through this station */
  lineIds: number[];
  
  /** Geographic coordinates */
  coordinates: {
    longitude: number;
    latitude: number;
  };
  
  /** Physical address */
  address: string;
  
  /** Line colors associated with this station */
  colors: string[];
  
  /** Station status */
  isDisabled: boolean;
  
  /** Amenities available at the station */
  amenities: StationAmenities;
  
  /** IDs of directly connected stations */
  connectedStationIds: string[];
  
  /** Metadata */
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    sourceId?: string; // Original ID from raw data
  };
}

/**
 * Station amenities interface
 */
export interface StationAmenities {
  /** Restroom facilities */
  restroom: boolean;
  
  /** Food and beverage */
  coffeeShop: boolean;
  groceryStore: boolean;
  fastFood: boolean;
  cleanFood: boolean;
  
  /** Services */
  atm: boolean;
  elevator: boolean;
  bicycleParking: boolean;
  waterCooler: boolean;
  creditTicketSales: boolean;
  
  /** Accessibility */
  blindPath: boolean;
  waitingChair: boolean;
  
  /** Safety and security */
  fireSuppressionSystem: boolean;
  fireExtinguisher: boolean;
  metroPolice: boolean;
  camera: boolean;
  
  /** Facilities */
  trashCan: boolean;
  smokingArea: boolean;
  petsAllowed: boolean;
  freeWifi: boolean;
  prayerRoom: boolean;
}

/**
 * Station status enum
 */
export enum StationStatus {
  ACTIVE = 'active',
  UNDER_CONSTRUCTION = 'under_construction',
  TEMPORARILY_CLOSED = 'temporarily_closed',
  PERMANENTLY_CLOSED = 'permanently_closed'
}

/**
 * Station type classification
 */
export enum StationType {
  REGULAR = 'regular',
  INTERCHANGE = 'interchange',
  TERMINAL = 'terminal',
  MAJOR = 'major'
}