/**
 * Metro Line Domain Model
 * Represents a metro line in the Tehran Metro system
 */
export interface MetroLine {
  /** Unique line number (1-7 for Tehran Metro) */
  id: number;
  
  /** Line name in different languages */
  name: {
    en: string;
    fa: string;
    [language: string]: string;
  };
  
  /** Line color in HEX format */
  color: string;
  
  /** Line description */
  description: {
    en: string;
    fa: string;
    [language: string]: string;
  };
  
  /** Stations in correct order from start to end */
  stationIds: string[];
  
  /** Line status */
  status: LineStatus;
  
  /** Operational information */
  operational: {
    /** First train time */
    firstTrain: string;
    /** Last train time */
    lastTrain: string;
    /** Peak frequency in minutes */
    peakFrequency: number;
    /** Off-peak frequency in minutes */
    offPeakFrequency: number;
    /** Whether line operates 24/7 */
    is24Hours: boolean;
  };
  
  /** Technical specifications */
  specifications: {
    /** Line length in kilometers */
    length: number;
    /** Number of stations */
    stationCount: number;
    /** Type of trains used */
    trainType: string;
    /** Year opened */
    openingYear: number;
    /** Track gauge in millimeters */
    gauge: number;
    /** Electrification system */
    electrification: string;
  };
  
  /** Interchange stations with other lines */
  interchanges: LineInterchange[];
  
  /** Metadata */
  metadata: {
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Line status enum
 */
export enum LineStatus {
  OPERATIONAL = 'operational',
  UNDER_CONSTRUCTION = 'under_construction',
  PLANNED = 'planned',
  TEMPORARILY_SUSPENDED = 'temporarily_suspended',
  EXTENSION_PLANNED = 'extension_planned'
}

/**
 * Interchange information between lines
 */
export interface LineInterchange {
  /** Station ID where interchange occurs */
  stationId: string;
  /** Connected line IDs */
  connectedLineIds: number[];
  /** Interchange type */
  type: InterchangeType;
  /** Estimated transfer time in minutes */
  transferTime: number;
  /** Whether transfer is cross-platform */
  isCrossPlatform: boolean;
}

/**
 * Interchange type classification
 */
export enum InterchangeType {
  CROSS_PLATFORM = 'cross_platform',
  SAME_STATION = 'same_station',
  WALKING_TRANSFER = 'walking_transfer',
  CORRIDOR_TRANSFER = 'corridor_transfer'
}

/**
 * Line statistics
 */
export interface LineStatistics {
  /** Daily passenger volume */
  dailyPassengers: number;
  /** Annual passenger volume */
  annualPassengers: number;
  /** Punctuality percentage */
  punctuality: number;
  /** Average speed in km/h */
  averageSpeed: number;
  /** Headway regularity */
  headwayRegularity: number;
}