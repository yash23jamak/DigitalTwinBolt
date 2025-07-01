// ArcGIS imports - using CDN loader
// import Layer from '@arcgis/core/layers/Layer';
// import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
// import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
// import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
// import TileLayer from '@arcgis/core/layers/TileLayer';
// import SceneLayer from '@arcgis/core/layers/SceneLayer';
// import EsriMap from '@arcgis/core/Map';
// import MapView from '@arcgis/core/views/MapView';
// import SceneView from '@arcgis/core/views/SceneView';

export interface LayerConfig {
  id: string;
  title: string;
  type: 'feature' | 'graphics' | 'imagery' | 'tile' | 'scene';
  url?: string;
  visible: boolean;
  opacity: number;
  minScale?: number;
  maxScale?: number;
}

export interface LayerInfo {
  id: string;
  title: string;
  type: string;
  visible: boolean;
  opacity: number;
  loaded: boolean;
  error?: string;
}

export class LayerManagementService {
  private static instance: LayerManagementService;
  private map: EsriMap | null = null;
  private view: MapView | SceneView | null = null;
  private layers: Map<string, Layer> = new Map();

  private constructor() { }

  public static getInstance(): LayerManagementService {
    if (!LayerManagementService.instance) {
      LayerManagementService.instance = new LayerManagementService();
    }
    return LayerManagementService.instance;
  }

  /**
   * Initialize the service with map and view
   */
  public initialize(map: EsriMap, view: MapView | SceneView): void {
    this.map = map;
    this.view = view;
  }

  /**
   * Add a layer to the map
   */
  public async addLayer(config: LayerConfig): Promise<Layer | null> {
    if (!this.map) {
      console.error('Map not initialized');
      return null;
    }

    try {
      let layer: Layer;

      switch (config.type) {
        case 'feature':
          if (!config.url) throw new Error('URL required for feature layer');
          layer = new FeatureLayer({
            id: config.id,
            title: config.title,
            url: config.url,
            visible: config.visible,
            opacity: config.opacity,
            minScale: config.minScale,
            maxScale: config.maxScale
          });
          break;

        case 'graphics':
          layer = new GraphicsLayer({
            id: config.id,
            title: config.title,
            visible: config.visible,
            opacity: config.opacity
          });
          break;

        case 'imagery':
          if (!config.url) throw new Error('URL required for imagery layer');
          layer = new ImageryLayer({
            id: config.id,
            title: config.title,
            url: config.url,
            visible: config.visible,
            opacity: config.opacity
          });
          break;

        case 'tile':
          if (!config.url) throw new Error('URL required for tile layer');
          layer = new TileLayer({
            id: config.id,
            title: config.title,
            url: config.url,
            visible: config.visible,
            opacity: config.opacity,
            minScale: config.minScale,
            maxScale: config.maxScale
          });
          break;

        case 'scene':
          if (!config.url) throw new Error('URL required for scene layer');
          layer = new SceneLayer({
            id: config.id,
            title: config.title,
            url: config.url,
            visible: config.visible,
            opacity: config.opacity
          });
          break;

        default:
          throw new Error(`Unsupported layer type: ${config.type}`);
      }

      this.map.add(layer);
      this.layers.set(config.id, layer);

      await layer.when();
      return layer;
    } catch (error) {
      console.error('Error adding layer:', error);
      return null;
    }
  }

  /**
   * Remove a layer from the map
   */
  public removeLayer(layerId: string): boolean {
    if (!this.map) return false;

    const layer = this.layers.get(layerId);
    if (layer) {
      this.map.remove(layer);
      this.layers.delete(layerId);
      return true;
    }
    return false;
  }

  /**
   * Toggle layer visibility
   */
  public toggleLayerVisibility(layerId: string): boolean {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.visible = !layer.visible;
      return layer.visible;
    }
    return false;
  }

  /**
   * Set layer opacity
   */
  public setLayerOpacity(layerId: string, opacity: number): boolean {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.opacity = Math.max(0, Math.min(1, opacity));
      return true;
    }
    return false;
  }

  /**
   * Move layer up in the layer order
   */
  public moveLayerUp(layerId: string): boolean {
    if (!this.map) return false;

    const layer = this.layers.get(layerId);
    if (layer) {
      const currentIndex = this.map.layers.indexOf(layer);
      if (currentIndex < this.map.layers.length - 1) {
        this.map.reorder(layer, currentIndex + 1);
        return true;
      }
    }
    return false;
  }

  /**
   * Move layer down in the layer order
   */
  public moveLayerDown(layerId: string): boolean {
    if (!this.map) return false;

    const layer = this.layers.get(layerId);
    if (layer) {
      const currentIndex = this.map.layers.indexOf(layer);
      if (currentIndex > 0) {
        this.map.reorder(layer, currentIndex - 1);
        return true;
      }
    }
    return false;
  }

  /**
   * Get all layer information
   */
  public getAllLayers(): LayerInfo[] {
    const layerInfos: LayerInfo[] = [];

    this.layers.forEach((layer, id) => {
      layerInfos.push({
        id,
        title: layer.title || 'Untitled Layer',
        type: layer.type,
        visible: layer.visible,
        opacity: layer.opacity,
        loaded: layer.loaded,
        error: layer.loadError?.message
      });
    });

    return layerInfos;
  }

  /**
   * Get layer by ID
   */
  public getLayer(layerId: string): Layer | null {
    return this.layers.get(layerId) || null;
  }

  /**
   * Zoom to layer extent
   */
  public async zoomToLayer(layerId: string): Promise<boolean> {
    if (!this.view) return false;

    const layer = this.layers.get(layerId);
    if (layer && 'fullExtent' in layer && layer.fullExtent) {
      try {
        await this.view.goTo(layer.fullExtent);
        return true;
      } catch (error) {
        console.error('Error zooming to layer:', error);
      }
    }
    return false;
  }

  /**
   * Clear all layers except basemap
   */
  public clearAllLayers(): void {
    if (!this.map) return;

    this.layers.forEach((layer) => {
      this.map!.remove(layer);
    });
    this.layers.clear();
  }
}

// Export singleton instance
export const layerManagementService = LayerManagementService.getInstance();
