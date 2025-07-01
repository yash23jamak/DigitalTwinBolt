import { DigitalTwinModel } from '../App';

export interface ViewSyncEvent {
  type: 'model-selected' | 'location-clicked' | 'view-changed' | 'camera-moved';
  data: any;
  source: 'map' | '3d-viewer' | 'dashboard';
  timestamp: number;
}

export interface CameraPosition {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  zoom?: number;
  bearing?: number;
  pitch?: number;
}

export interface LocationClickEvent {
  coordinates: { latitude: number; longitude: number };
  elevation?: number;
  nearbyModels: DigitalTwinModel[];
}

export interface ModelSelectionEvent {
  model: DigitalTwinModel;
  source: 'map' | '3d-viewer';
  action: 'select' | 'highlight' | 'focus';
}

type EventCallback = (event: ViewSyncEvent) => void;

export class MapModelSyncService {
  private static instance: MapModelSyncService;
  private eventListeners: Map<string, EventCallback[]> = new Map();
  private currentSelectedModel: DigitalTwinModel | null = null;
  private currentCameraPosition: CameraPosition | null = null;
  private syncEnabled: boolean = true;

  private constructor() {}

  public static getInstance(): MapModelSyncService {
    if (!MapModelSyncService.instance) {
      MapModelSyncService.instance = new MapModelSyncService();
    }
    return MapModelSyncService.instance;
  }

  /**
   * Subscribe to sync events
   */
  public subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    
    const listeners = this.eventListeners.get(eventType)!;
    listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Emit a sync event
   */
  public emit(event: ViewSyncEvent): void {
    if (!this.syncEnabled) return;

    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in sync event callback:', error);
      }
    });

    // Update internal state based on event type
    this.updateInternalState(event);
  }

  /**
   * Select a model and sync across views
   */
  public selectModel(model: DigitalTwinModel, source: 'map' | '3d-viewer'): void {
    this.currentSelectedModel = model;
    
    const event: ViewSyncEvent = {
      type: 'model-selected',
      data: {
        model,
        source,
        action: 'select'
      } as ModelSelectionEvent,
      source,
      timestamp: Date.now()
    };

    this.emit(event);
  }

  /**
   * Handle location click on map
   */
  public handleLocationClick(
    coordinates: { latitude: number; longitude: number },
    nearbyModels: DigitalTwinModel[] = [],
    elevation?: number
  ): void {
    const event: ViewSyncEvent = {
      type: 'location-clicked',
      data: {
        coordinates,
        elevation,
        nearbyModels
      } as LocationClickEvent,
      source: 'map',
      timestamp: Date.now()
    };

    this.emit(event);
  }

  /**
   * Sync camera position between views
   */
  public syncCameraPosition(position: CameraPosition, source: 'map' | '3d-viewer'): void {
    this.currentCameraPosition = position;

    const event: ViewSyncEvent = {
      type: 'camera-moved',
      data: position,
      source,
      timestamp: Date.now()
    };

    this.emit(event);
  }

  /**
   * Handle view change (e.g., switching between 2D/3D)
   */
  public handleViewChange(viewType: '2d' | '3d', source: 'map' | '3d-viewer'): void {
    const event: ViewSyncEvent = {
      type: 'view-changed',
      data: { viewType },
      source,
      timestamp: Date.now()
    };

    this.emit(event);
  }

  /**
   * Get currently selected model
   */
  public getCurrentSelectedModel(): DigitalTwinModel | null {
    return this.currentSelectedModel;
  }

  /**
   * Get current camera position
   */
  public getCurrentCameraPosition(): CameraPosition | null {
    return this.currentCameraPosition;
  }

  /**
   * Enable/disable synchronization
   */
  public setSyncEnabled(enabled: boolean): void {
    this.syncEnabled = enabled;
  }

  /**
   * Check if synchronization is enabled
   */
  public isSyncEnabled(): boolean {
    return this.syncEnabled;
  }

  /**
   * Focus on a model in both views
   */
  public focusOnModel(model: DigitalTwinModel): void {
    if (!model.coordinates) {
      console.warn('Cannot focus on model without coordinates:', model.name);
      return;
    }

    // Calculate appropriate camera position for focusing on the model
    const focusPosition: CameraPosition = {
      position: {
        x: model.coordinates.longitude,
        y: model.coordinates.latitude + 0.001, // Slightly offset for better view
        z: (model.coordinates.elevation || 0) + 100 // 100 meters above
      },
      target: {
        x: model.coordinates.longitude,
        y: model.coordinates.latitude,
        z: model.coordinates.elevation || 0
      },
      zoom: 18, // Close zoom level
      bearing: 0,
      pitch: 45
    };

    this.syncCameraPosition(focusPosition, 'map');
    this.selectModel(model, 'map');
  }

  /**
   * Calculate distance between two geographic points
   */
  public calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Find models near a location
   */
  public findNearbyModels(
    location: { latitude: number; longitude: number },
    models: DigitalTwinModel[],
    radiusMeters: number = 1000
  ): DigitalTwinModel[] {
    return models.filter(model => {
      if (!model.coordinates) return false;
      
      const distance = this.calculateDistance(location, model.coordinates);
      return distance <= radiusMeters;
    });
  }

  /**
   * Create a synchronized view state
   */
  public createSyncState() {
    return {
      selectedModel: this.currentSelectedModel,
      cameraPosition: this.currentCameraPosition,
      syncEnabled: this.syncEnabled,
      timestamp: Date.now()
    };
  }

  /**
   * Restore synchronized view state
   */
  public restoreSyncState(state: any): void {
    if (state.selectedModel) {
      this.currentSelectedModel = state.selectedModel;
    }
    if (state.cameraPosition) {
      this.currentCameraPosition = state.cameraPosition;
    }
    if (typeof state.syncEnabled === 'boolean') {
      this.syncEnabled = state.syncEnabled;
    }
  }

  /**
   * Update internal state based on events
   */
  private updateInternalState(event: ViewSyncEvent): void {
    switch (event.type) {
      case 'model-selected':
        const modelEvent = event.data as ModelSelectionEvent;
        this.currentSelectedModel = modelEvent.model;
        break;
      
      case 'camera-moved':
        this.currentCameraPosition = event.data as CameraPosition;
        break;
      
      default:
        // No state update needed for other event types
        break;
    }
  }

  /**
   * Clear all event listeners (useful for cleanup)
   */
  public clearAllListeners(): void {
    this.eventListeners.clear();
  }

  /**
   * Get debug information
   */
  public getDebugInfo() {
    return {
      listenerCount: Array.from(this.eventListeners.entries()).reduce(
        (total, [type, listeners]) => total + listeners.length,
        0
      ),
      eventTypes: Array.from(this.eventListeners.keys()),
      currentSelectedModel: this.currentSelectedModel?.name || 'None',
      syncEnabled: this.syncEnabled,
      hasCameraPosition: !!this.currentCameraPosition
    };
  }
}

// Export singleton instance
export const mapModelSyncService = MapModelSyncService.getInstance();
