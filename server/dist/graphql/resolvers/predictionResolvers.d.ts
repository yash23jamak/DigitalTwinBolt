export declare const predictionResolvers: {
    Query: {
        predictiveAnalysis: (_: any, { modelId }: any) => Promise<import("../../services/predictionService").PredictiveAnalysis[]>;
        anomalyDetection: (_: any, { deviceId, timeframe }: any) => Promise<{
            deviceId: any;
            timeframe: any;
            anomalies: any;
            dataPoints: number;
            analyzedAt: Date;
        }>;
        performanceMetrics: (_: any, { modelId, timeframe }: any) => Promise<{
            modelId: any;
            timeframe: any;
            metrics: {};
            message: string;
            calculatedAt?: undefined;
        } | {
            modelId: any;
            timeframe: any;
            metrics: any;
            calculatedAt: Date;
            message?: undefined;
        }>;
    };
    Mutation: {
        requestPrediction: (_: any, { input }: any) => Promise<import("../../services/predictionService").PredictiveAnalysis>;
        runAnomalyDetection: (_: any, { deviceId, timeframe }: any) => Promise<{
            deviceId: any;
            timeframe: any;
            analysisId: string;
            anomalies: any;
            analyzedAt: Date;
        }>;
    };
};
//# sourceMappingURL=predictionResolvers.d.ts.map