export declare const createResolvers: () => Promise<{
    DateTime: import("graphql").GraphQLScalarType<Date, Date>;
    JSON: import("graphql").GraphQLScalarType<any, any>;
    Upload: any;
    Query: {
        dashboardMetrics: (_: any, __: any, { userId }: any) => Promise<{
            totalModels: any;
            activeDevices: any;
            activeFaults: any;
            systemHealth: number;
            dataPoints: any;
            lastUpdated: Date;
        }>;
        systemHealth: (_: any, __: any, { userId }: any) => Promise<{
            overall: number;
            components: {
                name: string;
                status: string;
                health: number;
                lastChecked: Date;
            }[];
            trends: {
                timestamp: Date;
                value: number;
            }[];
        }>;
        notifications: (_: any, { limit, offset, unreadOnly }: any, { userId }: any) => Promise<import("../../services/notificationService").Notification[]>;
        notification: (_: any, { id }: any, { userId }: any) => Promise<import("../../services/notificationService").Notification | null>;
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
        faults: (_: any, { limit, offset, status }: any) => Promise<import("../../services/faultDetectionService").DetectedFault[]>;
        fault: (_: any, { id }: any) => Promise<import("../../services/faultDetectionService").DetectedFault | null>;
        faultsByModel: (_: any, { modelId }: any) => Promise<any[]>;
        faultsByDevice: (_: any, { deviceId }: any) => Promise<any[]>;
        devices: (_: any, { limit, offset }: any) => Promise<any[]>;
        device: (_: any, { id }: any) => Promise<any>;
        devicesByModel: (_: any, { modelId }: any) => Promise<any[]>;
        sensorData: (_: any, { deviceId, from, to }: any) => Promise<unknown[]>;
        models: (_: any, { limit, offset, filter }: any) => Promise<any[]>;
        model: (_: any, { id }: any) => Promise<any>;
        modelsByType: (_: any, { type }: any) => Promise<any[]>;
    };
    Mutation: {
        markNotificationRead: (_: any, { id }: any, { userId }: any) => Promise<import("../../services/notificationService").Notification | null>;
        markAllNotificationsRead: (_: any, __: any, { userId }: any) => Promise<boolean>;
        deleteNotification: (_: any, { id }: any, { userId }: any) => Promise<boolean>;
        requestPrediction: (_: any, { input }: any) => Promise<import("../../services/predictionService").PredictiveAnalysis>;
        runAnomalyDetection: (_: any, { deviceId, timeframe }: any) => Promise<{
            deviceId: any;
            timeframe: any;
            analysisId: string;
            anomalies: any;
            analyzedAt: Date;
        }>;
        createFault: (_: any, { input }: any, { userId }: any) => Promise<any>;
        acknowledgeFault: (_: any, { id }: any, { userId }: any) => Promise<import("../../services/faultDetectionService").DetectedFault>;
        resolveFault: (_: any, { id, resolution }: any, { userId }: any) => Promise<import("../../services/faultDetectionService").DetectedFault>;
        createDevice: (_: any, { input }: any, { userId }: any) => Promise<any>;
        updateDevice: (_: any, { id, input }: any) => Promise<any>;
        deleteDevice: (_: any, { id }: any) => Promise<boolean>;
        addSensorData: (_: any, { input }: any) => Promise<any>;
        bulkAddSensorData: (_: any, { inputs }: any) => Promise<any[]>;
        uploadModel: (_: any, { file, input }: any, { userId }: any) => Promise<any>;
        updateModel: (_: any, { id, input }: any) => Promise<any>;
        deleteModel: (_: any, { id }: any) => Promise<boolean>;
        processModel: (_: any, { id }: any) => Promise<boolean>;
    };
    Subscription: {
        systemHealthUpdated: {
            subscribe: () => any;
        };
        notificationReceived: {
            subscribe: import("graphql-subscriptions").IterableResolverFn<any, any, any>;
        };
        faultDetected: {
            subscribe: () => any;
        };
        sensorDataUpdated: {
            subscribe: import("graphql-subscriptions").IterableResolverFn<any, any, any>;
        };
        deviceStatusChanged: {
            subscribe: () => any;
        };
    };
}>;
export declare const resolvers: Promise<{
    DateTime: import("graphql").GraphQLScalarType<Date, Date>;
    JSON: import("graphql").GraphQLScalarType<any, any>;
    Upload: any;
    Query: {
        dashboardMetrics: (_: any, __: any, { userId }: any) => Promise<{
            totalModels: any;
            activeDevices: any;
            activeFaults: any;
            systemHealth: number;
            dataPoints: any;
            lastUpdated: Date;
        }>;
        systemHealth: (_: any, __: any, { userId }: any) => Promise<{
            overall: number;
            components: {
                name: string;
                status: string;
                health: number;
                lastChecked: Date;
            }[];
            trends: {
                timestamp: Date;
                value: number;
            }[];
        }>;
        notifications: (_: any, { limit, offset, unreadOnly }: any, { userId }: any) => Promise<import("../../services/notificationService").Notification[]>;
        notification: (_: any, { id }: any, { userId }: any) => Promise<import("../../services/notificationService").Notification | null>;
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
        faults: (_: any, { limit, offset, status }: any) => Promise<import("../../services/faultDetectionService").DetectedFault[]>;
        fault: (_: any, { id }: any) => Promise<import("../../services/faultDetectionService").DetectedFault | null>;
        faultsByModel: (_: any, { modelId }: any) => Promise<any[]>;
        faultsByDevice: (_: any, { deviceId }: any) => Promise<any[]>;
        devices: (_: any, { limit, offset }: any) => Promise<any[]>;
        device: (_: any, { id }: any) => Promise<any>;
        devicesByModel: (_: any, { modelId }: any) => Promise<any[]>;
        sensorData: (_: any, { deviceId, from, to }: any) => Promise<unknown[]>;
        models: (_: any, { limit, offset, filter }: any) => Promise<any[]>;
        model: (_: any, { id }: any) => Promise<any>;
        modelsByType: (_: any, { type }: any) => Promise<any[]>;
    };
    Mutation: {
        markNotificationRead: (_: any, { id }: any, { userId }: any) => Promise<import("../../services/notificationService").Notification | null>;
        markAllNotificationsRead: (_: any, __: any, { userId }: any) => Promise<boolean>;
        deleteNotification: (_: any, { id }: any, { userId }: any) => Promise<boolean>;
        requestPrediction: (_: any, { input }: any) => Promise<import("../../services/predictionService").PredictiveAnalysis>;
        runAnomalyDetection: (_: any, { deviceId, timeframe }: any) => Promise<{
            deviceId: any;
            timeframe: any;
            analysisId: string;
            anomalies: any;
            analyzedAt: Date;
        }>;
        createFault: (_: any, { input }: any, { userId }: any) => Promise<any>;
        acknowledgeFault: (_: any, { id }: any, { userId }: any) => Promise<import("../../services/faultDetectionService").DetectedFault>;
        resolveFault: (_: any, { id, resolution }: any, { userId }: any) => Promise<import("../../services/faultDetectionService").DetectedFault>;
        createDevice: (_: any, { input }: any, { userId }: any) => Promise<any>;
        updateDevice: (_: any, { id, input }: any) => Promise<any>;
        deleteDevice: (_: any, { id }: any) => Promise<boolean>;
        addSensorData: (_: any, { input }: any) => Promise<any>;
        bulkAddSensorData: (_: any, { inputs }: any) => Promise<any[]>;
        uploadModel: (_: any, { file, input }: any, { userId }: any) => Promise<any>;
        updateModel: (_: any, { id, input }: any) => Promise<any>;
        deleteModel: (_: any, { id }: any) => Promise<boolean>;
        processModel: (_: any, { id }: any) => Promise<boolean>;
    };
    Subscription: {
        systemHealthUpdated: {
            subscribe: () => any;
        };
        notificationReceived: {
            subscribe: import("graphql-subscriptions").IterableResolverFn<any, any, any>;
        };
        faultDetected: {
            subscribe: () => any;
        };
        sensorDataUpdated: {
            subscribe: import("graphql-subscriptions").IterableResolverFn<any, any, any>;
        };
        deviceStatusChanged: {
            subscribe: () => any;
        };
    };
}>;
//# sourceMappingURL=index.d.ts.map