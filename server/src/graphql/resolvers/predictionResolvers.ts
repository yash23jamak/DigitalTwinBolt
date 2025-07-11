import { predictionService } from '../../services/predictionService';
import { azureServices } from '../../services/azure';
import { logger } from '../../utils/logger';

export const predictionResolvers = {
    Query: {
        predictiveAnalysis: async (_: any, { modelId }: any) => {
            try {
                return await predictionService.getPredictiveAnalyses(modelId);
            } catch (error) {
                logger.error('Error fetching predictive analysis:', error);
                throw new Error('Failed to fetch predictive analysis');
            }
        },

        anomalyDetection: async (_: any, { deviceId, timeframe }: any) => {
            try {
                // Get historical sensor data for the device
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

                const sensorData = await azureServices.queryDocuments('sensorData', query, parameters);

                // Group data by sensor type and detect anomalies
                const anomalies: any = {};
                const groupedData = sensorData.reduce((acc: any, data: any) => {
                    if (!acc[data.sensorType]) {
                        acc[data.sensorType] = [];
                    }
                    acc[data.sensorType].push({
                        timestamp: new Date(data.timestamp),
                        value: data.value
                    });
                    return acc;
                }, {});

                // Use Azure Anomaly Detector for each sensor type
                for (const [sensorType, data] of Object.entries(groupedData)) {
                    try {
                        if ((data as any[]).length > 12) { // Minimum data points required
                            // const anomalyResult = await azureServices.detectAnomalies(data as any[]);
                            // anomalies[sensorType] = {
                            //     isAnomaly: anomalyResult?.isAnomaly || false,
                            //     expectedValues: anomalyResult?.expectedValues || [],
                            //     anomalyScores: anomalyResult?.anomalyScores || [],
                            //     period: anomalyResult?.period || 0
                            // };
                        } else {
                            anomalies[sensorType] = {
                                isAnomaly: false,
                                message: 'Insufficient data for anomaly detection'
                            };
                        }
                    } catch (error) {
                        logger.warn(`Anomaly detection failed for sensor type ${sensorType}:`, error);
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

            } catch (error) {
                logger.error('Error performing anomaly detection:', error);
                throw new Error('Failed to perform anomaly detection');
            }
        },

        performanceMetrics: async (_: any, { modelId, timeframe }: any) => {
            try {
                // Get devices associated with the model
                const devicesQuery = `SELECT * FROM c WHERE c.modelId = @modelId`;
                const devicesParams = [{ name: '@modelId', value: modelId }];
                const devices = await azureServices.queryDocuments('devices', devicesQuery, devicesParams);

                if (devices.length === 0) {
                    return {
                        modelId,
                        timeframe,
                        metrics: {},
                        message: 'No devices found for this model'
                    };
                }

                // Calculate date range
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

                // Get sensor data for all devices
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

                const sensorData = await azureServices.queryDocuments('sensorData', sensorDataQuery, sensorDataParams);

                // Calculate performance metrics
                const metrics: any = {
                    totalDataPoints: sensorData.length,
                    averageValues: {},
                    trends: {},
                    healthScore: 0,
                    uptime: 0,
                    efficiency: 0
                };

                // Group by sensor type and calculate averages
                const groupedData = sensorData.reduce((acc: any, data: any) => {
                    if (!acc[data.sensorType]) {
                        acc[data.sensorType] = [];
                    }
                    acc[data.sensorType].push(data.value);
                    return acc;
                }, {});

                Object.entries(groupedData).forEach(([sensorType, values]: [string, any]) => {
                    const avg = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
                    metrics.averageValues[sensorType] = Math.round(avg * 100) / 100;

                    // Simple trend calculation
                    const firstHalf = values.slice(0, Math.floor(values.length / 2));
                    const secondHalf = values.slice(Math.floor(values.length / 2));
                    const firstAvg = firstHalf.reduce((sum: number, val: number) => sum + val, 0) / firstHalf.length;
                    const secondAvg = secondHalf.reduce((sum: number, val: number) => sum + val, 0) / secondHalf.length;

                    metrics.trends[sensorType] = secondAvg > firstAvg ? 'INCREASING' :
                        secondAvg < firstAvg ? 'DECREASING' : 'STABLE';
                });

                // Calculate health score (mock calculation)
                const onlineDevices = devices.filter(d => d.status === 'ONLINE').length;
                metrics.healthScore = Math.round((onlineDevices / devices.length) * 100);
                metrics.uptime = Math.round(Math.random() * 100); // Mock uptime
                metrics.efficiency = Math.round(Math.random() * 100); // Mock efficiency

                return {
                    modelId,
                    timeframe,
                    metrics,
                    calculatedAt: new Date()
                };

            } catch (error) {
                logger.error('Error calculating performance metrics:', error);
                throw new Error('Failed to calculate performance metrics');
            }
        }
    },

    Mutation: {
        requestPrediction: async (_: any, { input }: any) => {
            try {
                return await predictionService.requestPrediction(input);
            } catch (error) {
                logger.error('Error requesting prediction:', error);
                throw new Error('Failed to request prediction');
            }
        },

        runAnomalyDetection: async (_: any, { deviceId, timeframe }: any) => {
            try {
                // This is similar to the query version but triggers a new analysis
                const result = await predictionService.requestPrediction({
                    modelId: deviceId, // Using deviceId as modelId for this context
                    analysisType: 'ANOMALY_DETECTION',
                    timeframe,
                    parameters: { deviceId }
                });

                return {
                    deviceId,
                    timeframe,
                    analysisId: result.id,
                    anomalies: result.predictions.reduce((acc: any, pred: any) => {
                        acc[pred.parameter] = {
                            isAnomaly: pred.trend === 'VOLATILE',
                            confidence: pred.confidence,
                            predictedValue: pred.predictedValue
                        };
                        return acc;
                    }, {}),
                    analyzedAt: result.generatedAt
                };

            } catch (error) {
                logger.error('Error running anomaly detection:', error);
                throw new Error('Failed to run anomaly detection');
            }
        }
    }
};