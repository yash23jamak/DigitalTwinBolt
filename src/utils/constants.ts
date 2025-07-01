import { File, FileText } from 'lucide-react';

// File Upload Constants
export const SUPPORTED_FILE_FORMATS = [
  { ext: 'GLTF/GLB', desc: 'Standard 3D model format', icon: File },
  { ext: 'BIM/IFC', desc: 'Building Information Model', icon: FileText },
  { ext: 'RVT', desc: 'Revit model files', icon: FileText }
];

export const FILE_ACCEPT_TYPES = {
  'model/gltf-binary': ['.glb'],
  'model/gltf+json': ['.gltf'],
  'application/octet-stream': ['.bim', '.ifc', '.rvt']
};

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// Model Viewer Constants
export const LIGHTING_PRESETS = ['studio', 'sunset', 'city'] as const;

export const CAMERA_POSITIONS = {
  DEFAULT: [5, 5, 5] as const,
  TOP: [0, 10, 0] as const,
  FRONT: [0, 0, 10] as const,
  SIDE: [10, 0, 0] as const
};

// Map Constants
export const MAP_BASEMAPS = ['streets', 'satellite', 'hybrid', 'terrain'] as const;
export const MAP_VIEW_TYPES = ['2d', '3d'] as const;

export const DEFAULT_MAP_CENTER = {
  longitude: -118.80500,
  latitude: 34.02700,
  zoom: 13
};

export const DEFAULT_SCENE_CAMERA = {
  position: {
    x: -118.80500,
    y: 34.02700,
    z: 50000
  },
  tilt: 65
};

// Grid and Measurement Constants
export const GRID_SIZE = 20;
export const GRID_DIVISIONS = 20;
export const GRID_COLOR_PRIMARY = '#334155';
export const GRID_COLOR_SECONDARY = '#1e293b';

// Animation Constants
export const ROTATION_SPEED = 0.2;
export const ROTATION_AMPLITUDE = 0.1;

// Notification Constants
export const NOTIFICATION_DURATION = {
  SUCCESS: 5000,
  INFO: 5000,
  WARNING: 7000,
  ERROR: 0 // Persistent
};

// Color Constants
export const COLORS = {
  PRIMARY: '#3b82f6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#06b6d4'
};

// Spatial Analysis Constants
export const DEFAULT_BUFFER_RADIUS = 500; // meters
export const DEFAULT_PROXIMITY_THRESHOLD = 1000; // meters

// Real-time Data Constants
export const SIMULATION_INTERVAL = 5000; // 5 seconds
export const MAX_DATA_POINTS = 100;
export const ALERT_CHECK_INTERVAL = 1000; // 1 second
