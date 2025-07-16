// Environment configuration with type safety
interface Environment {
  app: {
    name: string;
    apiUrl: string;
    socketUrl: string;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  arcgis: {
    apiKey: string;
  };
  features: {
    realTimeData: boolean;
    spatialAnalysis: boolean;
    aiPredictions: boolean;
  };
  analytics: {
    enabled: boolean;
  };
}

export const env: Environment = {
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Digital Twin Platform',
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:4000/graphql',
    socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000',
    logLevel: (import.meta.env.VITE_LOG_LEVEL as Environment['app']['logLevel']) || 'info',
  },
  arcgis: {
    apiKey: import.meta.env.VITE_ARCGIS_API_KEY || '',
  },
  features: {
    realTimeData: import.meta.env.VITE_FEATURE_REAL_TIME_DATA === 'true',
    spatialAnalysis: import.meta.env.VITE_FEATURE_SPATIAL_ANALYSIS === 'true',
    aiPredictions: import.meta.env.VITE_FEATURE_AI_PREDICTIONS === 'true',
  },
  analytics: {
    enabled: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  },
};

// Validate required environment variables
export function validateEnvironment(): string[] {
  const errors: string[] = [];

  if (!env.arcgis.apiKey) {
    errors.push('Missing ArcGIS API key (VITE_ARCGIS_API_KEY)');
  }

  return errors;
}