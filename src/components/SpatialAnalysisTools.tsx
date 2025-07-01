import React, { useState } from 'react';
import {
  Calculator,
  Circle,
  Navigation,
  Mountain,
  Target,
  Search,
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Play,
  X
} from 'lucide-react';
import { DigitalTwinModel } from '../App';
import { GeospatialCoordinates } from '../services/geospatialService';
import { 
  spatialAnalysisService, 
  BufferAnalysisResult, 
  ProximityAnalysisResult, 
  TerrainAnalysisResult,
  SuitabilityAnalysisResult 
} from '../services/spatialAnalysisService';

interface SpatialAnalysisToolsProps {
  models: DigitalTwinModel[];
  selectedModel: DigitalTwinModel | null;
  onLocationSelect: (coordinates: GeospatialCoordinates) => void;
}

type AnalysisType = 'buffer' | 'proximity' | 'terrain' | 'suitability' | 'optimal';

interface AnalysisResults {
  buffer?: BufferAnalysisResult;
  proximity?: ProximityAnalysisResult;
  terrain?: TerrainAnalysisResult;
  suitability?: SuitabilityAnalysisResult;
  optimal?: GeospatialCoordinates[];
}

export const SpatialAnalysisTools: React.FC<SpatialAnalysisToolsProps> = ({
  models,
  selectedModel,
  onLocationSelect
}) => {
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResults>({});
  const [analysisParams, setAnalysisParams] = useState({
    bufferRadius: 1000,
    proximityMaxDistance: 5000,
    terrainLocation: { latitude: 34.0522, longitude: -118.2437 },
    suitabilityLocation: { latitude: 34.0522, longitude: -118.2437 },
    optimalSearchRadius: 2000
  });

  const analysisTools = [
    {
      id: 'buffer' as AnalysisType,
      name: 'Buffer Analysis',
      icon: Circle,
      description: 'Analyze models within a radius',
      color: 'blue'
    },
    {
      id: 'proximity' as AnalysisType,
      name: 'Proximity Analysis',
      icon: Navigation,
      description: 'Find nearby models and distances',
      color: 'green'
    },
    {
      id: 'terrain' as AnalysisType,
      name: 'Terrain Analysis',
      icon: Mountain,
      description: 'Analyze elevation and slope',
      color: 'yellow'
    },
    {
      id: 'suitability' as AnalysisType,
      name: 'Suitability Analysis',
      icon: Target,
      description: 'Evaluate location suitability',
      color: 'purple'
    },
    {
      id: 'optimal' as AnalysisType,
      name: 'Optimal Locations',
      icon: Search,
      description: 'Find best placement locations',
      color: 'teal'
    }
  ];

  const handleRunAnalysis = async (analysisType: AnalysisType) => {
    setIsAnalyzing(true);
    setActiveAnalysis(analysisType);

    try {
      let result;

      switch (analysisType) {
        case 'buffer':
          const center = selectedModel?.coordinates || analysisParams.terrainLocation;
          result = await spatialAnalysisService.performBufferAnalysis(
            center,
            analysisParams.bufferRadius,
            models
          );
          setResults(prev => ({ ...prev, buffer: result }));
          break;

        case 'proximity':
          if (!selectedModel) {
            throw new Error('Please select a model for proximity analysis');
          }
          result = await spatialAnalysisService.performProximityAnalysis(
            selectedModel,
            models,
            analysisParams.proximityMaxDistance
          );
          setResults(prev => ({ ...prev, proximity: result }));
          break;

        case 'terrain':
          result = await spatialAnalysisService.performTerrainAnalysis(
            analysisParams.terrainLocation
          );
          setResults(prev => ({ ...prev, terrain: result }));
          break;

        case 'suitability':
          result = await spatialAnalysisService.performSuitabilityAnalysis(
            analysisParams.suitabilityLocation,
            models
          );
          setResults(prev => ({ ...prev, suitability: result }));
          break;

        case 'optimal':
          const searchCenter = selectedModel?.coordinates || analysisParams.terrainLocation;
          result = await spatialAnalysisService.findOptimalLocations(
            {
              center: searchCenter,
              radiusMeters: analysisParams.optimalSearchRadius
            },
            models
          );
          setResults(prev => ({ ...prev, optimal: result }));
          break;
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      green: 'bg-green-500/20 text-green-400 border-green-500/30',
      yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      teal: 'bg-teal-500/20 text-teal-400 border-teal-500/30'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const renderResults = () => {
    if (!activeAnalysis || !results[activeAnalysis]) return null;

    switch (activeAnalysis) {
      case 'buffer':
        const bufferResult = results.buffer!;
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Circle className="w-4 h-4 text-blue-400" />
              <span className="text-white font-medium">Buffer Analysis Results</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-700/30 p-2 rounded">
                <div className="text-slate-400">Radius</div>
                <div className="text-white">{bufferResult.radiusMeters}m</div>
              </div>
              <div className="bg-slate-700/30 p-2 rounded">
                <div className="text-slate-400">Models Found</div>
                <div className="text-white">{bufferResult.modelsInBuffer.length}</div>
              </div>
              <div className="bg-slate-700/30 p-2 rounded">
                <div className="text-slate-400">Area</div>
                <div className="text-white">{(bufferResult.area / 1000000).toFixed(2)} km²</div>
              </div>
            </div>
            {bufferResult.modelsInBuffer.length > 0 && (
              <div className="space-y-1">
                <div className="text-slate-400 text-sm">Models in buffer:</div>
                {bufferResult.modelsInBuffer.slice(0, 5).map(model => (
                  <div key={model.id} className="text-white text-sm px-2 py-1 bg-slate-700/30 rounded">
                    {model.name}
                  </div>
                ))}
                {bufferResult.modelsInBuffer.length > 5 && (
                  <div className="text-slate-400 text-xs">
                    +{bufferResult.modelsInBuffer.length - 5} more...
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'proximity':
        const proximityResult = results.proximity!;
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-green-400" />
              <span className="text-white font-medium">Proximity Analysis Results</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-700/30 p-2 rounded">
                <div className="text-slate-400">Nearby Models</div>
                <div className="text-white">{proximityResult.nearbyModels.length}</div>
              </div>
              <div className="bg-slate-700/30 p-2 rounded">
                <div className="text-slate-400">Avg Distance</div>
                <div className="text-white">{proximityResult.averageDistance.toFixed(0)}m</div>
              </div>
            </div>
            {proximityResult.closestModel && (
              <div className="bg-green-500/10 p-2 rounded border border-green-500/30">
                <div className="text-green-400 text-sm">Closest Model</div>
                <div className="text-white">{proximityResult.closestModel.name}</div>
                <div className="text-slate-400 text-xs">
                  {proximityResult.nearbyModels[0]?.distance.toFixed(0)}m away
                </div>
              </div>
            )}
          </div>
        );

      case 'terrain':
        const terrainResult = results.terrain!;
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Mountain className="w-4 h-4 text-yellow-400" />
              <span className="text-white font-medium">Terrain Analysis Results</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-700/30 p-2 rounded">
                <div className="text-slate-400">Elevation</div>
                <div className="text-white">{terrainResult.elevation.toFixed(1)}m</div>
              </div>
              <div className="bg-slate-700/30 p-2 rounded">
                <div className="text-slate-400">Slope</div>
                <div className="text-white">{terrainResult.slope.toFixed(1)}°</div>
              </div>
              <div className="bg-slate-700/30 p-2 rounded">
                <div className="text-slate-400">Aspect</div>
                <div className="text-white">{terrainResult.aspect.toFixed(0)}°</div>
              </div>
              <div className="bg-slate-700/30 p-2 rounded">
                <div className="text-slate-400">Visibility</div>
                <div className="text-white">{terrainResult.visibility.visible ? 'Good' : 'Limited'}</div>
              </div>
            </div>
          </div>
        );

      case 'suitability':
        const suitabilityResult = results.suitability!;
        const scoreColor = suitabilityResult.suitabilityScore >= 70 ? 'text-green-400' :
                          suitabilityResult.suitabilityScore >= 50 ? 'text-yellow-400' : 'text-red-400';
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-white font-medium">Suitability Analysis Results</span>
            </div>
            <div className="bg-slate-700/30 p-3 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Overall Score</span>
                <span className={`font-bold ${scoreColor}`}>
                  {suitabilityResult.suitabilityScore.toFixed(0)}/100
                </span>
              </div>
              <div className="space-y-2">
                {Object.entries(suitabilityResult.factors).map(([factor, score]) => (
                  <div key={factor} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 capitalize">{factor}</span>
                    <span className="text-white">{score.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-slate-400 text-sm">Recommendations:</div>
              {suitabilityResult.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  <Info className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'optimal':
        const optimalResult = results.optimal!;
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-teal-400" />
              <span className="text-white font-medium">Optimal Locations Found</span>
            </div>
            <div className="bg-slate-700/30 p-2 rounded text-center">
              <div className="text-2xl font-bold text-teal-400">{optimalResult.length}</div>
              <div className="text-slate-400 text-sm">Suitable locations</div>
            </div>
            {optimalResult.length > 0 && (
              <div className="space-y-1">
                <div className="text-slate-400 text-sm">Top locations:</div>
                {optimalResult.slice(0, 3).map((location, index) => (
                  <button
                    key={index}
                    onClick={() => onLocationSelect(location)}
                    className="w-full flex items-center justify-between p-2 bg-slate-700/30 hover:bg-slate-600/30 rounded transition-colors text-left"
                  >
                    <div>
                      <div className="text-white text-sm">Location {index + 1}</div>
                      <div className="text-slate-400 text-xs">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </div>
                    </div>
                    <MapPin className="w-4 h-4 text-teal-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-blue-400" />
          <h3 className="font-medium text-white">Spatial Analysis Tools</h3>
        </div>
        {activeAnalysis && (
          <button
            onClick={() => {
              setActiveAnalysis(null);
              setResults({});
            }}
            className="p-1 hover:bg-slate-700/50 rounded transition-colors text-slate-400 hover:text-white"
            title="Clear Results"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Analysis Tools Grid */}
        <div className="grid grid-cols-1 gap-2">
          {analysisTools.map(tool => (
            <button
              key={tool.id}
              onClick={() => handleRunAnalysis(tool.id)}
              disabled={isAnalyzing}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                activeAnalysis === tool.id
                  ? getColorClasses(tool.color)
                  : 'bg-slate-700/30 hover:bg-slate-600/30 border-slate-600/50 text-slate-300 hover:text-white'
              } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <tool.icon className="w-4 h-4" />
              <div className="flex-1 text-left">
                <div className="font-medium">{tool.name}</div>
                <div className="text-xs opacity-75">{tool.description}</div>
              </div>
              {isAnalyzing && activeAnalysis === tool.id ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
          ))}
        </div>

        {/* Analysis Parameters */}
        {activeAnalysis && (
          <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
            <div className="text-slate-400 text-sm mb-2">Parameters</div>
            {activeAnalysis === 'buffer' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Buffer Radius (meters)</label>
                <input
                  type="number"
                  value={analysisParams.bufferRadius}
                  onChange={(e) => setAnalysisParams(prev => ({ ...prev, bufferRadius: parseInt(e.target.value) }))}
                  className="w-full px-2 py-1 text-xs bg-slate-700/50 border border-slate-600/50 rounded text-white focus:border-blue-500/50 focus:outline-none"
                />
              </div>
            )}
            {activeAnalysis === 'proximity' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Max Distance (meters)</label>
                <input
                  type="number"
                  value={analysisParams.proximityMaxDistance}
                  onChange={(e) => setAnalysisParams(prev => ({ ...prev, proximityMaxDistance: parseInt(e.target.value) }))}
                  className="w-full px-2 py-1 text-xs bg-slate-700/50 border border-slate-600/50 rounded text-white focus:border-blue-500/50 focus:outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {renderResults()}
      </div>
    </div>
  );
};
