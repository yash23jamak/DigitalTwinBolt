import React, { useState, useEffect } from 'react';
import {
  Activity,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  AlertTriangle,
  CheckCircle,
  Clock,
  Thermometer,
  Zap,
  Droplets,
  Wind,
  Bell,
  BellOff,
  Eye,
  EyeOff
} from 'lucide-react';
import { DigitalTwinModel } from '../App';
import {
  realTimeDataService,
  IoTDevice,
  SensorData,
  Alert
} from '../services/realTimeDataService';

interface RealTimeDataVisualizationProps {
  models: DigitalTwinModel[];
  selectedModel: DigitalTwinModel | null;
}

export const RealTimeDataVisualization: React.FC<RealTimeDataVisualizationProps> = ({
  models,
  selectedModel
}) => {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [showAlerts, setShowAlerts] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to real-time data
    const unsubscribeData = realTimeDataService.subscribeToData((data) => {
      setSensorData(data);
    });

    const unsubscribeAlerts = realTimeDataService.subscribeToAlerts((alert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 49)]); // Keep last 50 alerts
    });

    // Initial data load
    setDevices(realTimeDataService.getDevices());
    setAlerts(realTimeDataService.getAlerts());
    setStatistics(realTimeDataService.getStatistics());

    // Update statistics periodically
    const statsInterval = setInterval(() => {
      setStatistics(realTimeDataService.getStatistics());
    }, 5000);

    return () => {
      unsubscribeData();
      unsubscribeAlerts();
      clearInterval(statsInterval);
    };
  }, []);

  const getSensorIcon = (sensorType: string) => {
    switch (sensorType) {
      case 'temperature':
        return <Thermometer className="w-4 h-4" />;
      case 'humidity':
        return <Droplets className="w-4 h-4" />;
      case 'pressure':
        return <Wind className="w-4 h-4" />;
      case 'vibration':
        return <Activity className="w-4 h-4" />;
      case 'power':
        return <Zap className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getSensorColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'critical':
        return 'text-red-400';
      case 'offline':
        return 'text-slate-400';
      default:
        return 'text-slate-400';
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'high':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'critical':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(timestamp);
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    realTimeDataService.acknowledgeAlert(alertId);
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const filteredDevices = selectedModel
    ? devices.filter(device => device.modelId === selectedModel.id)
    : devices;

  const recentSensorData = sensorData.slice(0, 10); // Show last 10 readings
  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);

  return (
    <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-green-400" />
          <h3 className="font-medium text-white">Real-time Data</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className={`p-1 rounded transition-colors ${showAlerts
                ? 'bg-blue-500/20 text-blue-400'
                : 'hover:bg-slate-700/50 text-slate-400 hover:text-white'
              }`}
            title={showAlerts ? 'Hide Alerts' : 'Show Alerts'}
          >
            {showAlerts ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700/30 p-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-slate-400 text-sm">Devices</span>
              </div>
              <div className="text-white font-medium">
                {statistics.onlineDevices}/{statistics.totalDevices} Online
              </div>
            </div>
            <div className="bg-slate-700/30 p-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-slate-400 text-sm">Sensors</span>
              </div>
              <div className="text-white font-medium">{statistics.totalSensors} Active</div>
            </div>
            <div className="bg-slate-700/30 p-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-slate-400 text-sm">Alerts</span>
              </div>
              <div className="text-white font-medium">{statistics.unacknowledgedAlerts} Pending</div>
            </div>
            <div className="bg-slate-700/30 p-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Bell className="w-4 h-4 text-red-400" />
                <span className="text-slate-400 text-sm">Critical</span>
              </div>
              <div className="text-white font-medium">{statistics.criticalAlerts}</div>
            </div>
          </div>
        )}

        {/* Device List */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Wifi className="w-4 h-4 text-blue-400" />
            <span className="text-white font-medium">IoT Devices</span>
            <span className="text-slate-400 text-sm">({filteredDevices.length})</span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {filteredDevices.map(device => (
              <div
                key={device.id}
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${selectedDevice === device.id
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : 'border-slate-600/50 bg-slate-700/30 hover:bg-slate-600/30'
                  }`}
                onClick={() => setSelectedDevice(selectedDevice === device.id ? null : device.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {device.status === 'online' ? (
                      <Wifi className="w-3 h-3 text-green-400" />
                    ) : (
                      <WifiOff className="w-3 h-3 text-red-400" />
                    )}
                    <span className="text-white text-sm font-medium">{device.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {device.batteryLevel && (
                      <div className="flex items-center space-x-1">
                        <Battery className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-400">{device.batteryLevel}%</span>
                      </div>
                    )}
                    {device.signalStrength && (
                      <div className="flex items-center space-x-1">
                        <Signal className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-400">{device.signalStrength}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedDevice === device.id && device.sensors.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-600/50">
                    <div className="space-y-1">
                      {device.sensors.map(sensor => (
                        <div key={sensor.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1">
                            <div className={getSensorColor(sensor.status)}>
                              {getSensorIcon(sensor.sensorType)}
                            </div>
                            <span className="text-slate-400 capitalize">{sensor.sensorType}</span>
                          </div>
                          <div className="text-white">
                            {sensor.value.toFixed(1)} {sensor.unit}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sensor Data */}
        {recentSensorData.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-white font-medium">Live Data Stream</span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {recentSensorData.map(data => (
                <div key={data.id} className="flex items-center justify-between p-2 bg-slate-700/30 rounded text-xs">
                  <div className="flex items-center space-x-2">
                    <div className={getSensorColor(data.status)}>
                      {getSensorIcon(data.sensorType)}
                    </div>
                    <span className="text-slate-400 capitalize">{data.sensorType}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">
                      {data.value.toFixed(1)} {data.unit}
                    </span>
                    <span className="text-slate-500">{formatTimestamp(data.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts */}
        {showAlerts && unacknowledgedAlerts.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-white font-medium">Active Alerts</span>
              <span className="text-slate-400 text-sm">({unacknowledgedAlerts.length})</span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {unacknowledgedAlerts.slice(0, 5).map(alert => (
                <div
                  key={alert.id}
                  className={`p-2 rounded-lg border ${getAlertColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{alert.message}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {formatTimestamp(alert.timestamp)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="ml-2 p-1 hover:bg-white/10 rounded transition-colors"
                      title="Acknowledge Alert"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
