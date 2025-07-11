declare module '@azure/ai-anomaly-detector' {
  import { TokenCredential } from '@azure/core-auth';

  export interface AnomalyDetectorClientOptions {
    endpoint?: string;
    apiVersion?: string;
  }

  export interface DetectRequest {
    series: TimeSeriesPoint[];
    granularity: TimeGranularity;
    customInterval?: number;
    period?: number;
    maxAnomalyRatio?: number;
    sensitivity?: number;
  }

  export interface TimeSeriesPoint {
    timestamp: Date | string;
    value: number;
  }

  export enum TimeGranularity {
    yearly = "yearly",
    monthly = "monthly",
    weekly = "weekly",
    daily = "daily",
    hourly = "hourly",
    minutely = "minutely",
    secondly = "secondly",
    microsecond = "microsecond",
    none = "none"
  }

  export interface DetectResponse {
    period: number;
    expectedValues: number[];
    upperMargins: number[];
    lowerMargins: number[];
    isAnomaly: boolean[];
    isNegativeAnomaly: boolean[];
    isPositiveAnomaly: boolean[];
    severity?: number[];
  }

  export interface DetectLastPointRequest {
    series: TimeSeriesPoint[];
    granularity: TimeGranularity;
    customInterval?: number;
    period?: number;
    maxAnomalyRatio?: number;
    sensitivity?: number;
  }

  export interface DetectLastPointResponse {
    period: number;
    suggestedWindow: number;
    expectedValue: number;
    upperMargin: number;
    lowerMargin: number;
    isAnomaly: boolean;
    isNegativeAnomaly: boolean;
    isPositiveAnomaly: boolean;
    severity?: number;
  }

  export interface DetectChangePointRequest {
    series: TimeSeriesPoint[];
    granularity: TimeGranularity;
    customInterval?: number;
    period?: number;
    stableTrendWindow?: number;
    threshold?: number;
  }

  export interface DetectChangePointResponse {
    period?: number;
    isChangePoint: boolean[];
    confidenceScores: number[];
  }

  export class AnomalyDetectorClient {
    constructor(endpoint: string, credential: TokenCredential, options?: AnomalyDetectorClientOptions);

    detectEntireSeries(body: DetectRequest): Promise<DetectResponse>;
    detectLastPoint(body: DetectLastPointRequest): Promise<DetectLastPointResponse>;
    detectChangePoint(body: DetectChangePointRequest): Promise<DetectChangePointResponse>;
  }
}