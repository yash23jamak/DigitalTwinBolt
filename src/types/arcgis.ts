// ArcGIS API Types
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

// Map Click Event Types
export interface MapClickEvent {
  mapPoint: {
    longitude: number;
    latitude: number;
  };
}
