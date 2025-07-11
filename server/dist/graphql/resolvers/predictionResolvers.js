"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictionResolvers = void 0;
const predictionService_1 = require("../../services/predictionService");
const azure_1 = require("../../services/azure");
const logger_1 = require("../../utils/logger");
exports.predictionResolvers = {
    Query: {
        predictiveAnalysis: async (_, { modelId }) => {
            try {
                return await predictionService_1.predictionService.getPredictiveAnalyses(modelId);
            }
            catch (error) {
                logger_1.logger.error('Error fetching predictive analysis:', error);
                throw new Error('Failed to fetch predictive analysis');
            }
        },
        anomalyDetection: async (_, { deviceId, timeframe }) => {
            try {
                const endDate = new Date();
                const startDate = new Date();
                switch (timeframe) {
                    case '1h':
                        startDate.setHours(endDate.getHours() - 1);
                        break;
                    case '24h':
                        startDate.setDate(endDate.getDate() - 1);
                        break;
                    case '7d':
                        startDate.setDate(endDate.getDate() - 7);
                        break;
                    case '30d':
                        startDate.setDate(endDate.getDate() - 30);
                        break;
                    default:
                        startDate.setDate(endDate.getDate() - 7);
                }
                const query = `
          SELECT * FROM c 
          WHERE c.deviceId = @deviceId 
          AND c.timestamp >= @startDate 
          AND c.timestamp <= @endDate 
          ORDER BY c.timestamp ASC
        `;
                const parameters = [
                    { name: '@deviceId', value: deviceId },
                    { name: '@startDate', value: startDate.toISOString() },
                    { name: '@endDate', value: endDate.toISOString() }
                ];
                const sensorData = await azure_1.azureServices.queryDocuments('sensorData', query, parameters);
                const anomalies = {};
                const groupedData = sensorData.reduce((acc, data) => {
                    if (!acc[data.sensorType]) {
                        acc[data.sensorType] = [];
                    }
                    acc[data.sensorType].push({
                        timestamp: new Date(data.timestamp),
                        value: data.value
                    });
                    return acc;
                }, {});
                for (const [sensorType, data] of Object.entries(groupedData)) {
                    try {
                        if (data.length > 12) {
                        }
                        else {
                            anomalies[sensorType] = {
                                isAnomaly: false,
                                message: 'Insufficient data for anomaly detection'
                            };
                        }
                    }
                    catch (error) {
                        logger_1.logger.warn(`Anomaly detection failed for sensor type ${sensorType}:`, error);
                        anomalies[sensorType] = {
                            isAnomaly: false,
                            error: 'Anomaly detection service unavailable'
                        };
                    }
                }
                return {
                    deviceId,
                    timeframe,
                    anomalies,
                    dataPoints: sensorData.length,
                    analyzedAt: new Date()
                };
            }
            catch (error) {
                logger_1.logger.error('Error performing anomaly detection:', error);
                throw new Error('Failed to perform anomaly detection');
            }
        },
        performanceMetrics: async (_, { modelId, timeframe }) => {
            try {
                const devicesQuery = `SELECT * FROM c WHERE c.modelId = @modelId`;
                const devicesParams = [{ name: '@modelId', value: modelId }];
                const devices = await azure_1.azureServices.queryDocuments('devices', devicesQuery, devicesParams);
                if (devices.length === 0) {
                    return {
                        modelId,
                        timeframe,
                        metrics: {},
                        message: 'No devices found for this model'
                    };
                }
                const endDate = new Date();
                const startDate = new Date();
                switch (timeframe) {
                    case '1h':
                        startDate.setHours(endDate.getHours() - 1);
                        break;
                    case '24h':
                        startDate.setDate(endDate.getDate() - 1);
                        break;
                    case '7d':
                        startDate.setDate(endDate.getDate() - 7);
                        break;
                    case '30d':
                        startDate.setDate(endDate.getDate() - 30);
                        break;
                    default:
                        startDate.setDate(endDate.getDate() - 7);
                }
                const deviceIds = devices.map(d => d.id);
                const sensorDataQuery = `
          SELECT * FROM c 
          WHERE c.deviceId IN (${deviceIds.map((_, i) => `@deviceId${i}`).join(', ')})
          AND c.timestamp >= @startDate 
          AND c.timestamp <= @endDate
        `;
                const sensorDataParams = [
                    ...deviceIds.map((id, i) => ({ name: `@deviceId${i}`, value: id })),
                    { name: '@startDate', value: startDate.toISOString() },
                    { name: '@endDate', value: endDate.toISOString() }
                ];
                const sensorData = await azure_1.azureServices.queryDocuments('sensorData', sensorDataQuery, sensorDataParams);
                const metrics = {
                    totalDataPoints: sensorData.length,
                    averageValues: {},
                    trends: {},
                    healthScore: 0,
                    uptime: 0,
                    efficiency: 0
                };
                const groupedData = sensorData.reduce((acc, data) => {
                    if (!acc[data.sensorType]) {
                        acc[data.sensorType] = [];
                    }
                    acc[data.sensorType].push(data.value);
                    return acc;
                }, {});
                Object.entries(groupedData).forEach(([sensorType, values]) => {
                    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
                    metrics.averageValues[sensorType] = Math.round(avg * 100) / 100;
                    const firstHalf = values.slice(0, Math.floor(values.length / 2));
                    const secondHalf = values.slice(Math.floor(values.length / 2));
                    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
                    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
                    metrics.trends[sensorType] = secondAvg > firstAvg ? 'INCREASING' :
                        secondAvg < firstAvg ? 'DECREASING' : 'STABLE';
                });
                const onlineDevices = devices.filter(d => d.status === 'ONLINE').length;
                metrics.healthScore = Math.round((onlineDevices / devices.length) * 100);
                metrics.uptime = Math.round(Math.random() * 100);
                metrics.efficiency = Math.round(Math.random() * 100);
                return {
                    modelId,
                    timeframe,
                    metrics,
                    calculatedAt: new Date()
                };
            }
            catch (error) {
                logger_1.logger.error('Error calculating performance metrics:', error);
                throw new Error('Failed to calculate performance metrics');
            }
        }
    },
    Mutation: {
        requestPrediction: async (_, { input }) => {
            try {
                return await predictionService_1.predictionService.requestPrediction(input);
            }
            catch (error) {
                logger_1.logger.error('Error requesting prediction:', error);
                throw new Error('Failed to request prediction');
            }
        },
        runAnomalyDetection: async (_, { deviceId, timeframe }) => {
            try {
                const result = await predictionService_1.predictionService.requestPrediction({
                    modelId: deviceId,
                    analysisType: 'ANOMALY_DETECTION',
                    timeframe,
                    parameters: { deviceId }
                });
                return {
                    deviceId,
                    timeframe,
                    analysisId: result.id,
                    anomalies: result.predictions.reduce((acc, pred) => {
                        acc[pred.parameter] = {
                            isAnomaly: pred.trend === 'VOLATILE',
                            confidence: pred.confidence,
                            predictedValue: pred.predictedValue
                        };
                        return acc;
                    }, {}),
                    analyzedAt: result.generatedAt
                };
            }
            catch (error) {
                logger_1.logger.error('Error running anomaly detection:', error);
                throw new Error('Failed to run anomaly detection');
            }
        }
    }
};
//# sourceMappingURL=predictionResolvers.js.map