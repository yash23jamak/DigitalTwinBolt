import React from 'react';
import {
  Map,
  Layers,
  Navigation,
  Maximize2,
  Minimize2,
  MapPin,
  Satellite,
  Globe
} from 'lucide-react';
import { MapSettings } from '../types/components';
import { palette, responsive } from '../styles/palette';

interface MapControlsProps {
  mapSettings: MapSettings;
  isFullscreen: boolean;
  modelCount: number;
  onBasemapChange: (basemap: MapSettings['basemap']) => void;
  onToggleViewType: () => void;
  onToggleFullscreen: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  mapSettings,
  isFullscreen,
  modelCount,
  onBasemapChange,
  onToggleViewType,
  onToggleFullscreen
}) => {
  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
      {/* Left Controls */}
      <div className="flex flex-col space-y-2">
        {/* Basemap Selector */}
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-2 border border-slate-700/50">
          <div className="flex items-center space-x-1 md:space-x-2">
            <button
              onClick={() => onBasemapChange('streets')}
              className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                mapSettings.basemap === 'streets'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'hover:bg-slate-700/50 text-slate-300 hover:text-white'
              }`}
              title="Streets"
            >
              <Map className="w-3 h-3 md:w-4 md:h-4" />
            </button>
            <button
              onClick={() => onBasemapChange('satellite')}
              className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                mapSettings.basemap === 'satellite'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'hover:bg-slate-700/50 text-slate-300 hover:text-white'
              }`}
              title="Satellite"
            >
              <Satellite className="w-3 h-3 md:w-4 md:h-4" />
            </button>
            <button
              onClick={() => onBasemapChange('hybrid')}
              className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                mapSettings.basemap === 'hybrid'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'hover:bg-slate-700/50 text-slate-300 hover:text-white'
              }`}
              title="Hybrid"
            >
              <Layers className="w-3 h-3 md:w-4 md:h-4" />
            </button>
            <button
              onClick={() => onBasemapChange('terrain')}
              className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                mapSettings.basemap === 'terrain'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'hover:bg-slate-700/50 text-slate-300 hover:text-white'
              }`}
              title="Terrain"
            >
              <Globe className="w-3 h-3 md:w-4 md:h-4" />
            </button>
          </div>
        </div>

        {/* View Type Toggle */}
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-2 border border-slate-700/50">
          <button
            onClick={onToggleViewType}
            className={`p-1.5 md:p-2 rounded-lg transition-colors ${
              mapSettings.viewType === '3d'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}
            title={`Switch to ${mapSettings.viewType === '2d' ? '3D' : '2D'} View`}
          >
            <Navigation className="w-3 h-3 md:w-4 md:h-4" />
            <span className="ml-1 text-xs font-medium">
              {mapSettings.viewType.toUpperCase()}
            </span>
          </button>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        {/* Model Count */}
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-2 md:p-3 border border-slate-700/50">
          <div className="flex items-center space-x-2">
            <MapPin className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />
            <span className="text-white text-xs md:text-sm font-medium">
              {modelCount} Models
            </span>
          </div>
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          className="p-2 md:p-3 bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:bg-slate-700/50 transition-colors text-slate-300 hover:text-white"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-3 h-3 md:w-4 md:h-4" /> : <Maximize2 className="w-3 h-3 md:w-4 md:h-4" />}
        </button>
      </div>
    </div>
  );
};