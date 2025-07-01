// ArcGIS imports - using CDN loader
// import * as projectOperator from '@arcgis/core/geometry/operators/projectOperator';
// import SpatialReference from '@arcgis/core/geometry/SpatialReference';
// import Point from '@arcgis/core/geometry/Point';
// import SceneLayer from '@arcgis/core/layers/SceneLayer';
// import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
// import ElevationLayer from '@arcgis/core/layers/ElevationLayer';
// import Graphic from '@arcgis/core/Graphic';
// import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
// import ObjectSymbol3DLayer from '@arcgis/core/symbols/ObjectSymbol3DLayer';
// import PointSymbol3D from '@arcgis/core/symbols/PointSymbol3D';

import { DigitalTwinModel } from '../App';

export interface GeospatialCoordinates {
  latitude: number;
  longitude: number;
  elevation?: number;
  spatialReference?: string;
}

export interface SceneLayerConfig {
  url: string;
  title: string;
  visible: boolean;
  opacity: number;
}

export interface ModelPlacement {
  model: DigitalTwinModel;
  coordinates: GeospatialCoordinates;
  scale: number;
  rotation: {
    x: number;
    y: number;
    z: number;
  };
}

export class GeospatialService {
  private static instance: GeospatialService;
  private modelPlacements: Map<string, ModelPlacement> = new Map();
  private sceneLayers: SceneLayerConfig[] = [];

  private constructor() { }

  public static getInstance(): GeospatialService {
    if (!GeospatialService.instance) {
      GeospatialService.instance = new GeospatialService();
    }
    return GeospatialService.instance;
  }

  /**
   * Convert geographic coordinates to web mercator projection
   */
  public async convertToWebMercator(
    coordinates: GeospatialCoordinates
  ): Promise<GeospatialCoordinates> {
    try {
      // TODO: Replace with actual ArcGIS projection conversion
      /*
      const point = new Point({
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
        z: coordinates.elevation || 0,
        spatialReference: SpatialReference.WGS84
      });

      const projectedPoint = await projectOperator.project(
        point,
        SpatialReference.WebMercator
      ) as Point;

      return {
        latitude: projectedPoint.y,
        longitude: projectedPoint.x,
        elevation: projectedPoint.z,
        spatialReference: 'Web Mercator'
      };
      */

      // Placeholder implementation
      return {
        ...coordinates,
        spatialReference: 'Web Mercator (placeholder)'
      };
    } catch (error) {
      console.error('Error converting coordinates:', error);
      throw error;
    }
  }

  /**
   * Place a 3D model at specific geographic coordinates
   */
  public placeModelAtLocation(
    model: DigitalTwinModel,
    coordinates: GeospatialCoordinates,
    options: {
      scale?: number;
      rotation?: { x: number; y: number; z: number };
    } = {}
  ): ModelPlacement {
    const placement: ModelPlacement = {
      model,
      coordinates,
      scale: options.scale || 1.0,
      rotation: options.rotation || { x: 0, y: 0, z: 0 }
    };

    this.modelPlacements.set(model.id, placement);
    return placement;
  }

  /**
   * Get all model placements
   */
  public getModelPlacements(): ModelPlacement[] {
    return Array.from(this.modelPlacements.values());
  }

  /**
   * Get model placement by ID
   */
  public getModelPlacement(modelId: string): ModelPlacement | undefined {
    return this.modelPlacements.get(modelId);
  }

  /**
   * Remove model placement
   */
  public removeModelPlacement(modelId: string): boolean {
    return this.modelPlacements.delete(modelId);
  }

  /**
   * Create ArcGIS graphics for model markers
   */
  public createModelGraphics(models: DigitalTwinModel[]): any[] {
    // TODO: Replace with actual ArcGIS graphics creation
    /*
    return models
      .filter(model => model.coordinates)
      .map(model => {
        const point = new Point({
          longitude: model.coordinates!.longitude,
          latitude: model.coordinates!.latitude,
          z: model.coordinates!.elevation || 0
        });

        const symbol = new PointSymbol3D({
          symbolLayers: [
            new ObjectSymbol3DLayer({
              width: 10,
              height: 10,
              depth: 10,
              resource: { primitive: 'cube' },
              material: { color: [0, 100, 255, 0.8] }
            })
          ]
        });

        return new Graphic({
          geometry: point,
          symbol: symbol,
          attributes: {
            modelId: model.id,
            name: model.name,
            type: model.type
          }
        });
      });
    */

    // Placeholder implementation
    return models
      .filter(model => model.coordinates)
      .map(model => ({
        modelId: model.id,
        name: model.name,
        coordinates: model.coordinates,
        type: 'placeholder-graphic'
      }));
  }

  /**
   * Add scene layer for 3D building data
   */
  public addSceneLayer(config: SceneLayerConfig): void {
    this.sceneLayers.push(config);
  }

  /**
   * Get all scene layers
   */
  public getSceneLayers(): SceneLayerConfig[] {
    return this.sceneLayers;
  }

  /**
   * Calculate distance between two geographic points
   */
  public calculateDistance(
    point1: GeospatialCoordinates,
    point2: GeospatialCoordinates
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Find models within a specified radius of a point
   */
  public findModelsNearLocation(
    center: GeospatialCoordinates,
    radiusMeters: number,
    models: DigitalTwinModel[]
  ): DigitalTwinModel[] {
    return models.filter(model => {
      if (!model.coordinates) return false;

      const distance = this.calculateDistance(center, model.coordinates);
      return distance <= radiusMeters;
    });
  }

  /**
   * Get elevation at a specific location
   */
  public async getElevationAtLocation(
    coordinates: GeospatialCoordinates
  ): Promise<number> {
    try {
      // Use ArcGIS World Elevation service
      const elevationLayer = new ElevationLayer({
        url: "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
      });

      const queryPoint = new Point({
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
        spatialReference: { wkid: 4326 }
      });

      const result = await elevationLayer.queryElevation(queryPoint);
      return result.geometry.z || 0;
    } catch (error) {
      console.error('Error getting elevation:', error);
      // Fallback to approximate elevation based on location
      return this.getApproximateElevation(coordinates);
    }
  }

  /**
   * Get approximate elevation when ArcGIS service is unavailable
   */
  private getApproximateElevation(coordinates: GeospatialCoordinates): number {
    // Simple approximation based on latitude (very rough)
    // In a real implementation, you might use a local DEM or other fallback
    const lat = Math.abs(coordinates.latitude);
    if (lat > 60) return 200; // Arctic/Antarctic regions
    if (lat > 45) return 500; // Temperate regions
    if (lat > 30) return 300; // Subtropical regions
    return 100; // Tropical regions
  }

  /**
   * Convert local 3D model coordinates to geographic coordinates
   */
  public localToGeographic(
    localCoords: { x: number; y: number; z: number },
    origin: GeospatialCoordinates,
    scale: number = 1
  ): GeospatialCoordinates {
    // Simple approximation - in reality, this would need proper coordinate transformation
    const metersPerDegree = 111320; // Approximate meters per degree at equator

    return {
      latitude: origin.latitude + (localCoords.y * scale) / metersPerDegree,
      longitude: origin.longitude + (localCoords.x * scale) / (metersPerDegree * Math.cos(origin.latitude * Math.PI / 180)),
      elevation: (origin.elevation || 0) + (localCoords.z * scale)
    };
  }

  /**
   * Convert geographic coordinates to local 3D model coordinates
   */
  public geographicToLocal(
    geoCoords: GeospatialCoordinates,
    origin: GeospatialCoordinates,
    scale: number = 1
  ): { x: number; y: number; z: number } {
    const metersPerDegree = 111320;

    return {
      x: ((geoCoords.longitude - origin.longitude) * metersPerDegree * Math.cos(origin.latitude * Math.PI / 180)) / scale,
      y: ((geoCoords.latitude - origin.latitude) * metersPerDegree) / scale,
      z: ((geoCoords.elevation || 0) - (origin.elevation || 0)) / scale
    };
  }
}

// Export singleton instance
export const geospatialService = GeospatialService.getInstance();
