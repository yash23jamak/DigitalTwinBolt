import React from 'react';
import {
  Box,
  BarChart3,
  Upload,
  Library,
  Activity,
  ChevronRight,
  Map,
  AlertTriangle,
  Menu,
  X,
  Settings,
  Users
} from 'lucide-react';
import { palette, responsive } from '../styles/palette';

interface SidebarProps {
  currentView: 'viewer' | 'dashboard' | 'upload' | 'library' | 'gis' | 'faults' | 'sensors' | 'users';
  onViewChange: (view: 'viewer' | 'dashboard' | 'upload' | 'library' | 'gis' | 'faults' | 'sensors' | 'users') => void;
  modelCount: number;
  isOpen?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  modelCount,
  isOpen = true,
  onToggle
}) => {
  const navItems = [
    { id: 'viewer', label: '3D Viewer', icon: Box, description: 'Interactive 3D model viewer' },
    { id: 'gis', label: 'GIS Map', icon: Map, description: 'ArcGIS mapping & geospatial analysis' },
    { id: 'dashboard', label: 'Analytics', icon: BarChart3, description: 'Predictive analysis dashboard' },
    { id: 'faults', label: 'Fault Detection', icon: AlertTriangle, description: 'Real-time fault detection & diagnostics' },
    { id: 'sensors', label: 'Sensors', icon: Activity, description: 'Manage IoT sensors and devices' },
    { id: 'users', label: 'Users', icon: Users, description: 'User management and permissions' },
    { id: 'upload', label: 'Upload', icon: Upload, description: 'Upload new models' },
    { id: 'library', label: 'Library', icon: Library, description: `${modelCount} models available` }
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-700/50 text-white hover:bg-slate-700/90 transition-colors"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-40 
        w-80 lg:w-80 xl:w-96
        bg-slate-800/50 backdrop-blur-xl border-r border-slate-700/50 
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg">
              <Box className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent truncate">
                Digital Twin
              </h1>
              <p className="text-xs md:text-sm text-slate-400 truncate">3D Model Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 md:p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id as any);
                if (onToggle && window.innerWidth < 1024) {
                  onToggle();
                }
              }}
              className={`w-full flex items-center justify-between p-3 md:p-4 rounded-xl transition-all duration-200 group ${
                currentView === item.id
                  ? 'bg-gradient-to-r from-blue-500/20 to-teal-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                  : 'hover:bg-slate-700/30 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                  currentView === item.id
                    ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white'
                    : 'bg-slate-700/50 text-slate-400 group-hover:text-white'
                }`}>
                  <item.icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className={`font-medium text-sm md:text-base truncate ${
                    currentView === item.id ? 'text-white' : 'text-slate-300'
                  }`}>
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {item.description}
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-3 h-3 md:w-4 md:h-4 transition-transform flex-shrink-0 ${
                currentView === item.id ? 'rotate-90 text-blue-400' : 'text-slate-500'
              }`} />
            </button>
          ))}
        </nav>

        {/* Status */}
        <div className="p-3 md:p-4 border-t border-slate-700/50">
          <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
            <Activity className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-green-400">System Active</div>
              <div className="text-xs text-slate-400">All services running</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};