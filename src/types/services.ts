import { DigitalTwinModel, GeospatialCoordinates } from './models';

// Real-time Data Service Types
export interface SensorData {
  id: string;
  modelId: string;
  sensorType: 'temperature' | 'humidity' | 'pressure' | 'vibration' | 'flow' | 'power';
  value: number;
  unit: string;
  timestamp: Date;
  coordinates?: GeospatialCoordinates;
  status: 'normal' | 'warning' | 'critical';
}

export interface IoTDevice {
  id: string;
  name: string;
  type: 'sensor' | 'actuator' | 'gateway';
  status: 'online' | 'offline' | 'error';
  lastSeen: Date;
  coordinates?: GeospatialCoordinates;
  modelId?: string;
  sensors: SensorData[];
  metadata?: {
    manufacturer?: string;
    model?: string;
    firmware?: string;
    batteryLevel?: number;
  };
}

export interface DataStream {
  id: string;
  name: string;
  source: 'websocket' | 'rest' | 'mqtt' | 'arcgis-stream';
  url: string;
  isActive: boolean;
  lastUpdate: Date;
  dataCount: number;
}

export interface AlertRule {
  id: string;
  name: string;
  sensorType: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'range';
  threshold: number | [number, number];
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
}

export interface Alert {
  id: string;
  ruleId: string;
  deviceId: string;
  sensorId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  acknowledged: boolean;
  coordinates?: GeospatialCoordinates;
}

export interface DataStatistics {
  totalDevices: number;
  onlineDevices: number;
  totalSensors: number;
  dataPointsToday: number;
  averageLatency: number;
}

// Identify Service Types
export interface IdentifyResult {
  layerId: string;
  layerName: string;
  feature: {
    attributes: Record<string, any>;
    geometry: any;
  };
  displayFieldName?: string;
  value?: string;
}

// Geocoding Service Types
export interface GeocodingResult {
  address: string;
  coordinates: GeospatialCoordinates;
  score: number;
  attributes?: Record<string, any>;
}

// Layer Management Types
export interface LayerInfo {
  id: string;
  title: string;
  type: string;
  visible: boolean;
  opacity: number;
  url?: string;
}

// Map Model Sync Types
export interface SyncEvent {
  type: 'model-selected' | 'location-clicked' | 'view-changed';
  data: any;
  timestamp: Date;
}

// Callback Types
export type DataCallback = (data: SensorData[]) => void;
export type AlertCallback = (alert: Alert) => void;
