/**
 * Metro Route Domain Model
 * Represents a complete route between two stations
 */
export interface MetroRoute {
  /** Unique route identifier */
  id: string;
  
  /** Source station ID */
  originStationId: string;
  
  /** Destination station ID */
  destinationStationId: string;
  
  /** Ordered list of stations in the route */
  stationSequence: RouteStation[];
  
  /** Ordered list of connections between stations */
  connectionSequence: RouteConnection[];
  
  /** Route summary metrics */
  summary: RouteSummary;
  
  /** Alternative routes (if available) */
  alternatives: MetroRoute[];
  
  /** Route constraints and preferences */
  constraints: RouteConstraints;
  
  /** Metadata */
  metadata: {
    calculatedAt: Date;
    algorithm: RoutingAlgorithm;
    calculationTime: number; // milliseconds
  };
}

/**
 * Station in a route with context
 */
export interface RouteStation {
  /** Station ID */
  stationId: string;
  
  /** Position in route sequence (0-based) */
  sequence: number;
  
  /** Action at this station */
  action: StationAction;
  
  /** Estimated arrival time */
  estimatedArrival?: Date;
  
  /** Estimated departure time */
  estimatedDeparture?: Date;
  
  /** Wait time at station in minutes */
  waitTime?: number;
  
  /** Platform information (if available) */
  platform?: string;
  
  /** Notes for passenger */
  passengerNotes: string[];
}

/**
 * Connection in a route with context
 */
export interface RouteConnection {
  /** Connection ID */
  connectionId: string;
  
  /** Position in route sequence (0-based) */
  sequence: number;
  
  /** From station ID */
  fromStationId: string;
  
  /** To station ID */
  toStationId: string;
  
  /** Lines used for this segment */
  lineIds: number[];
  
  /** Travel metrics for this segment */
  travelMetrics: {
    distance: number;
    travelTime: number;
    estimatedStartTime?: Date;
    estimatedEndTime?: Date;
  };
  
  /** Transfer information (if applicable) */
  transfer?: TransferInfo;
  
  /** Notes for passenger */
  passengerNotes: string[];
}

/**
 * Route summary
 */
export interface RouteSummary {
  /** Total travel time in minutes */
  totalTravelTime: number;
  
  /** Total distance in kilometers */
  totalDistance: number;
  
  /** Total number of stations */
  totalStations: number;
  
  /** Number of transfers */
  transferCount: number;
  
  /** Estimated cost */
  estimatedCost: number;
  
  /** Route complexity score (lower is simpler) */
  complexityScore: number;
  
  /** Accessibility score (higher is better) */
  accessibilityScore: number;
  
  /** Comfort score (higher is better) */
  comfortScore: number;
  
  /** Breakdown by travel type */
  breakdown: {
    /** Time spent on trains */
    trainTime: number;
    /** Time spent walking */
    walkTime: number;
    /** Time spent waiting */
    waitTime: number;
    /** Time spent transferring */
    transferTime: number;
  };
}

/**
 * Route constraints used for calculation
 */
export interface RouteConstraints {
  /** Maximum transfers allowed */
  maxTransfers?: number;
  
  /** Maximum walking distance in meters */
  maxWalkingDistance?: number;
  
  /** Accessibility requirements */
  accessibility: {
    elevatorRequired: boolean;
    escalatorRequired: boolean;
    wheelchairAccessible: boolean;
  };
  
  /** Time constraints */
  time: {
    departureTime?: Date;
    arrivalTime?: Date;
    maxTravelTime?: number;
  };
  
  /** Preference weights */
  preferences: {
    /** Weight for minimizing transfers (0-1) */
    minimizeTransfers: number;
    /** Weight for minimizing travel time (0-1) */
    minimizeTravelTime: number;
    /** Weight for minimizing walking (0-1) */
    minimizeWalking: number;
    /** Weight for maximizing comfort (0-1) */
    maximizeComfort: number;
  };
}

/**
 * Transfer information
 */
export interface TransferInfo {
  /** From line ID */
  fromLineId: number;
  
  /** To line ID */
  toLineId: number;
  
  /** Transfer station ID */
  stationId: string;
  
  /** Estimated transfer time in minutes */
  estimatedTime: number;
  
  /** Transfer type */
  type: TransferType;
  
  /** Walking distance in meters */
  walkingDistance: number;
  
  /** Whether transfer requires exiting station */
  requiresExit: boolean;
  
  /** Transfer difficulty level */
  difficulty: TransferDifficulty;
}

/**
 * Station action types
 */
export enum StationAction {
  BOARD = 'board',
  ALIGHT = 'alight',
  TRANSFER = 'transfer',
  WAIT = 'wait',
  WALK = 'walk'
}

/**
 * Transfer type classification
 */
export enum TransferType {
  CROSS_PLATFORM = 'cross_platform',
  SAME_STATION = 'same_station',
  WALKING_TRANSFER = 'walking_transfer',
  CORRIDOR_TRANSFER = 'corridor_transfer',
  EXIT_REENTER = 'exit_reenter'
}

/**
 * Transfer difficulty levels
 */
export enum TransferDifficulty {
  EASY = 'easy',
  MODERATE = 'moderate',
  DIFFICULT = 'difficult',
  VERY_DIFFICULT = 'very_difficult'
}

/**
 * Routing algorithms
 */
export enum RoutingAlgorithm {
  DIJKSTRA = 'dijkstra',
  A_STAR = 'a_star',
  YEN = 'yen', // For k-shortest paths
  BELLMAN_FORD = 'bellman_ford',
  FLOYD_WARSHALL = 'floyd_warshall',
  BFS = 'bfs',
  DFS = 'dfs'
}

/**
 * Route comparison result
 */
export interface RouteComparison {
  routeId: string;
  scores: {
    time: number;
    transfers: number;
    distance: number;
    comfort: number;
    accessibility: number;
    total: number;
  };
  rank: number;
}