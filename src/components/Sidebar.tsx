import React from 'react';
import {
  Box,
  BarChart3,
  Upload,
  Library,
  Activity,
  Settings,
  ChevronRight,
  Map
} from 'lucide-react';

interface SidebarProps {
  currentView: 'viewer' | 'dashboard' | 'upload' | 'library' | 'gis';
  onViewChange: (view: 'viewer' | 'dashboard' | 'upload' | 'library' | 'gis') => void;
  modelCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, modelCount }) => {
  const navItems = [
    { id: 'viewer', label: '3D Viewer', icon: Box, description: 'Interactive 3D model viewer' },
    { id: 'gis', label: 'GIS Map', icon: Map, description: 'ArcGIS mapping & geospatial analysis' },
    { id: 'dashboard', label: 'Analytics', icon: BarChart3, description: 'Predictive analysis dashboard' },
    { id: 'upload', label: 'Upload', icon: Upload, description: 'Upload new models' },
    { id: 'library', label: 'Library', icon: Library, description: `${modelCount} models available` }
  ];

  return (
    <div className="w-80 bg-slate-800/50 backdrop-blur-xl border-r border-slate-700/50 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg">
            <Box className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              Digital Twin
            </h1>
            <p className="text-sm text-slate-400">3D Model Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as any)}
            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 group ${currentView === item.id
              ? 'bg-gradient-to-r from-blue-500/20 to-teal-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10'
              : 'hover:bg-slate-700/30 border border-transparent'
              }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg transition-colors ${currentView === item.id
                ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white'
                : 'bg-slate-700/50 text-slate-400 group-hover:text-white'
                }`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className={`font-medium ${currentView === item.id ? 'text-white' : 'text-slate-300'
                  }`}>
                  {item.label}
                </div>
                <div className="text-xs text-slate-400">
                  {item.description}
                </div>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 transition-transform ${currentView === item.id ? 'rotate-90 text-blue-400' : 'text-slate-500'
              }`} />
          </button>
        ))}
      </nav>

      {/* Status */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
          <Activity className="w-5 h-5 text-green-400" />
          <div>
            <div className="text-sm font-medium text-green-400">System Active</div>
            <div className="text-xs text-slate-400">All services running</div>
          </div>
        </div>
      </div>
    </div>
  );
};