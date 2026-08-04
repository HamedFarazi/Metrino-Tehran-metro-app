/**
 * Metro Connection Domain Model
 * Represents a connection between two stations in the metro graph
 */
export interface MetroConnection {
  /** Unique connection identifier */
  id: string;
  
  /** Source station ID */
  fromStationId: string;
  
  /** Destination station ID */
  toStationId: string;
  
  /** Metro lines that use this connection */
  lineIds: number[];
  
  /** Connection type */
  type: ConnectionType;
  
  /** Travel metrics */
  travelMetrics: {
    /** Distance in kilometers */
    distance: number;
    /** Estimated travel time in minutes */
    travelTime: number;
    /** Whether this is an underground segment */
    isUnderground: boolean;
    /** Number of tracks (1 for single, 2 for double) */
    tracks: number;
  };
  
  /** Operational constraints */
  constraints: {
    /** Maximum speed in km/h */
    maxSpeed: number;
    /** Whether connection allows bidirectional travel */
    isBidirectional: boolean;
    /** Operational status */
    status: ConnectionStatus;
    /** Maintenance schedule */
    maintenanceSchedule?: MaintenanceSchedule;
  };
  
  /** Geographic information */
  geography: {
    /** Starting coordinates */
    start: { longitude: number; latitude: number };
    /** Ending coordinates */
    end: { longitude: number; latitude: number };
    /** Whether connection crosses water bodies */
    crossesWater: boolean;
    /** Tunnel depth in meters (if underground) */
    tunnelDepth?: number;
  };
  
  /** Metadata */
  metadata: {
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Connection type classification
 */
export enum ConnectionType {
  REGULAR = 'regular',
  INTERCHANGE = 'interchange',
  BRANCH = 'branch',
  CROSSOVER = 'crossover',
  DEPOT_ACCESS = 'depot_access'
}

/**
 * Connection status
 */
export enum ConnectionStatus {
  ACTIVE = 'active',
  UNDER_MAINTENANCE = 'under_maintenance',
  PLANNED = 'planned',
  TEMPORARILY_CLOSED = 'temporarily_closed'
}

/**
 * Maintenance schedule
 */
export interface MaintenanceSchedule {
  /** Last maintenance date */
  lastMaintenance: Date;
  /** Next scheduled maintenance */
  nextMaintenance: Date;
  /** Maintenance frequency in days */
  frequency: number;
  /** Maintenance type */
  type: MaintenanceType;
}

/**
 * Maintenance type
 */
export enum MaintenanceType {
  ROUTINE = 'routine',
  EMERGENCY = 'emergency',
  UPGRADE = 'upgrade',
  INSPECTION = 'inspection'
}

/**
 * Connection weight for routing algorithms
 */
export interface ConnectionWeight {
  /** Time-based weight (minutes) */
  time: number;
  /** Distance-based weight (kilometers) */
  distance: number;
  /** Cost-based weight (monetary) */
  cost: number;
  /** Comfort-based weight (lower is better) */
  comfort: number;
  /** Accessibility-based weight (lower is better for accessibility) */
  accessibility: number;
}

/**
 * Connection statistics
 */
export interface ConnectionStatistics {
  /** Daily traffic volume */
  dailyTraffic: number;
  /** Average speed achieved */
  averageSpeed: number;
  /** Punctuality percentage */
  punctuality: number;
  /** Incident frequency */
  incidentFrequency: number;
}