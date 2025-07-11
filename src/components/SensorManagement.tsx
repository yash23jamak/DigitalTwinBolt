import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Settings,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Download,
  Upload,
  MoreVertical,
  Thermometer,
  Zap,
  Droplets,
  Wind,
  Gauge
} from 'lucide-react';
import { Sensor, SensorFormData, SensorFilters } from '../types/sensor';
import { DigitalTwinModel } from '../types';
import { sensorService } from '../services/sensorService';
import { SensorModal } from './SensorModal';
import { formatDate, formatTimestamp } from '../utils/formatters';
import { palette, responsive } from '../styles/palette';

interface SensorManagementProps {
  models: DigitalTwinModel[];
}

export const SensorManagement: React.FC<SensorManagementProps> = ({ models }) => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [filteredSensors, setFilteredSensors] = useState<Sensor[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);
  
  const [filters, setFilters] = useState<SensorFilters>({
    search: '',
    type: '',
    status: '',
    modelId: ''
  });

  const [sortField, setSortField] = useState<keyof Sensor>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    loadSensors();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sensors, filters, sortField, sortOrder]);

  const loadSensors = async () => {
    try {
      setIsLoading(true);
      const [sensorsData, stats] = await Promise.all([
        sensorService.getAllSensors(),
        Promise.resolve(sensorService.getSensorStatistics())
      ]);
      setSensors(sensorsData);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading sensors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...sensors];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(sensor =>
        sensor.name.toLowerCase().includes(searchLower) ||
        sensor.type.toLowerCase().includes(searchLower) ||
        sensor.manufacturer?.toLowerCase().includes(searchLower) ||
        sensor.model?.toLowerCase().includes(searchLower) ||
        sensor.serialNumber?.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (filters.type) {
      filtered = filtered.filter(sensor => sensor.type === filters.type);
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(sensor => sensor.status === filters.status);
    }

    // Apply model filter
    if (filters.modelId) {
      filtered = filtered.filter(sensor => sensor.modelId === filters.modelId);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredSensors(filtered);
  };

  const handleCreateSensor = () => {
    setSelectedSensor(null);
    setIsModalOpen(true);
  };

  const handleEditSensor = (sensor: Sensor) => {
    setSelectedSensor(sensor);
    setIsModalOpen(true);
  };

  const handleDeleteSensor = async (sensor: Sensor) => {
    if (window.confirm(`Are you sure you want to delete sensor "${sensor.name}"?`)) {
      await sensorService.deleteSensor(sensor.id);
      loadSensors();
    }
  };

  const handleSensorSave = async (data: SensorFormData) => {
    try {
      if (selectedSensor) {
        await sensorService.updateSensor(selectedSensor.id, data);
      } else {
        await sensorService.createSensor(data);
      }
      setIsModalOpen(false);
      loadSensors();
    } catch (error) {
      console.error('Error saving sensor:', error);
    }
  };

  const handleStatusChange = async (sensor: Sensor, status: Sensor['status']) => {
    await sensorService.updateSensorStatus(sensor.id, status);
    loadSensors();
  };

  const handleCalibrate = async (sensor: Sensor) => {
    await sensorService.calibrateSensor(sensor.id);
    loadSensors();
  };

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature': return <Thermometer className="w-4 h-4" />;
      case 'humidity': return <Droplets className="w-4 h-4" />;
      case 'pressure': return <Gauge className="w-4 h-4" />;
      case 'vibration': return <Activity className="w-4 h-4" />;
      case 'power': return <Zap className="w-4 h-4" />;
      case 'flow': return <Wind className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'inactive': return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
      case 'error': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'maintenance': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-3 h-3" />;
      case 'inactive': return <Clock className="w-3 h-3" />;
      case 'error': return <AlertTriangle className="w-3 h-3" />;
      case 'maintenance': return <Wrench className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-2 text-white">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading sensors...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            Sensor Management
          </h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">
            Manage IoT sensors across all digital twin models
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            onClick={handleCreateSensor}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm md:text-base"
          >
            <Plus className="w-4 h-4" />
            <span>Add Sensor</span>
          </button>
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm">
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Sensors</p>
                <p className="text-2xl font-bold text-white">{statistics.totalSensors}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active</p>
                <p className="text-2xl font-bold text-green-400">{statistics.activeSensors}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Maintenance</p>
                <p className="text-2xl font-bold text-yellow-400">{statistics.maintenanceSensors}</p>
              </div>
              <Wrench className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Error</p>
                <p className="text-2xl font-bold text-red-400">{statistics.errorSensors}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Inactive</p>
                <p className="text-2xl font-bold text-gray-400">{statistics.inactiveSensors}</p>
              </div>
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search sensors..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-blue-500/50 focus:outline-none"
            />
          </div>
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="temperature">Temperature</option>
            <option value="humidity">Humidity</option>
            <option value="pressure">Pressure</option>
            <option value="vibration">Vibration</option>
            <option value="flow">Flow</option>
            <option value="power">Power</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="error">Error</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <select
            value={filters.modelId}
            onChange={(e) => setFilters(prev => ({ ...prev, modelId: e.target.value }))}
            className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
          >
            <option value="">All Models</option>
            {models.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sensors Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Sensor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredSensors.map((sensor) => {
                const model = models.find(m => m.id === sensor.modelId);
                return (
                  <tr key={sensor.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                            {getSensorIcon(sensor.type)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{sensor.name}</div>
                          <div className="text-xs text-slate-400">{sensor.serialNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {sensor.type}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-white">{model?.name || 'Unknown'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(sensor.status)}`}>
                        {getStatusIcon(sensor.status)}
                        <span className="capitalize">{sensor.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-white">
                        {sensor.value.toFixed(1)} {sensor.unit}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-slate-400">
                        {formatTimestamp(sensor.updatedAt)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditSensor(sensor)}
                          className="p-1 hover:bg-slate-600/50 rounded transition-colors text-slate-400 hover:text-white"
                          title="Edit Sensor"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCalibrate(sensor)}
                          className="p-1 hover:bg-slate-600/50 rounded transition-colors text-slate-400 hover:text-white"
                          title="Calibrate Sensor"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSensor(sensor)}
                          className="p-1 hover:bg-red-500/20 rounded transition-colors text-slate-400 hover:text-red-400"
                          title="Delete Sensor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredSensors.length === 0 && (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-medium text-white mb-2">No sensors found</h3>
            <p className="text-slate-400">
              {filters.search || filters.type || filters.status || filters.modelId
                ? 'Try adjusting your filters'
                : 'Create your first sensor to get started'
              }
            </p>
          </div>
        )}
      </div>

      {/* Sensor Modal */}
      <SensorModal
        sensor={selectedSensor}
        models={models}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSensorSave}
      />
    </div>
  );
};