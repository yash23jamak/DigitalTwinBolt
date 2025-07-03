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

// Fault Detection Types
export interface FaultDetectionRule {
  id: string;
  name: string;
  modelId?: string; // If null, applies to all models
  faultType: 'performance' | 'structural' | 'environmental' | 'connectivity' | 'data_quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  conditions: FaultCondition[];
  isActive: boolean;
  description: string;
  createdAt: Date;
  lastTriggered?: Date;
}

export interface FaultCondition {
  parameter: string; // e.g., 'temperature', 'vibration', 'cpu_usage', 'memory_usage'
  operator: 'gt' | 'lt' | 'eq' | 'ne' | 'between' | 'outside';
  value: number | [number, number];
  duration?: number; // Minimum duration in seconds before triggering
}

export interface DetectedFault {
  id: string;
  ruleId: string;
  modelId: string;
  faultType: 'performance' | 'structural' | 'environmental' | 'connectivity' | 'data_quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  detectedAt: Date;
  resolvedAt?: Date;
  status: 'active' | 'acknowledged' | 'resolved' | 'false_positive';
  affectedComponents: string[];
  diagnosticData: DiagnosticData;
  coordinates?: GeospatialCoordinates;
  recommendedActions: string[];
}

export interface DiagnosticData {
  parameters: Record<string, number>;
  trends: Record<string, number[]>; // Historical data for trending
  correlations: Array<{
    parameter: string;
    correlation: number;
    significance: 'low' | 'medium' | 'high';
  }>;
  rootCauseAnalysis?: {
    primaryCause: string;
    contributingFactors: string[];
    confidence: number; // 0-1
  };
}

export interface ModelHealthStatus {
  modelId: string;
  overallHealth: 'healthy' | 'warning' | 'critical' | 'offline';
  healthScore: number; // 0-100
  lastUpdated: Date;
  components: ComponentHealth[];
  activeFaults: DetectedFault[];
  performanceMetrics: PerformanceMetrics;
  predictiveInsights: PredictiveInsight[];
}

export interface ComponentHealth {
  name: string;
  type: 'sensor' | 'actuator' | 'processor' | 'network' | 'storage';
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  healthScore: number;
  lastChecked: Date;
  metrics: Record<string, number>;
}

export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
  dataProcessingRate: number;
  errorRate: number;
  uptime: number; // in hours
}

export interface PredictiveInsight {
  type: 'maintenance' | 'failure' | 'optimization' | 'capacity';
  title: string;
  description: string;
  probability: number; // 0-1
  timeframe: string; // e.g., "within 7 days"
  impact: 'low' | 'medium' | 'high' | 'critical';
  recommendedActions: string[];
}

export interface FaultDetectionStatistics {
  totalModels: number;
  healthyModels: number;
  modelsWithWarnings: number;
  criticalModels: number;
  offlineModels: number;
  totalFaults: number;
  activeFaults: number;
  resolvedFaults: number;
  averageResolutionTime: number; // in hours
  faultsByType: Record<string, number>;
  faultsBySeverity: Record<string, number>;
  mtbf: number; // Mean Time Between Failures in hours
  mttr: number; // Mean Time To Repair in hours
}

// Callback Types
export type DataCallback = (data: SensorData[]) => void;
export type AlertCallback = (alert: Alert) => void;
export type FaultCallback = (fault: DetectedFault) => void;
export type HealthStatusCallback = (status: ModelHealthStatus) => void;
