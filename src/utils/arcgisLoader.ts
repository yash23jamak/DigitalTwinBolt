// ArcGIS CDN Module Loader
// This utility helps load ArcGIS modules from the CDN when using Vite

declare global {
  interface Window {
    require: any;
  }
}

export interface ArcGISModules {
  Map: any;
  MapView: any;
  SceneView: any;
  Basemap: any;
  FeatureLayer: any;
  GraphicsLayer: any;
  Graphic: any;
  Point: any;
  Polygon: any;
  Polyline: any;
  Circle: any;
  SimpleMarkerSymbol: any;
  PointSymbol3D: any;
  ObjectSymbol3DLayer: any;
  LayerList: any;
  Measurement: any;
  DirectLineMeasurement3D: any;
  AreaMeasurement3D: any;
  Popup: any;
  geometryEngine: any;
  projectOperator: any;
  SpatialReference: any;
  SceneLayer: any;
  ElevationLayer: any;
  ImageryLayer: any;
  TileLayer: any;
  Layer: any;
}

// Helper function to add widgets to the map
export const addMapWidgets = async (view: any, modules: ArcGISModules) => {
  try {
    const { LayerList, Measurement, DirectLineMeasurement3D, AreaMeasurement3D } = modules;

    // Add layer list if available
    if (LayerList) {
      const layerList = new LayerList({
        view: view
      });
      view.ui.add(layerList, 'top-right');
    }

    // Add measurement widgets if available
    if (view.type === '2d' && Measurement) {
      const measurement = new Measurement({
        view: view
      });
      view.ui.add(measurement, 'top-left');
    } else if (view.type === '3d') {
      // Add 3D measurement tools if available
      if (DirectLineMeasurement3D) {
        const directLineMeasurement = new DirectLineMeasurement3D({
          view: view
        });
        view.ui.add(directLineMeasurement, 'top-left');
      }

      if (AreaMeasurement3D) {
        const areaMeasurement = new AreaMeasurement3D({
          view: view
        });
        view.ui.add(areaMeasurement, {
          position: 'top-left',
          index: 1
        });
      }
    }

  } catch (error) {
    console.error('Error adding map widgets:', error);
  }
};

let arcgisModulesCache: ArcGISModules | null = null;

export async function loadArcGISModules(): Promise<ArcGISModules> {
  if (arcgisModulesCache) {
    return arcgisModulesCache;
  }

  return new Promise((resolve, reject) => {
    // Wait for ArcGIS API to be available
    const checkArcGIS = () => {
      if (window.require) {
        loadModules(resolve, reject);
      } else {
        // Wait a bit more for ArcGIS API to load
        setTimeout(checkArcGIS, 100);
      }
    };

    checkArcGIS();
  });
}

function loadModules(resolve: (value: ArcGISModules) => void, reject: (reason: Error) => void) {
  // Load essential modules only (excluding problematic ones like Locator)
  const moduleList = [
    'esri/Map',
    'esri/views/MapView',
    'esri/views/SceneView',
    'esri/Basemap',
    'esri/layers/GraphicsLayer',
    'esri/Graphic',
    'esri/geometry/Point'
  ];

  window.require(moduleList, (...modules: any[]) => {
    const [EsriMap, MapView, SceneView, Basemap, GraphicsLayer, Graphic, Point] = modules;

    // Create a basic module cache with essential modules
    arcgisModulesCache = {
      Map: EsriMap,
      MapView,
      SceneView,
      Basemap,
      FeatureLayer: null, // Will be loaded on demand
      GraphicsLayer,
      ImageryLayer: null,
      TileLayer: null,
      SceneLayer: null,
      ElevationLayer: null,
      Layer: null,
      Graphic,
      Point,
      Polygon: null,
      Polyline: null,
      Circle: null,
      SpatialReference: null,
      geometryEngine: null,
      projectOperator: null,
      SimpleMarkerSymbol: null,
      PointSymbol3D: null,
      ObjectSymbol3DLayer: null,
      LayerList: null,
      Measurement: null,
      DirectLineMeasurement3D: null,
      AreaMeasurement3D: null,
      Popup: null
    };

    // Load additional modules asynchronously
    loadAdditionalModules();

    resolve(arcgisModulesCache);
  }, (error: any) => {
    reject(new Error(`Failed to load core ArcGIS modules: ${error.message || error}`));
  });
};

// Helper function to load additional modules after core modules are loaded
function loadAdditionalModules() {
  if (!window.require || !arcgisModulesCache) return;

  // Load symbols
  window.require(['esri/symbols/SimpleMarkerSymbol'], (SimpleMarkerSymbol: any) => {
    if (arcgisModulesCache) arcgisModulesCache.SimpleMarkerSymbol = SimpleMarkerSymbol;
  });

  // Load widgets
  window.require([
    'esri/widgets/LayerList'
  ], (LayerList: any) => {
    if (arcgisModulesCache) {
      arcgisModulesCache.LayerList = LayerList;
    }
  });

  // Load measurement widgets
  window.require([
    'esri/widgets/Measurement',
    'esri/widgets/DirectLineMeasurement3D',
    'esri/widgets/AreaMeasurement3D'
  ], (Measurement: any, DirectLineMeasurement3D: any, AreaMeasurement3D: any) => {
    if (arcgisModulesCache) {
      arcgisModulesCache.Measurement = Measurement;
      arcgisModulesCache.DirectLineMeasurement3D = DirectLineMeasurement3D;
      arcgisModulesCache.AreaMeasurement3D = AreaMeasurement3D;
    }
  });
}

// Helper function to check if ArcGIS API is available
export function isArcGISAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.require;
}

// Helper function to load ArcGIS Map Components (for search functionality)
export function loadMapComponents() {
  // Load the ArcGIS Map Components for modern search functionality
  if (typeof window !== 'undefined' && !window.customElements.get('arcgis-search')) {
    const script = document.createElement('script');
    script.src = 'https://js.arcgis.com/map-components/4.28/arcgis-map-components.esm.js';
    script.type = 'module';
    document.head.appendChild(script);
  }
}