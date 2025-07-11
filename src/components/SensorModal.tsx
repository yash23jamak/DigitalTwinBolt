import React, { useState, useEffect } from 'react';
import { X, MapPin, Settings, Calendar, User } from 'lucide-react';
import { Sensor, SensorFormData } from '../types/sensor';
import { DigitalTwinModel } from '../types';

interface SensorModalProps {
  sensor: Sensor | null;
  models: DigitalTwinModel[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SensorFormData) => void;
}

export const SensorModal: React.FC<SensorModalProps> = ({
  sensor,
  models,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<SensorFormData>({
    name: '',
    type: 'temperature',
    modelId: '',
    deviceId: '',
    position: { x: 0, y: 0, z: 0 },
    coordinates: undefined,
    unit: '',
    minValue: undefined,
    maxValue: undefined,
    warningThreshold: undefined,
    criticalThreshold: undefined,
    manufacturer: '',
    model: '',
    serialNumber: '',
    installationDate: new Date(),
    metadata: {}
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'position' | 'thresholds' | 'details'>('basic');

  useEffect(() => {
    if (sensor) {
      setFormData({
        name: sensor.name,
        type: sensor.type,
        modelId: sensor.modelId,
        deviceId: sensor.deviceId,
        position: sensor.position,
        coordinates: sensor.coordinates,
        unit: sensor.unit,
        minValue: sensor.minValue,
        maxValue: sensor.maxValue,
        warningThreshold: sensor.warningThreshold,
        criticalThreshold: sensor.criticalThreshold,
        manufacturer: sensor.manufacturer,
        model: sensor.model,
        serialNumber: sensor.serialNumber,
        installationDate: sensor.installationDate,
        metadata: sensor.metadata || {}
      });
    } else {
      setFormData({
        name: '',
        type: 'temperature',
        modelId: models[0]?.id || '',
        deviceId: '',
        position: { x: 0, y: 0, z: 0 },
        coordinates: undefined,
        unit: '',
        minValue: undefined,
        maxValue: undefined,
        warningThreshold: undefined,
        criticalThreshold: undefined,
        manufacturer: '',
        model: '',
        serialNumber: '',
        installationDate: new Date(),
        metadata: {}
      });
    }
    setActiveTab('basic');
  }, [sensor, models, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: keyof SensorFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    setFormData(prev => ({
      ...prev,
      position: { ...prev.position, [axis]: value }
    }));
  };

  const handleCoordinatesChange = (field: 'latitude' | 'longitude' | 'elevation', value: number) => {
    setFormData(prev => ({
      ...prev,
      coordinates: {
        latitude: prev.coordinates?.latitude || 0,
        longitude: prev.coordinates?.longitude || 0,
        elevation: prev.coordinates?.elevation,
        ...{ [field]: value }
      }
    }));
  };

  const getUnitForType = (type: string) => {
    switch (type) {
      case 'temperature': return '°C';
      case 'humidity': return '%';
      case 'pressure': return 'hPa';
      case 'vibration': return 'mm/s';
      case 'flow': return 'L/min';
      case 'power': return 'W';
      case 'voltage': return 'V';
      case 'current': return 'A';
      case 'acceleration': return 'm/s²';
      case 'gyroscope': return '°/s';
      default: return '';
    }
  };

  useEffect(() => {
    if (formData.type && !formData.unit) {
      handleInputChange('unit', getUnitForType(formData.type));
    }
  }, [formData.type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">
            {sensor ? 'Edit Sensor' : 'Create New Sensor'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {[
            { id: 'basic', label: 'Basic Info', icon: Settings },
            { id: 'position', label: 'Position', icon: MapPin },
            { id: 'thresholds', label: 'Thresholds', icon: Settings },
            { id: 'details', label: 'Details', icon: User }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Sensor Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Sensor Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    required
                  >
                    <option value="temperature">Temperature</option>
                    <option value="humidity">Humidity</option>
                    <option value="pressure">Pressure</option>
                    <option value="vibration">Vibration</option>
                    <option value="flow">Flow</option>
                    <option value="power">Power</option>
                    <option value="voltage">Voltage</option>
                    <option value="current">Current</option>
                    <option value="acceleration">Acceleration</option>
                    <option value="gyroscope">Gyroscope</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Model *
                  </label>
                  <select
                    value={formData.modelId}
                    onChange={(e) => handleInputChange('modelId', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    required
                  >
                    <option value="">Select a model</option>
                    {models.map(model => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Device ID
                  </label>
                  <input
                    type="text"
                    value={formData.deviceId || ''}
                    onChange={(e) => handleInputChange('deviceId', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Unit *
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Installation Date *
                  </label>
                  <input
                    type="date"
                    value={formData.installationDate.toISOString().split('T')[0]}
                    onChange={(e) => handleInputChange('installationDate', new Date(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'position' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-4">3D Position</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">X</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.position.x}
                      onChange={(e) => handlePositionChange('x', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Y</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.position.y}
                      onChange={(e) => handlePositionChange('y', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Z</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.position.z}
                      onChange={(e) => handlePositionChange('z', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-4">Geographic Coordinates (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.coordinates?.latitude || ''}
                      onChange={(e) => handleCoordinatesChange('latitude', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.coordinates?.longitude || ''}
                      onChange={(e) => handleCoordinatesChange('longitude', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Elevation (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.coordinates?.elevation || ''}
                      onChange={(e) => handleCoordinatesChange('elevation', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'thresholds' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Minimum Value
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.minValue || ''}
                    onChange={(e) => handleInputChange('minValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Maximum Value
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.maxValue || ''}
                    onChange={(e) => handleInputChange('maxValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Warning Threshold
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.warningThreshold || ''}
                    onChange={(e) => handleInputChange('warningThreshold', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Critical Threshold
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.criticalThreshold || ''}
                    onChange={(e) => handleInputChange('criticalThreshold', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer || ''}
                    onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    value={formData.model || ''}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={formData.serialNumber || ''}
                    onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
            >
              {sensor ? 'Update Sensor' : 'Create Sensor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};