import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  Target,
  Globe,
  Crosshair,
  Check,
  X
} from 'lucide-react';

interface LocationPickerProps {
  initialLocation?: { latitude: number; longitude: number };
  onLocationSelect: (location: { latitude: number; longitude: number }) => void;
  onCancel: () => void;
  isOpen: boolean;
}

interface LocationSuggestion {
  name: string;
  latitude: number;
  longitude: number;
  type: 'city' | 'landmark' | 'address';
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLocation,
  onLocationSelect,
  onCancel,
  isOpen
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation || { latitude: 34.0522, longitude: -118.2437 }
  );
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Predefined location suggestions
  const predefinedLocations: LocationSuggestion[] = [
    { name: 'Los Angeles, CA', latitude: 34.0522, longitude: -118.2437, type: 'city' },
    { name: 'New York, NY', latitude: 40.7128, longitude: -74.0060, type: 'city' },
    { name: 'San Francisco, CA', latitude: 37.7749, longitude: -122.4194, type: 'city' },
    { name: 'Chicago, IL', latitude: 41.8781, longitude: -87.6298, type: 'city' },
    { name: 'Miami, FL', latitude: 25.7617, longitude: -80.1918, type: 'city' },
    { name: 'Seattle, WA', latitude: 47.6062, longitude: -122.3321, type: 'city' },
    { name: 'Denver, CO', latitude: 39.7392, longitude: -104.9903, type: 'city' },
    { name: 'Austin, TX', latitude: 30.2672, longitude: -97.7431, type: 'city' },
    { name: 'Golden Gate Bridge', latitude: 37.8199, longitude: -122.4783, type: 'landmark' },
    { name: 'Empire State Building', latitude: 40.7484, longitude: -73.9857, type: 'landmark' },
    { name: 'Hollywood Sign', latitude: 34.1341, longitude: -118.3215, type: 'landmark' },
    { name: 'Space Needle', latitude: 47.6205, longitude: -122.3493, type: 'landmark' }
  ];

  useEffect(() => {
    if (searchQuery.length > 2) {
      setIsSearching(true);
      // Filter predefined locations based on search query
      const filtered = predefinedLocations.filter(location =>
        location.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(filtered);
      setIsSearching(false);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const handleLocationClick = (location: LocationSuggestion) => {
    setSelectedLocation({
      latitude: location.latitude,
      longitude: location.longitude
    });
    setSearchQuery(location.name);
    setSuggestions([]);
  };

  const handleManualCoordinateChange = (field: 'latitude' | 'longitude', value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setSelectedLocation(prev => ({
        ...prev,
        [field]: numValue
      }));
    }
  };

  const handleConfirm = () => {
    onLocationSelect(selectedLocation);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setSelectedLocation(location);
          setSearchQuery(`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
        },
        (error) => {
          console.error('Error getting current location:', error);
        }
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h3 className="font-medium text-white">Select Location</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a location..."
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Current Location Button */}
          <button
            onClick={getCurrentLocation}
            className="w-full flex items-center justify-center space-x-2 p-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <Navigation className="w-4 h-4" />
            <span>Use Current Location</span>
          </button>

          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="max-h-40 overflow-y-auto bg-slate-700 rounded-lg border border-slate-600">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationClick(suggestion)}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-slate-600 transition-colors text-left"
                >
                  <div className={`p-1 rounded ${
                    suggestion.type === 'city' ? 'bg-blue-500/20 text-blue-400' :
                    suggestion.type === 'landmark' ? 'bg-green-500/20 text-green-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {suggestion.type === 'city' ? <Globe className="w-3 h-3" /> :
                     suggestion.type === 'landmark' ? <Target className="w-3 h-3" /> :
                     <MapPin className="w-3 h-3" />}
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{suggestion.name}</div>
                    <div className="text-slate-400 text-xs">
                      {suggestion.latitude.toFixed(4)}, {suggestion.longitude.toFixed(4)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Manual Coordinate Input */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-400 text-sm">
              <Crosshair className="w-4 h-4" />
              <span>Or enter coordinates manually:</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={selectedLocation.latitude}
                  onChange={(e) => handleManualCoordinateChange('latitude', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={selectedLocation.longitude}
                  onChange={(e) => handleManualCoordinateChange('longitude', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Selected Location Preview */}
          <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600/50">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">Selected Location</span>
            </div>
            <div className="text-white text-sm">
              {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={handleConfirm}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Location</span>
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
