import { DigitalTwinModel, GeospatialCoordinates } from './models';

// Spatial Analysis Types
export interface BufferAnalysisResult {
  center: GeospatialCoordinates;
  radiusMeters: number;
  modelsInBuffer: DigitalTwinModel[];
  bufferGeometry: any; // Will be ArcGIS Polygon geometry
  area: number; // in square meters
}

export interface ProximityAnalysisResult {
  sourceModel: DigitalTwinModel;
  nearbyModels: Array<{
    model: DigitalTwinModel;
    distance: number;
    bearing: number;
  }>;
  averageDistance: number;
  closestModel: DigitalTwinModel | null;
  farthestModel: DigitalTwinModel | null;
}

export interface TerrainAnalysisResult {
  location: GeospatialCoordinates;
  elevation: number;
  slope: number; // in degrees
  aspect: number; // in degrees (0-360)
  visibility: {
    visible: boolean;
    viewshed: any; // Will be ArcGIS Polygon geometry
  };
}

export interface SpatialQuery {
  geometry: any; // ArcGIS geometry
  spatialRelationship: 'intersects' | 'contains' | 'within' | 'touches' | 'crosses';
  returnGeometry: boolean;
  outFields: string[];
}
