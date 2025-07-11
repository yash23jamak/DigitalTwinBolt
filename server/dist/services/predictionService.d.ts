export interface PredictionRequest {
    modelId: string;
    analysisType: 'ANOMALY_DETECTION' | 'FAILURE_PREDICTION' | 'PERFORMANCE_FORECAST' | 'MAINTENANCE_SCHEDULE' | 'ENERGY_OPTIMIZATION';
    timeframe: string;
    parameters?: any;
}
export interface Prediction {
    parameter: string;
    predictedValue: number;
    confidence: number;
    timestamp: Date;
    trend: 'INCREASING' | 'DECREASING' | 'STABLE' | 'VOLATILE';
}
export interface PredictiveAnalysis {
    id: string;
    modelId: string;
    analysisType: string;
    predictions: Prediction[];
    confidence: number;
    timeframe: string;
    generatedAt: Date;
    parameters: any;
}
export declare class PredictionService {
    requestPrediction(request: PredictionRequest): Promise<PredictiveAnalysis>;
    private getHistoricalSensorData;
    private performAnomalyDetection;
    private performFailurePrediction;
    private performPerformanceForecast;
    private performMaintenanceScheduling;
    private performEnergyOptimization;
    private calculateTrend;
    private generateMockPredictions;
    getPredictiveAnalyses(modelId: string): Promise<PredictiveAnalysis[]>;
    runScheduledAnalysis(): Promise<void>;
}
export declare const predictionService: PredictionService;
//# sourceMappingURL=predictionService.d.ts.map