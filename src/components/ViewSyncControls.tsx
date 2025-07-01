import React, { useState, useEffect } from 'react';
import {
  Link,
  Unlink,
  Eye,
  Focus,
  Navigation,
  Layers,
  Info,
  Settings,
  RefreshCw
} from 'lucide-react';
import { DigitalTwinModel } from '../App';
import { mapModelSyncService, ViewSyncEvent } from '../services/mapModelSyncService';

interface ViewSyncControlsProps {
  models: DigitalTwinModel[];
  selectedModel: DigitalTwinModel | null;
  currentView: string;
  onModelSelect: (model: DigitalTwinModel) => void;
}

export const ViewSyncControls: React.FC<ViewSyncControlsProps> = ({
  models,
  selectedModel,
  currentView,
  onModelSelect
}) => {
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<ViewSyncEvent[]>([]);

  useEffect(() => {
    // Subscribe to sync events for debugging
    const unsubscribeAll = mapModelSyncService.subscribe('*', (event) => {
      setRecentEvents(prev => [event, ...prev.slice(0, 4)]); // Keep last 5 events
    });

    const unsubscribeModelSelect = mapModelSyncService.subscribe('model-selected', (event) => {
      const modelEvent = event.data;
      if (modelEvent.source !== currentView) {
        onModelSelect(modelEvent.model);
      }
    });

    const unsubscribeLocationClick = mapModelSyncService.subscribe('location-clicked', (event) => {
      const locationEvent = event.data;
      console.log('Location clicked:', locationEvent.coordinates);
      
      // If there are nearby models, select the first one
      if (locationEvent.nearbyModels.length > 0) {
        onModelSelect(locationEvent.nearbyModels[0]);
      }
    });

    return () => {
      unsubscribeAll();
      unsubscribeModelSelect();
      unsubscribeLocationClick();
    };
  }, [currentView, onModelSelect]);

  useEffect(() => {
    // Update sync service state
    mapModelSyncService.setSyncEnabled(syncEnabled);
  }, [syncEnabled]);

  useEffect(() => {
    // Update debug info periodically
    if (showDebugInfo) {
      const interval = setInterval(() => {
        setDebugInfo(mapModelSyncService.getDebugInfo());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showDebugInfo]);

  const handleToggleSync = () => {
    setSyncEnabled(!syncEnabled);
  };

  const handleFocusOnModel = () => {
    if (selectedModel) {
      mapModelSyncService.focusOnModel(selectedModel);
    }
  };

  const handleRefreshSync = () => {
    // Clear and reinitialize sync state
    mapModelSyncService.clearAllListeners();
    setRecentEvents([]);
    
    // Re-emit current state
    if (selectedModel) {
      mapModelSyncService.selectModel(selectedModel, currentView as any);
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'model-selected':
        return <Eye className="w-3 h-3" />;
      case 'location-clicked':
        return <Navigation className="w-3 h-3" />;
      case 'camera-moved':
        return <Focus className="w-3 h-3" />;
      case 'view-changed':
        return <Layers className="w-3 h-3" />;
      default:
        return <Info className="w-3 h-3" />;
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'model-selected':
        return 'text-blue-400';
      case 'location-clicked':
        return 'text-green-400';
      case 'camera-moved':
        return 'text-yellow-400';
      case 'view-changed':
        return 'text-purple-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {syncEnabled ? (
            <Link className="w-5 h-5 text-green-400" />
          ) : (
            <Unlink className="w-5 h-5 text-red-400" />
          )}
          <h3 className="font-medium text-white">View Synchronization</h3>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className={`p-1 rounded transition-colors ${
              showDebugInfo
                ? 'bg-blue-500/20 text-blue-400'
                : 'hover:bg-slate-700/50 text-slate-400 hover:text-white'
            }`}
            title="Toggle Debug Info"
          >
            <Info className="w-4 h-4" />
          </button>
          <button
            onClick={handleRefreshSync}
            className="p-1 hover:bg-slate-700/50 rounded transition-colors text-slate-400 hover:text-white"
            title="Refresh Sync"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Sync Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-slate-300 text-sm">Enable Synchronization</span>
          <button
            onClick={handleToggleSync}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              syncEnabled ? 'bg-blue-500' : 'bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                syncEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Current Selection */}
        <div className="p-3 bg-slate-700/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Selected Model</span>
            {selectedModel && (
              <button
                onClick={handleFocusOnModel}
                className="flex items-center space-x-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-blue-400 text-xs transition-colors"
                title="Focus on Model"
              >
                <Focus className="w-3 h-3" />
                <span>Focus</span>
              </button>
            )}
          </div>
          <div className="text-white text-sm">
            {selectedModel ? selectedModel.name : 'None'}
          </div>
          {selectedModel?.coordinates && (
            <div className="text-slate-400 text-xs mt-1">
              {selectedModel.coordinates.latitude.toFixed(6)}, {selectedModel.coordinates.longitude.toFixed(6)}
            </div>
          )}
        </div>

        {/* Sync Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Status:</span>
          <span className={`font-medium ${syncEnabled ? 'text-green-400' : 'text-red-400'}`}>
            {syncEnabled ? 'Active' : 'Disabled'}
          </span>
        </div>

        {/* Models with Coordinates */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Geo-located Models:</span>
          <span className="text-white font-medium">
            {models.filter(m => m.coordinates).length} / {models.length}
          </span>
        </div>

        {/* Debug Information */}
        {showDebugInfo && debugInfo && (
          <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-600/50">
            <div className="flex items-center space-x-2 mb-2">
              <Settings className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm font-medium">Debug Info</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Event Listeners:</span>
                <span className="text-white">{debugInfo.listenerCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Model:</span>
                <span className="text-white">{debugInfo.currentSelectedModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Camera Position:</span>
                <span className="text-white">{debugInfo.hasCameraPosition ? 'Set' : 'None'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Recent Events */}
        {showDebugInfo && recentEvents.length > 0 && (
          <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-600/50">
            <div className="flex items-center space-x-2 mb-2">
              <RefreshCw className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-medium">Recent Events</span>
            </div>
            <div className="space-y-1">
              {recentEvents.map((event, index) => (
                <div key={index} className="flex items-center space-x-2 text-xs">
                  <div className={`${getEventTypeColor(event.type)}`}>
                    {getEventTypeIcon(event.type)}
                  </div>
                  <span className="text-slate-400">{event.type}</span>
                  <span className="text-slate-500">from {event.source}</span>
                  <span className="text-slate-500 ml-auto">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
