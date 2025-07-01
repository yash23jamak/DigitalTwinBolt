import { DigitalTwinModel } from '../types';
import {
  SensorData,
  IoTDevice,
  DataStream,
  AlertRule,
  Alert,
  DataStatistics,
  DataCallback,
  AlertCallback
} from '../types/services';
import { generateId } from '../utils/helpers';
import { SIMULATION_INTERVAL, MAX_DATA_POINTS } from '../utils/constants';





export class RealTimeDataService {
  private static instance: RealTimeDataService;
  private devices: Map<string, IoTDevice> = new Map();
  private dataStreams: Map<string, DataStream> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private alerts: Alert[] = [];
  private dataCallbacks: DataCallback[] = [];
  private alertCallbacks: AlertCallback[] = [];
  private simulationInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeSimulation();
  }

  public static getInstance(): RealTimeDataService {
    if (!RealTimeDataService.instance) {
      RealTimeDataService.instance = new RealTimeDataService();
    }
    return RealTimeDataService.instance;
  }

  /**
   * Subscribe to real-time data updates
   */
  public subscribeToData(callback: DataCallback): () => void {
    this.dataCallbacks.push(callback);
    return () => {
      const index = this.dataCallbacks.indexOf(callback);
      if (index > -1) {
        this.dataCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to alert notifications
   */
  public subscribeToAlerts(callback: AlertCallback): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Add IoT device
   */
  public addDevice(device: IoTDevice): void {
    this.devices.set(device.id, device);
  }

  /**
   * Get all devices
   */
  public getDevices(): IoTDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * Get devices for a specific model
   */
  public getDevicesForModel(modelId: string): IoTDevice[] {
    return Array.from(this.devices.values()).filter(device => device.modelId === modelId);
  }

  /**
   * Get latest sensor data for a device
   */
  public getLatestSensorData(deviceId: string): SensorData[] {
    const device = this.devices.get(deviceId);
    return device ? device.sensors : [];
  }

  /**
   * Add data stream
   */
  public addDataStream(stream: DataStream): void {
    this.dataStreams.set(stream.id, stream);

    // TODO: Replace with actual ArcGIS stream layer implementation
    /*
    if (stream.source === 'arcgis-stream') {
      const streamLayer = new StreamLayer({
        url: stream.url,
        purgeOptions: {
          displayCount: 1000
        }
      });

      streamLayer.on('data-received', (event) => {
        const sensorData = this.parseStreamData(event.data);
        this.notifyDataCallbacks(sensorData);
      });
    }
    */
  }

  /**
   * Add alert rule
   */
  public addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  /**
   * Get all alerts
   */
  public getAlerts(): Alert[] {
    return this.alerts;
  }

  /**
   * Get unacknowledged alerts
   */
  public getUnacknowledgedAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  /**
   * Acknowledge alert
   */
  public acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  /**
   * Create ArcGIS feature layer for IoT devices
   */
  public createDeviceFeatureLayer(): any {
    // TODO: Replace with actual ArcGIS feature layer
    /*
    const deviceGraphics = Array.from(this.devices.values()).map(device => {
      const point = new Point({
        longitude: device.coordinates.longitude,
        latitude: device.coordinates.latitude,
        z: device.coordinates.elevation || 0
      });

      return new Graphic({
        geometry: point,
        attributes: {
          deviceId: device.id,
          name: device.name,
          status: device.status,
          deviceType: device.deviceType,
          batteryLevel: device.batteryLevel || 0,
          signalStrength: device.signalStrength || 0,
          lastSeen: device.lastSeen.getTime()
        }
      });
    });

    return new FeatureLayer({
      source: deviceGraphics,
      fields: [
        { name: 'deviceId', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'deviceType', type: 'string' },
        { name: 'batteryLevel', type: 'integer' },
        { name: 'signalStrength', type: 'integer' },
        { name: 'lastSeen', type: 'date' }
      ],
      objectIdField: 'deviceId',
      renderer: this.createDeviceRenderer()
    });
    */

    // Placeholder implementation
    return {
      type: 'placeholder-feature-layer',
      devices: Array.from(this.devices.values())
    };
  }

  /**
   * Get real-time statistics
   */
  public getStatistics() {
    const devices = Array.from(this.devices.values());
    const onlineDevices = devices.filter(d => d.status === 'online').length;
    const totalSensors = devices.reduce((sum, d) => sum + d.sensors.length, 0);
    const criticalAlerts = this.alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;

    return {
      totalDevices: devices.length,
      onlineDevices,
      offlineDevices: devices.length - onlineDevices,
      totalSensors,
      totalAlerts: this.alerts.length,
      unacknowledgedAlerts: this.getUnacknowledgedAlerts().length,
      criticalAlerts
    };
  }

  /**
   * Initialize simulation for demo purposes
   */
  private initializeSimulation(): void {
    // Create sample devices
    const sampleDevices: IoTDevice[] = [
      {
        id: 'device-001',
        name: 'Temperature Sensor A1',
        deviceType: 'sensor',
        coordinates: { latitude: 34.0522, longitude: -118.2437, elevation: 10 },
        status: 'online',
        lastSeen: new Date(),
        batteryLevel: 85,
        signalStrength: 92,
        sensors: []
      },
      {
        id: 'device-002',
        name: 'Vibration Monitor B2',
        deviceType: 'sensor',
        coordinates: { latitude: 34.0525, longitude: -118.2440, elevation: 15 },
        status: 'online',
        lastSeen: new Date(),
        batteryLevel: 67,
        signalStrength: 78,
        sensors: []
      },
      {
        id: 'device-003',
        name: 'Flow Meter C3',
        deviceType: 'sensor',
        coordinates: { latitude: 34.0520, longitude: -118.2435, elevation: 8 },
        status: 'offline',
        lastSeen: new Date(Date.now() - 300000), // 5 minutes ago
        batteryLevel: 23,
        signalStrength: 45,
        sensors: []
      }
    ];

    sampleDevices.forEach(device => this.addDevice(device));

    // Create sample alert rules
    const sampleRules: AlertRule[] = [
      {
        id: 'rule-001',
        name: 'High Temperature Alert',
        sensorType: 'temperature',
        condition: 'greater_than',
        threshold: 80,
        severity: 'high',
        isActive: true
      },
      {
        id: 'rule-002',
        name: 'Low Battery Alert',
        sensorType: 'power',
        condition: 'less_than',
        threshold: 20,
        severity: 'medium',
        isActive: true
      }
    ];

    sampleRules.forEach(rule => this.addAlertRule(rule));

    // Start simulation
    this.startSimulation();
  }

  /**
   * Start data simulation
   */
  private startSimulation(): void {
    this.simulationInterval = setInterval(() => {
      this.generateSimulatedData();
    }, SIMULATION_INTERVAL);
  }

  /**
   * Generate simulated sensor data
   */
  private generateSimulatedData(): void {
    const devices = Array.from(this.devices.values());
    const allSensorData: SensorData[] = [];

    devices.forEach(device => {
      if (device.status === 'online') {
        // Generate sensor data based on device type
        const sensorData: SensorData[] = [];

        if (device.name.includes('Temperature')) {
          sensorData.push({
            id: generateId(),
            modelId: device.modelId || '',
            sensorType: 'temperature',
            value: 20 + Math.random() * 60, // 20-80°C
            unit: '°C',
            timestamp: new Date(),
            coordinates: device.coordinates,
            status: 'normal'
          });
        }

        if (device.name.includes('Vibration')) {
          sensorData.push({
            id: generateId(),
            modelId: device.modelId || '',
            sensorType: 'vibration',
            value: Math.random() * 10, // 0-10 mm/s
            unit: 'mm/s',
            timestamp: new Date(),
            coordinates: device.coordinates,
            status: 'normal'
          });
        }

        if (device.name.includes('Flow')) {
          sensorData.push({
            id: `${device.id}-flow-${Date.now()}`,
            modelId: device.modelId || '',
            sensorType: 'flow',
            value: 50 + Math.random() * 100, // 50-150 L/min
            unit: 'L/min',
            timestamp: new Date(),
            coordinates: device.coordinates,
            status: 'normal'
          });
        }

        // Update device sensors
        device.sensors = sensorData;
        device.lastSeen = new Date();

        allSensorData.push(...sensorData);

        // Check for alerts
        this.checkAlerts(sensorData);
      }
    });

    // Notify callbacks
    this.notifyDataCallbacks(allSensorData);
  }

  /**
   * Check sensor data against alert rules
   */
  private checkAlerts(sensorData: SensorData[]): void {
    const rules = Array.from(this.alertRules.values()).filter(rule => rule.isActive);

    sensorData.forEach(data => {
      rules.forEach(rule => {
        if (rule.sensorType === data.sensorType) {
          let triggered = false;

          switch (rule.condition) {
            case 'greater_than':
              triggered = data.value > (rule.threshold as number);
              break;
            case 'less_than':
              triggered = data.value < (rule.threshold as number);
              break;
            // Add other conditions as needed
          }

          if (triggered) {
            const alert: Alert = {
              id: generateId(),
              ruleId: rule.id,
              deviceId: data.modelId,
              sensorId: data.id,
              message: `${rule.name}: ${data.sensorType} value ${data.value}${data.unit} exceeds threshold`,
              severity: rule.severity,
              timestamp: new Date(),
              acknowledged: false,
              coordinates: data.coordinates
            };

            this.alerts.push(alert);
            this.notifyAlertCallbacks(alert);
          }
        }
      });
    });
  }

  /**
   * Notify data callbacks
   */
  private notifyDataCallbacks(data: SensorData[]): void {
    this.dataCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in data callback:', error);
      }
    });
  }

  /**
   * Notify alert callbacks
   */
  private notifyAlertCallbacks(alert: Alert): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
  }

  /**
   * Stop simulation
   */
  public stopSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  /**
   * Cleanup
   */
  public cleanup(): void {
    this.stopSimulation();
    this.dataCallbacks = [];
    this.alertCallbacks = [];
  }
}

// Export singleton instance
export const realTimeDataService = RealTimeDataService.getInstance();
