import { Sensor, SensorFormData } from '../types/sensor';
import { DigitalTwinModel } from '../types';
import { generateId } from '../utils/helpers';
import { notificationService } from './notificationService';

class SensorService {
  private static instance: SensorService;
  private sensors: Map<string, Sensor> = new Map();

  private constructor() {
    this.initializeMockData();
  }

  public static getInstance(): SensorService {
    if (!SensorService.instance) {
      SensorService.instance = new SensorService();
    }
    return SensorService.instance;
  }

  private initializeMockData(): void {
    const mockSensors: Sensor[] = [
      {
        id: 'sensor-001',
        name: 'Temperature Sensor A1',
        type: 'temperature',
        modelId: 'model-001',
        deviceId: 'device-001',
        position: { x: 10, y: 5, z: 2 },
        coordinates: { latitude: 34.0522, longitude: -118.2437, elevation: 10 },
        status: 'active',
        value: 23.5,
        unit: '°C',
        minValue: -40,
        maxValue: 85,
        warningThreshold: 70,
        criticalThreshold: 80,
        manufacturer: 'SensorTech',
        model: 'ST-T100',
        serialNumber: 'ST001234',
        installationDate: new Date('2024-01-15'),
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        createdBy: 'admin'
      },
      {
        id: 'sensor-002',
        name: 'Vibration Monitor B2',
        type: 'vibration',
        modelId: 'model-001',
        position: { x: 15, y: 8, z: 3 },
        coordinates: { latitude: 34.0525, longitude: -118.2440, elevation: 15 },
        status: 'active',
        value: 2.1,
        unit: 'mm/s',
        minValue: 0,
        maxValue: 10,
        warningThreshold: 6,
        criticalThreshold: 8,
        manufacturer: 'VibeTech',
        model: 'VT-V200',
        serialNumber: 'VT002345',
        installationDate: new Date('2024-02-01'),
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date(),
        createdBy: 'admin'
      },
      {
        id: 'sensor-003',
        name: 'Pressure Gauge C3',
        type: 'pressure',
        modelId: 'model-002',
        position: { x: 5, y: 12, z: 1 },
        status: 'maintenance',
        value: 1013.25,
        unit: 'hPa',
        minValue: 800,
        maxValue: 1200,
        warningThreshold: 1100,
        criticalThreshold: 1150,
        manufacturer: 'PressurePro',
        model: 'PP-P300',
        serialNumber: 'PP003456',
        installationDate: new Date('2024-01-20'),
        lastMaintenance: new Date('2024-03-01'),
        nextMaintenance: new Date('2024-06-01'),
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date(),
        createdBy: 'admin'
      }
    ];

    mockSensors.forEach(sensor => this.sensors.set(sensor.id, sensor));
  }

  public async getAllSensors(): Promise<Sensor[]> {
    return Array.from(this.sensors.values());
  }

  public async getSensorById(id: string): Promise<Sensor | null> {
    return this.sensors.get(id) || null;
  }

  public async getSensorsByModel(modelId: string): Promise<Sensor[]> {
    return Array.from(this.sensors.values()).filter(sensor => sensor.modelId === modelId);
  }

  public async createSensor(data: SensorFormData): Promise<Sensor> {
    const sensor: Sensor = {
      id: generateId(),
      ...data,
      status: 'active',
      value: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user' // In real app, get from auth context
    };

    this.sensors.set(sensor.id, sensor);

    notificationService.success(
      'Sensor Created',
      `Sensor "${sensor.name}" has been created successfully.`
    );

    return sensor;
  }

  public async updateSensor(id: string, data: Partial<SensorFormData>): Promise<Sensor | null> {
    const sensor = this.sensors.get(id);
    if (!sensor) {
      notificationService.error('Sensor Not Found', `Sensor with ID ${id} not found.`);
      return null;
    }

    const updatedSensor: Sensor = {
      ...sensor,
      ...data,
      updatedAt: new Date()
    };

    this.sensors.set(id, updatedSensor);

    notificationService.success(
      'Sensor Updated',
      `Sensor "${updatedSensor.name}" has been updated successfully.`
    );

    return updatedSensor;
  }

  public async deleteSensor(id: string): Promise<boolean> {
    const sensor = this.sensors.get(id);
    if (!sensor) {
      notificationService.error('Sensor Not Found', `Sensor with ID ${id} not found.`);
      return false;
    }

    this.sensors.delete(id);

    notificationService.success(
      'Sensor Deleted',
      `Sensor "${sensor.name}" has been deleted successfully.`
    );

    return true;
  }

  public async updateSensorStatus(id: string, status: Sensor['status']): Promise<boolean> {
    const sensor = this.sensors.get(id);
    if (!sensor) return false;

    sensor.status = status;
    sensor.updatedAt = new Date();
    this.sensors.set(id, sensor);

    notificationService.info(
      'Sensor Status Updated',
      `Sensor "${sensor.name}" status changed to ${status}.`
    );

    return true;
  }

  public async calibrateSensor(id: string): Promise<boolean> {
    const sensor = this.sensors.get(id);
    if (!sensor) return false;

    sensor.calibrationDate = new Date();
    sensor.updatedAt = new Date();
    this.sensors.set(id, sensor);

    notificationService.success(
      'Sensor Calibrated',
      `Sensor "${sensor.name}" has been calibrated successfully.`
    );

    return true;
  }

  public getSensorStatistics() {
    const sensors = Array.from(this.sensors.values());
    const totalSensors = sensors.length;
    const activeSensors = sensors.filter(s => s.status === 'active').length;
    const inactiveSensors = sensors.filter(s => s.status === 'inactive').length;
    const maintenanceSensors = sensors.filter(s => s.status === 'maintenance').length;
    const errorSensors = sensors.filter(s => s.status === 'error').length;

    const sensorsByType = sensors.reduce((acc, sensor) => {
      acc[sensor.type] = (acc[sensor.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSensors,
      activeSensors,
      inactiveSensors,
      maintenanceSensors,
      errorSensors,
      sensorsByType
    };
  }
}

export const sensorService = SensorService.getInstance();