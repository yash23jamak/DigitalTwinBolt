import { DigitalTwinModel, GeospatialCoordinates } from './models';

// Component Props Types
export interface ModelViewerProps {
  model: DigitalTwinModel | null;
  models: DigitalTwinModel[];
  onModelSelect: (model: DigitalTwinModel) => void;
}

export interface ModelLibraryProps {
  models: DigitalTwinModel[];
  onModelSelect: (model: DigitalTwinModel) => void;
  onModelDelete: (model: DigitalTwinModel) => void;
}

export interface FileUploadProps {
  onModelUpload: (model: DigitalTwinModel) => void;
}

export interface ArcGISMapProps {
  models: DigitalTwinModel[];
  selectedModel: DigitalTwinModel | null;
  onModelSelect: (model: DigitalTwinModel) => void;
  onLocationSelect: (coordinates: { latitude: number; longitude: number }) => void;
  onModelUpdate: (model: DigitalTwinModel) => void;
  onModelDelete?: (model: DigitalTwinModel) => void;
}

export interface GeospatialModelManagerProps {
  models: DigitalTwinModel[];
  selectedModel: DigitalTwinModel | null;
  onModelUpdate: (model: DigitalTwinModel) => void;
}

export interface DashboardProps {
  models: DigitalTwinModel[];
  selectedModel: DigitalTwinModel | null;
}

export interface SidebarProps {
  currentView: 'viewer' | 'dashboard' | 'upload' | 'library' | 'gis';
  onViewChange: (view: 'viewer' | 'dashboard' | 'upload' | 'library' | 'gis') => void;
  modelCount: number;
}

export interface ViewSyncControlsProps {
  models: DigitalTwinModel[];
  selectedModel: DigitalTwinModel | null;
  currentView: 'viewer' | 'gis';
  onModelSelect: (model: DigitalTwinModel) => void;
}

export interface SpatialAnalysisToolsProps {
  models: DigitalTwinModel[];
  selectedModel: DigitalTwinModel | null;
  onLocationSelect: (coordinates: { latitude: number; longitude: number }) => void;
}

export interface RealTimeDataVisualizationProps {
  models: DigitalTwinModel[];
  selectedModel: DigitalTwinModel | null;
}

export interface LocationPickerProps {
  onLocationSelect: (coordinates: GeospatialCoordinates) => void;
  initialCoordinates?: GeospatialCoordinates;
}

// UI State Types
export interface MapSettings {
  basemap: 'streets' | 'satellite' | 'hybrid' | 'terrain';
  viewType: '2d' | '3d';
  showModels: boolean;
  showAnalysis: boolean;
}

export interface PlacementForm {
  latitude: string;
  longitude: string;
  elevation: string;
  scale: string;
  rotationX: string;
  rotationY: string;
  rotationZ: string;
}

// Sorting and Filtering Types
export type SortField = 'name' | 'uploadDate' | 'size' | 'type';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';
export type LightingPreset = 'studio' | 'sunset' | 'city';
export type ViewType = 'viewer' | 'dashboard' | 'upload' | 'library' | 'gis' | 'faults' | 'sensors' | 'users';
