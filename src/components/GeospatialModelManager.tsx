import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Globe,
  Layers,
  Settings,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Navigation,
  Target
} from 'lucide-react';
import { DigitalTwinModel } from '../App';
import { geospatialService, GeospatialCoordinates, ModelPlacement } from '../services/geospatialService';
import { LocationPicker } from './LocationPicker';

interface GeospatialModelManagerProps {
  models: DigitalTwinModel[];
  selectedModel: DigitalTwinModel | null;
  onModelUpdate: (model: DigitalTwinModel) => void;
}

interface PlacementForm {
  latitude: string;
  longitude: string;
  elevation: string;
  scale: string;
  rotationX: string;
  rotationY: string;
  rotationZ: string;
}

export const GeospatialModelManager: React.FC<GeospatialModelManagerProps> = ({
  models,
  selectedModel,
  onModelUpdate
}) => {
  const [placements, setPlacements] = useState<ModelPlacement[]>([]);
  const [editingModel, setEditingModel] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [placementForm, setPlacementForm] = useState<PlacementForm>({
    latitude: '',
    longitude: '',
    elevation: '0',
    scale: '1',
    rotationX: '0',
    rotationY: '0',
    rotationZ: '0'
  });

  useEffect(() => {
    // Load existing placements
    setPlacements(geospatialService.getModelPlacements());
  }, [models]);

  const handleAddPlacement = (model: DigitalTwinModel) => {
    setEditingModel(model.id);
    if (model.coordinates) {
      setPlacementForm({
        latitude: model.coordinates.latitude.toString(),
        longitude: model.coordinates.longitude.toString(),
        elevation: (model.coordinates.elevation || 0).toString(),
        scale: '1',
        rotationX: '0',
        rotationY: '0',
        rotationZ: '0'
      });
    } else {
      setPlacementForm({
        latitude: '34.0522',
        longitude: '-118.2437',
        elevation: '0',
        scale: '1',
        rotationX: '0',
        rotationY: '0',
        rotationZ: '0'
      });
    }
  };

  const handleSavePlacement = async () => {
    if (!editingModel) return;

    const model = models.find(m => m.id === editingModel);
    if (!model) return;

    try {
      const coordinates: GeospatialCoordinates = {
        latitude: parseFloat(placementForm.latitude),
        longitude: parseFloat(placementForm.longitude),
        elevation: parseFloat(placementForm.elevation)
      };

      const placement = geospatialService.placeModelAtLocation(model, coordinates, {
        scale: parseFloat(placementForm.scale),
        rotation: {
          x: parseFloat(placementForm.rotationX),
          y: parseFloat(placementForm.rotationY),
          z: parseFloat(placementForm.rotationZ)
        }
      });

      // Update model with coordinates
      const updatedModel: DigitalTwinModel = {
        ...model,
        coordinates
      };

      onModelUpdate(updatedModel);
      setPlacements(geospatialService.getModelPlacements());
      setEditingModel(null);
    } catch (error) {
      console.error('Error saving placement:', error);
    }
  };

  const handleRemovePlacement = (modelId: string) => {
    geospatialService.removeModelPlacement(modelId);
    setPlacements(geospatialService.getModelPlacements());

    // Update model to remove coordinates
    const model = models.find(m => m.id === modelId);
    if (model) {
      const updatedModel: DigitalTwinModel = {
        ...model,
        coordinates: undefined
      };
      onModelUpdate(updatedModel);
    }
  };

  const handleFormChange = (field: keyof PlacementForm, value: string) => {
    setPlacementForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancelEdit = () => {
    setEditingModel(null);
    setPlacementForm({
      latitude: '',
      longitude: '',
      elevation: '0',
      scale: '1',
      rotationX: '0',
      rotationY: '0',
      rotationZ: '0'
    });
  };

  const handleLocationPickerSelect = (location: { latitude: number; longitude: number }) => {
    setPlacementForm(prev => ({
      ...prev,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString()
    }));
    setShowLocationPicker(false);
  };

  const handleLocationPickerCancel = () => {
    setShowLocationPicker(false);
  };

  return (
    <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Globe className="w-5 h-5 text-blue-400" />
        <h3 className="font-medium text-white">Geospatial Model Placement</h3>
      </div>

      <div className="space-y-4">
        {/* Model List */}
        <div className="space-y-2">
          {models.map(model => {
            const placement = placements.find(p => p.model.id === model.id);
            const isEditing = editingModel === model.id;

            return (
              <div
                key={model.id}
                className={`p-3 rounded-lg border transition-colors ${selectedModel?.id === model.id
                  ? 'border-blue-500/50 bg-blue-500/10'
                  : 'border-slate-600/50 bg-slate-700/30'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className={`w-4 h-4 ${placement ? 'text-green-400' : 'text-slate-400'}`} />
                    <span className="text-white text-sm font-medium">{model.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {placement && !isEditing && (
                      <>
                        <button
                          onClick={() => handleAddPlacement(model)}
                          className="p-1 hover:bg-slate-600/50 rounded transition-colors text-slate-400 hover:text-white"
                          title="Edit Placement"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleRemovePlacement(model.id)}
                          className="p-1 hover:bg-red-500/20 rounded transition-colors text-slate-400 hover:text-red-400"
                          title="Remove Placement"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    {!placement && !isEditing && (
                      <button
                        onClick={() => handleAddPlacement(model)}
                        className="p-1 hover:bg-green-500/20 rounded transition-colors text-slate-400 hover:text-green-400"
                        title="Add Placement"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Placement Info */}
                {placement && !isEditing && (
                  <div className="text-xs text-slate-400 space-y-1">
                    <div>Location: {placement.coordinates.latitude.toFixed(6)}, {placement.coordinates.longitude.toFixed(6)}</div>
                    <div>Elevation: {placement.coordinates.elevation?.toFixed(2) || 0}m</div>
                    <div>Scale: {placement.scale}x</div>
                  </div>
                )}

                {/* Edit Form */}
                {isEditing && (
                  <div className="space-y-3 mt-3 p-3 bg-slate-800/50 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Location Coordinates</span>
                        <button
                          onClick={() => setShowLocationPicker(true)}
                          className="flex items-center space-x-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-blue-400 text-xs transition-colors"
                        >
                          <Target className="w-3 h-3" />
                          <span>Pick Location</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Latitude</label>
                          <input
                            type="number"
                            step="any"
                            value={placementForm.latitude}
                            onChange={(e) => handleFormChange('latitude', e.target.value)}
                            className="w-full px-2 py-1 text-xs bg-slate-700/50 border border-slate-600/50 rounded text-white focus:border-blue-500/50 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Longitude</label>
                          <input
                            type="number"
                            step="any"
                            value={placementForm.longitude}
                            onChange={(e) => handleFormChange('longitude', e.target.value)}
                            className="w-full px-2 py-1 text-xs bg-slate-700/50 border border-slate-600/50 rounded text-white focus:border-blue-500/50 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Elevation (m)</label>
                        <input
                          type="number"
                          step="any"
                          value={placementForm.elevation}
                          onChange={(e) => handleFormChange('elevation', e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-slate-700/50 border border-slate-600/50 rounded text-white focus:border-blue-500/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Scale</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={placementForm.scale}
                          onChange={(e) => handleFormChange('scale', e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-slate-700/50 border border-slate-600/50 rounded text-white focus:border-blue-500/50 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Rotation X</label>
                        <input
                          type="number"
                          step="1"
                          value={placementForm.rotationX}
                          onChange={(e) => handleFormChange('rotationX', e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-slate-700/50 border border-slate-600/50 rounded text-white focus:border-blue-500/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Rotation Y</label>
                        <input
                          type="number"
                          step="1"
                          value={placementForm.rotationY}
                          onChange={(e) => handleFormChange('rotationY', e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-slate-700/50 border border-slate-600/50 rounded text-white focus:border-blue-500/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Rotation Z</label>
                        <input
                          type="number"
                          step="1"
                          value={placementForm.rotationZ}
                          onChange={(e) => handleFormChange('rotationZ', e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-slate-700/50 border border-slate-600/50 rounded text-white focus:border-blue-500/50 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSavePlacement}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded text-green-400 text-xs transition-colors"
                      >
                        <Save className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center space-x-1 px-3 py-1 bg-slate-600/20 hover:bg-slate-600/30 border border-slate-600/30 rounded text-slate-400 text-xs transition-colors"
                      >
                        <X className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="pt-3 border-t border-slate-600/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Placed Models:</span>
            <span className="text-white font-medium">{placements.length} / {models.length}</span>
          </div>
        </div>
      </div>

      {/* Location Picker Modal */}
      <LocationPicker
        isOpen={showLocationPicker}
        initialLocation={
          placementForm.latitude && placementForm.longitude
            ? {
              latitude: parseFloat(placementForm.latitude),
              longitude: parseFloat(placementForm.longitude)
            }
            : undefined
        }
        onLocationSelect={handleLocationPickerSelect}
        onCancel={handleLocationPickerCancel}
      />
    </div>
  );
};
