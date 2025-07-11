export interface Sensor {
  id: string;
  name: string;
  type: 'temperature' | 'humidity' | 'pressure' | 'vibration' | 'flow' | 'power' | 'voltage' | 'current' | 'acceleration' | 'gyroscope';
  modelId: string;
  deviceId?: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
    elevation?: number;
  };
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  value: number;
  unit: string;
  minValue?: number;
  maxValue?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  calibrationDate?: Date;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installationDate: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  metadata?: Record<string, any>;
}

export interface SensorFormData {
  name: string;
  type: Sensor['type'];
  modelId: string;
  deviceId?: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
    elevation?: number;
  };
  unit: string;
  minValue?: number;
  maxValue?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installationDate: Date;
  metadata?: Record<string, any>;
}

export interface SensorFilters {
  search: string;
  type: string;
  status: string;
  modelId: string;
}