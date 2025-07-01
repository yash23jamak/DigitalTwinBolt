// ArcGIS imports - using CDN loader
// import IdentifyTask from '@arcgis/core/tasks/IdentifyTask';
// import IdentifyParameters from '@arcgis/core/tasks/support/IdentifyParameters';
// import Point from '@arcgis/core/geometry/Point';
// import MapView from '@arcgis/core/views/MapView';
// import SceneView from '@arcgis/core/views/SceneView';
// import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
// import Graphic from '@arcgis/core/Graphic';

export interface IdentifyResult {
  layerId: string;
  layerName: string;
  feature: {
    attributes: Record<string, any>;
    geometry: any;
  };
  displayFieldName: string;
  value: string;
}

export interface PopupInfo {
  title: string;
  content: string;
  location: {
    latitude: number;
    longitude: number;
  };
  features: IdentifyResult[];
}

export class IdentifyService {
  private static instance: IdentifyService;
  private view: MapView | SceneView | null = null;

  private constructor() { }

  public static getInstance(): IdentifyService {
    if (!IdentifyService.instance) {
      IdentifyService.instance = new IdentifyService();
    }
    return IdentifyService.instance;
  }

  /**
   * Initialize the service with a view
   */
  public initialize(view: MapView | SceneView): void {
    this.view = view;
  }

  /**
   * Identify features at a point
   */
  public async identifyFeatures(
    screenPoint: { x: number; y: number },
    tolerance: number = 3
  ): Promise<IdentifyResult[]> {
    if (!this.view) {
      console.error('View not initialized');
      return [];
    }

    try {
      const results: IdentifyResult[] = [];

      // Get map point from screen point
      const mapPoint = this.view.toMap(screenPoint);

      // Identify features from feature layers
      const featureLayers = this.view.map.layers.filter(
        layer => layer.type === 'feature'
      ) as FeatureLayer[];

      for (const layer of featureLayers) {
        if (!layer.visible || !layer.url) continue;

        try {
          const identifyTask = new IdentifyTask({
            url: layer.url
          });

          const identifyParams = new IdentifyParameters({
            tolerance: tolerance,
            returnGeometry: true,
            layerIds: [0], // Assuming single layer service
            geometry: mapPoint,
            mapExtent: this.view.extent,
            width: this.view.width,
            height: this.view.height
          });

          const response = await identifyTask.execute(identifyParams);

          response.results.forEach(result => {
            results.push({
              layerId: layer.id,
              layerName: layer.title || 'Untitled Layer',
              feature: {
                attributes: result.feature.attributes,
                geometry: result.feature.geometry
              },
              displayFieldName: result.displayFieldName,
              value: result.value
            });
          });
        } catch (error) {
          console.warn(`Error identifying features in layer ${layer.title}:`, error);
        }
      }

      // Also check graphics layers
      const graphicsLayers = this.view.map.layers.filter(
        layer => layer.type === 'graphics'
      );

      for (const layer of graphicsLayers) {
        if (!layer.visible) continue;

        const graphics = (layer as any).graphics;
        graphics.forEach((graphic: Graphic) => {
          if (this.isPointInGraphic(mapPoint, graphic, tolerance)) {
            results.push({
              layerId: layer.id,
              layerName: layer.title || 'Graphics Layer',
              feature: {
                attributes: graphic.attributes || {},
                geometry: graphic.geometry
              },
              displayFieldName: 'Name',
              value: graphic.attributes?.name || 'Graphic Feature'
            });
          }
        });
      }

      return results;
    } catch (error) {
      console.error('Error identifying features:', error);
      return [];
    }
  }

  /**
   * Create popup info from identify results
   */
  public createPopupInfo(
    results: IdentifyResult[],
    location: { latitude: number; longitude: number }
  ): PopupInfo | null {
    if (results.length === 0) return null;

    const primaryResult = results[0];
    const title = primaryResult.value || 'Feature Information';

    let content = '<div class="identify-popup">';

    results.forEach((result, index) => {
      if (index > 0) {
        content += '<hr style="margin: 10px 0; border: 1px solid #ccc;">';
      }

      content += `<div class="feature-info">`;
      content += `<h4 style="margin: 0 0 8px 0; color: #0079c1;">${result.layerName}</h4>`;

      // Display attributes
      const attributes = result.feature.attributes;
      if (attributes && Object.keys(attributes).length > 0) {
        content += '<table style="width: 100%; font-size: 12px;">';
        Object.entries(attributes).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            content += `<tr><td style="font-weight: bold; padding: 2px 8px 2px 0;">${displayKey}:</td><td style="padding: 2px 0;">${value}</td></tr>`;
          }
        });
        content += '</table>';
      }

      content += '</div>';
    });

    content += '</div>';

    return {
      title,
      content,
      location,
      features: results
    };
  }

  /**
   * Show popup at location
   */
  public showPopup(popupInfo: PopupInfo): void {
    if (!this.view) return;

    const point = new Point({
      latitude: popupInfo.location.latitude,
      longitude: popupInfo.location.longitude,
      spatialReference: { wkid: 4326 }
    });

    this.view.popup.open({
      title: popupInfo.title,
      content: popupInfo.content,
      location: point
    });
  }

  /**
   * Close popup
   */
  public closePopup(): void {
    if (this.view) {
      this.view.popup.close();
    }
  }

  /**
   * Check if a point is within a graphic's geometry (simplified)
   */
  private isPointInGraphic(point: Point, graphic: Graphic, tolerance: number): boolean {
    if (!graphic.geometry) return false;

    if (graphic.geometry.type === 'point') {
      const graphicPoint = graphic.geometry as Point;
      const distance = Math.sqrt(
        Math.pow(point.x - graphicPoint.x, 2) + Math.pow(point.y - graphicPoint.y, 2)
      );
      return distance <= tolerance;
    }

    // For other geometry types, you would need more complex intersection logic
    // This is a simplified implementation
    return false;
  }

  /**
   * Get feature details for a specific layer and object ID
   */
  public async getFeatureDetails(
    layerId: string,
    objectId: number
  ): Promise<IdentifyResult | null> {
    if (!this.view) return null;

    try {
      const layer = this.view.map.findLayerById(layerId) as FeatureLayer;
      if (!layer || layer.type !== 'feature') return null;

      const query = layer.createQuery();
      query.where = `OBJECTID = ${objectId}`;
      query.returnGeometry = true;
      query.outFields = ['*'];

      const result = await layer.queryFeatures(query);
      if (result.features.length > 0) {
        const feature = result.features[0];
        return {
          layerId,
          layerName: layer.title || 'Untitled Layer',
          feature: {
            attributes: feature.attributes,
            geometry: feature.geometry
          },
          displayFieldName: layer.displayField || 'OBJECTID',
          value: feature.attributes[layer.displayField || 'OBJECTID']?.toString() || 'Feature'
        };
      }
    } catch (error) {
      console.error('Error getting feature details:', error);
    }

    return null;
  }
}

// Export singleton instance
export const identifyService = IdentifyService.getInstance();
