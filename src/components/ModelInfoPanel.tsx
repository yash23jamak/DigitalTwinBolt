import React from 'react';
import { Info } from 'lucide-react';
import { DigitalTwinModel } from '../types';

interface ModelInfoPanelProps {
  selectedModel: DigitalTwinModel | null;
}

export const ModelInfoPanel: React.FC<ModelInfoPanelProps> = ({ selectedModel }) => {
  if (!selectedModel || !selectedModel.coordinates) return null;

  return (
    <div className="absolute bottom-4 right-4 z-10 bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 w-80">
      <div className="flex items-center space-x-2 mb-3">
        <Info className="w-5 h-5 text-blue-400" />
        <h3 className="font-medium text-white">Selected Model</h3>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Name:</span>
          <span className="text-white">{selectedModel.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Location:</span>
          <span className="text-white text-xs">
            {selectedModel.coordinates.latitude.toFixed(6)}, {selectedModel.coordinates.longitude.toFixed(6)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Type:</span>
          <span className="text-white uppercase">{selectedModel.type}</span>
        </div>
        {selectedModel.coordinates.elevation && (
          <div className="flex justify-between">
            <span className="text-slate-400">Elevation:</span>
            <span className="text-white">{selectedModel.coordinates.elevation}m</span>
          </div>
        )}
      </div>
    </div>
  );
};
