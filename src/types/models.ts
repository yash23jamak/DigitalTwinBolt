// Digital Twin Model Types
export interface DigitalTwinModel {
  id: string;
  name: string;
  url: string;
  type: 'gltf' | 'bim';
  uploadDate: Date;
  size: number;
  coordinates?: GeospatialCoordinates;
  metadata?: ModelMetadata;
}

export interface ModelMetadata {
  vertices?: number;
  faces?: number;
  materials?: number;
  animations?: number;
}

export interface GeospatialCoordinates {
  latitude: number;
  longitude: number;
  elevation?: number;
}

export interface ModelPlacement {
  model: DigitalTwinModel;
  coordinates: GeospatialCoordinates;
  scale: number;
  rotation: {
    x: number;
    y: number;
    z: number;
  };
}

// File Upload Types
export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

// Model Viewer Types
export interface SelectedPart {
  name: string;
  type: string;
  material?: string;
  position: THREE.Vector3;
  boundingBox?: THREE.Box3;
  userData?: any;
}

// Import THREE types
import * as THREE from 'three';
