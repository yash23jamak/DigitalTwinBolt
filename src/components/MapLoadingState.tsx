import React from 'react';

interface MapLoadingStateProps {
  isLoading: boolean;
  viewType: '2d' | '3d';
}

export const MapLoadingState: React.FC<MapLoadingStateProps> = ({ isLoading, viewType }) => {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4 p-8 bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700/50">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-white font-medium">Loading ArcGIS Map...</div>
        <div className="text-slate-400 text-sm">
          Initializing {viewType.toUpperCase()} view
        </div>
      </div>
    </div>
  );
};
