import React, { useEffect, useRef, useState, useCallback } from 'react';

// ArcGIS CDN loader
import { loadArcGISModules, ArcGISModules, addMapWidgets } from '../utils/arcgisLoader';

import { ArcGISMapProps, MapSettings } from '../types';
import { GeospatialModelManager } from './GeospatialModelManager';
import { ViewSyncControls } from './ViewSyncControls';
import { SpatialAnalysisTools } from './SpatialAnalysisTools';
import { RealTimeDataVisualization } from './RealTimeDataVisualization';
import { MapControls } from './MapControls';
import { MapLoadingState } from './MapLoadingState';
import { ModelInfoPanel } from './ModelInfoPanel';
import { mapModelSyncService } from '../services/mapModelSyncService';
import { layerManagementService } from '../services/layerManagementService';
import { identifyService } from '../services/identifyService';
import { notificationService } from '../services/notificationService';
import { DEFAULT_MAP_CENTER, DEFAULT_SCENE_CAMERA } from '../utils/constants';



export const ArcGISMap: React.FC<ArcGISMapProps> = ({
  models,
  selectedModel,
  onModelSelect,
  onLocationSelect,
  onModelUpdate
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<any>(null);
  const mapRef2 = useRef<any>(null);
  const graphicsLayerRef = useRef<any>(null);
  const isInitializingRef = useRef(false);
  const isDestroyedRef = useRef(false);

  const [arcgisModules, setArcgisModules] = useState<ArcGISModules | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mapSettings, setMapSettings] = useState<MapSettings>({
    basemap: 'streets',
    viewType: '2d',
    showModels: true,
    showAnalysis: false
  });

  // Cleanup function
  const cleanup = useCallback(() => {
    if (isDestroyedRef.current) return;

    isDestroyedRef.current = true;

    try {
      // Clear graphics layer
      if (graphicsLayerRef.current) {
        graphicsLayerRef.current.removeAll();
        graphicsLayerRef.current = null;
      }

      // Destroy view
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }

      // Clear map reference
      mapRef2.current = null;
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, []);

  // Sync service integration
  useEffect(() => {
    const handleMapClick = (coordinates: { latitude: number; longitude: number }) => {
      const nearbyModels = mapModelSyncService.findNearbyModels(coordinates, models, 500);
      mapModelSyncService.handleLocationClick(coordinates, nearbyModels);
      onLocationSelect(coordinates);
    };

    // Simulate map click handling (replace with actual ArcGIS click handler)
    const mapElement = mapRef.current;
    if (mapElement && !isDestroyedRef.current) {
      const clickHandler = (event: MouseEvent) => {
        // This is a placeholder - in real implementation, convert screen coordinates to geo coordinates
        const rect = mapElement.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        // Convert to approximate coordinates (placeholder calculation)
        const lat = 34.0522 + (0.5 - y) * 0.1;
        const lng = -118.2437 + (x - 0.5) * 0.1;

        handleMapClick({ latitude: lat, longitude: lng });
      };

      mapElement.addEventListener('click', clickHandler);
      return () => {
        if (mapElement) {
          mapElement.removeEventListener('click', clickHandler);
        }
      };
    }
  }, [models, onLocationSelect]);

  // Initialize ArcGIS Map
  useEffect(() => {
    if (!mapRef.current || isInitializingRef.current || isDestroyedRef.current) return;

    const initializeMap = async () => {
      try {
        isInitializingRef.current = true;
        isDestroyedRef.current = false;
        setIsLoading(true);

        // Load ArcGIS modules
        const modules = await loadArcGISModules();
        if (isDestroyedRef.current) return;

        setArcgisModules(modules);

        const { Map: EsriMap, MapView, SceneView, GraphicsLayer } = modules;

        // Create the map with the selected basemap
        const map = new EsriMap({
          basemap: mapSettings.basemap
        });

        // Create graphics layer for model markers
        const modelsLayer = new GraphicsLayer({
          title: 'Digital Twin Models'
        });
        map.add(modelsLayer);
        graphicsLayerRef.current = modelsLayer;

        // Create the appropriate view (2D or 3D)
        const view = mapSettings.viewType === '3d'
          ? new SceneView({
            container: mapRef.current!,
            map: map,
            camera: {
              position: {
                x: DEFAULT_SCENE_CAMERA.position.x,
                y: DEFAULT_SCENE_CAMERA.position.y,
                z: DEFAULT_SCENE_CAMERA.position.z
              },
              tilt: DEFAULT_SCENE_CAMERA.tilt
            }
          })
          : new MapView({
            container: mapRef.current!,
            map: map,
            center: [DEFAULT_MAP_CENTER.longitude, DEFAULT_MAP_CENTER.latitude],
            zoom: DEFAULT_MAP_CENTER.zoom
          });

        if (isDestroyedRef.current) {
          view.destroy();
          return;
        }

        viewRef.current = view;
        mapRef2.current = map;

        // Add click handler for location selection
        interface MapClickEvent {
          mapPoint: {
            longitude: number;
            latitude: number;
          };
        }

        view.on('click', (event: MapClickEvent) => {
          if (isDestroyedRef.current) return;

          const { longitude, latitude } = event.mapPoint;
          if (
            longitude !== null &&
            latitude !== null &&
            longitude !== undefined &&
            latitude !== undefined
          ) {
            onLocationSelect({ latitude, longitude });
          }
        });

        // Wait for view to be ready
        await view.when();

        if (isDestroyedRef.current) {
          view.destroy();
          return;
        }

        // Initialize services
        layerManagementService.initialize(map, view);
        identifyService.initialize(view);

        // Add widgets
        await addMapWidgets(view, modules);

        setIsLoading(false);
        isInitializingRef.current = false;

        console.log('ArcGIS Map initialized successfully');
        notificationService.success(
          'Map Initialized',
          `ArcGIS ${mapSettings.viewType.toUpperCase()} map loaded successfully`
        );

      } catch (error) {
        console.error('Error initializing ArcGIS Map:', error);
        setIsLoading(false);
        isInitializingRef.current = false;
        notificationService.error(
          'Map Initialization Failed',
          'Failed to load ArcGIS map. Please check your connection and try again.'
        );
      }
    };

    initializeMap();

    return cleanup;
  }, [mapSettings.basemap, mapSettings.viewType, cleanup]);

  // Add model markers to map
  useEffect(() => {
    if (!graphicsLayerRef.current || !models.length || !arcgisModules || isDestroyedRef.current) return;

    const { Point, SimpleMarkerSymbol, Graphic } = arcgisModules;

    try {
      // Clear existing graphics
      graphicsLayerRef.current.removeAll();

      // Add model markers to the graphics layer
      models.forEach(model => {
        if (model.coordinates && !isDestroyedRef.current) {
          const point = new Point({
            longitude: model.coordinates.longitude,
            latitude: model.coordinates.latitude
          });

          // Create symbol if SimpleMarkerSymbol is available, otherwise use basic symbol
          const symbol = SimpleMarkerSymbol ? new SimpleMarkerSymbol({
            color: selectedModel?.id === model.id ? [255, 0, 0] : [0, 100, 255],
            size: selectedModel?.id === model.id ? 12 : 8,
            outline: {
              color: [255, 255, 255],
              width: 2
            }
          }) : {
            type: "simple-marker",
            color: selectedModel?.id === model.id ? [255, 0, 0] : [0, 100, 255],
            size: selectedModel?.id === model.id ? 12 : 8,
            outline: {
              color: [255, 255, 255],
              width: 2
            }
          };

          const graphic = new Graphic({
            geometry: point,
            symbol: symbol,
            attributes: {
              modelId: model.id,
              name: model.name,
              type: model.type
            },
            popupTemplate: {
              title: model.name,
              content: `
                <div>
                  <p><strong>Type:</strong> ${model.type}</p>
                  <p><strong>Location:</strong> ${model.coordinates.latitude.toFixed(6)}, ${model.coordinates.longitude.toFixed(6)}</p>
                  ${model.coordinates.elevation ? `<p><strong>Elevation:</strong> ${model.coordinates.elevation}m</p>` : ''}
                </div>
              `
            }
          });

          if (!isDestroyedRef.current) {
            graphicsLayerRef.current.add(graphic);
          }
        }
      });
    } catch (error) {
      console.error('Error adding model markers:', error);
    }

  }, [models, selectedModel, onModelSelect, arcgisModules]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleBasemapChange = (basemap: MapSettings['basemap']) => {
    setMapSettings((prev: MapSettings): MapSettings => ({ ...prev, basemap }));

    // Update the map basemap immediately if map is loaded
    if (mapRef2.current && !isDestroyedRef.current) {
      mapRef2.current.basemap = basemap;
    }
  };

  const toggleViewType = () => {
    setMapSettings((prev: MapSettings) => ({
      ...prev,
      viewType: prev.viewType === '2d' ? '3d' : '2d'
    }));
  };



  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'} bg-slate-900`}>
      {/* Map Controls */}
      <MapControls
        mapSettings={mapSettings}
        isFullscreen={isFullscreen}
        modelCount={models.filter(m => m.coordinates).length}
        onBasemapChange={handleBasemapChange}
        onToggleViewType={toggleViewType}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      >
        {/* Loading State */}
        <MapLoadingState isLoading={isLoading} viewType={mapSettings.viewType} />
        {/* ArcGIS Map will be rendered here */}
      </div>

      {/* View Sync Controls */}
      <div className="absolute top-4 right-4 z-10 w-80 mt-20">
        <ViewSyncControls
          models={models}
          selectedModel={selectedModel}
          currentView="gis"
          onModelSelect={onModelSelect}
        />
      </div>

      {/* Spatial Analysis Tools */}
      <div className="absolute top-4 right-4 z-10 w-80 mt-96">
        <SpatialAnalysisTools
          models={models}
          selectedModel={selectedModel}
          onLocationSelect={onLocationSelect}
        />
      </div>

      {/* Geospatial Model Manager */}
      <div className="absolute bottom-4 left-4 z-10 w-96 max-h-96 overflow-y-auto">
        <GeospatialModelManager
          models={models}
          selectedModel={selectedModel}
          onModelUpdate={onModelUpdate}
        />
      </div>

      {/* Real-time Data Visualization */}
      <div className="absolute top-4 left-4 z-10 w-80">
        <RealTimeDataVisualization
          models={models}
          selectedModel={selectedModel}
        />
      </div>

      {/* Model Info Panel */}
      <ModelInfoPanel selectedModel={selectedModel} />
    </div>
  );
};