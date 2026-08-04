# Tehran Metro Data Architecture

A clean, scalable TypeScript architecture for Tehran Metro data management following SOLID principles and feature-based organization.

## Overview

This architecture provides a robust foundation for building Tehran Metro applications with:

- **Strongly typed** domain models
- **Comprehensive validation** and data integrity checks
- **Scalable service layer** with SOLID principles
- **Feature-based** organization for maintainability
- **Production-ready** error handling and logging

## Architecture Structure

```
src/
├── data/                    # Raw data interfaces and exports
│   ├── RawStationData.ts   # Raw JSON structure definitions
│   └── index.ts            # Main exports
├── domain/                 # Core business models
│   ├── MetroStation.ts     # Station domain model
│   ├── MetroLine.ts        # Line domain model  
│   ├── MetroConnection.ts  # Connection domain model
│   └── MetroRoute.ts       # Route domain model
├── services/               # Business logic layer
│   ├── DataParserService.ts  # Raw data to domain conversion
│   ├── ValidationService.ts  # Data integrity validation
│   └── MetroDataService.ts   # Main data service
├── utils/                  # Helper utilities
│   └── DataLoader.ts      # Data loading utilities
└── demo/                  # Demonstration code
    └── MetroDemo.ts      # Architecture demonstration
```

## Domain Models

### MetroStation
Represents a metro station with:
- Stable unique ID generation
- Multi-language support (English, Farsi)
- Geographic coordinates
- Line associations
- Comprehensive amenity tracking
- Connected station references

### MetroLine  
Represents a metro line with:
- Line metadata (names, colors, descriptions)
- Ordered station sequences
- Operational information
- Technical specifications
- Interchange station tracking

### MetroConnection
Represents connections between stations with:
- Travel metrics (distance, time)
- Operational constraints
- Geographic information
- Line associations

### MetroRoute
Represents complete routes between stations with:
- Station and connection sequences
- Route summaries and metrics
- Alternative routes
- Transfer information

## Services

### DataParserService
Converts raw JSON data into clean domain models:
- Generates stable IDs for stations
- Normalizes data formats
- Creates connections from relations
- Builds line metadata

### ValidationService
Ensures data integrity with:
- Raw data validation
- Domain model validation  
- Data consistency checks
- Graph connectivity analysis
- Quality scoring

### MetroDataService
Main service orchestrating all operations:
- Initialization and data loading
- Query operations (search, filtering, location-based)
- Statistical analysis
- Data export capabilities

## Key Features

### Data Integrity
- Comprehensive validation at every stage
- Automatic issue detection and reporting
- Data quality scoring
- Consistency checks

### Scalability
- Feature-based architecture
- SOLID principle compliance
- Easy extensibility for new features
- Efficient querying patterns

### Type Safety
- Full TypeScript support
- Strict type definitions
- Compile-time error checking
- Auto-completion and documentation

### Production Readiness
- Error handling and logging
- Performance considerations
- Memory efficiency
- Export/import capabilities

## Usage Examples

### Basic Initialization
```typescript
import { MetroDataService, DataLoader } from './data';

// Load raw data
const rawData = await DataLoader.loadRawStationData();

// Create and initialize service
const metroService = new MetroDataService();
const result = await metroService.initialize(rawData);

if (result.success) {
  console.log(`Loaded ${result.stats?.stations} stations`);
}
```

### Querying Stations
```typescript
// Get all stations
const allStations = metroService.getAllStations();

// Search by name
const searchResults = metroService.searchStations('shahid');

// Get stations with specific amenities
const wifiStations = metroService.getStationsWithAmenities({ freeWifi: true });

// Get stations near location
const nearbyStations = metroService.getStationsNearLocation(35.6892, 51.3890, 5);
```

### System Analysis
```typescript
// Get system statistics
const stats = metroService.getSystemStatistics();
console.log(`Average amenities: ${stats.averageAmenitiesPerStation}`);

// Get interchange stations
const interchanges = metroService.getInterchangeStations();

// Get terminal stations
const terminals = metroService.getTerminalStations();
```

## Data Quality

The architecture includes comprehensive data quality monitoring:

1. **Validation Reports**: Detailed reports on data issues
2. **Quality Scoring**: 0-100 score based on data integrity
3. **Issue Tracking**: Automatic detection of common problems
4. **Consistency Checks**: Ensures graph connectivity and relationships

## Extending the Architecture

### Adding New Features
1. Create new domain models in `domain/`
2. Add corresponding services in `services/`
3. Update validation rules in `ValidationService`
4. Add exports to `data/index.ts`

### Custom Data Sources
1. Implement custom `DataLoader` methods
2. Add transformation logic in `DataParserService`
3. Update validation for new data formats
4. Test with sample data

## Performance Considerations

- Efficient data structures for querying
- Lazy loading where appropriate
- Memory-efficient storage
- Optimized graph algorithms for routing

## Future Enhancements

1. **Routing Algorithms**: Implement Dijkstra/A* for pathfinding
2. **Real-time Data**: Integrate live service status
3. **Caching Layer**: Add Redis or similar for performance
4. **GraphQL API**: Expose data via GraphQL endpoint
5. **Analytics Dashboard**: Data visualization and insights

## Development

Run the demo to see the architecture in action:
```bash
npm run demo
```

Or import and use directly:
```typescript
import { runMetroDemo } from './demo/MetroDemo';
await runMetroDemo();
```

## License

This architecture is part of the Tehran Metro application and follows the project's licensing terms.