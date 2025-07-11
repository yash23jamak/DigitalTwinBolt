"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictionService = exports.PredictionService = void 0;
const azure_1 = require("./azure");
const logger_1 = require("../utils/logger");
class PredictionService {
    async requestPrediction(request) {
        try {
            logger_1.logger.info(`Prediction requested for model ${request.modelId}, type: ${request.analysisType}`);
            const sensorData = await this.getHistoricalSensorData(request.modelId, request.timeframe);
            let predictions = [];
            let confidence = 0;
            switch (request.analysisType) {
                case 'ANOMALY_DETECTION':
                    predictions = await this.performAnomalyDetection(sensorData);
                    confidence = 0.85;
                    break;
                case 'FAILURE_PREDICTION':
                    predictions = await this.performFailurePrediction(sensorData);
                    confidence = 0.78;
                    break;
                case 'PERFORMANCE_FORECAST':
                    predictions = await this.performPerformanceForecast(sensorData);
                    confidence = 0.82;
                    break;
                case 'MAINTENANCE_SCHEDULE':
                    predictions = await this.performMaintenanceScheduling(sensorData);
                    confidence = 0.75;
                    break;
                case 'ENERGY_OPTIMIZATION':
                    predictions = await this.performEnergyOptimization(sensorData);
                    confidence = 0.80;
                    break;
                default:
                    throw new Error(`Unsupported analysis type: ${request.analysisType}`);
            }
            const analysis = {
                id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                modelId: request.modelId,
                analysisType: request.analysisType,
                predictions,
                confidence,
                timeframe: request.timeframe,
                generatedAt: new Date(),
                parameters: request.parameters || {}
            };
            await azure_1.azureServices.createDocument('predictions', analysis);
            logger_1.logger.info(`Prediction analysis completed for model ${request.modelId}`);
            return analysis;
        }
        catch (error) {
            logger_1.logger.error('Error in prediction service:', error);
            throw new Error('Failed to generate predictions');
        }
    }
    async getHistoricalSensorData(modelId, timeframe) {
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
        WHERE c.modelId = @modelId 
        AND c.timestamp >= @startDate 
        AND c.timestamp <= @endDate 
        ORDER BY c.timestamp DESC
      `;
            const parameters = [
                { name: '@modelId', value: modelId },
                { name: '@startDate', value: startDate.toISOString() },
                { name: '@endDate', value: endDate.toISOString() }
            ];
            return await azure_1.azureServices.queryDocuments('sensorData', query, parameters);
        }
        catch (error) {
            logger_1.logger.error('Error getting historical sensor data:', error);
            return [];
        }
    }
    async performAnomalyDetection(sensorData) {
        try {
            if (sensorData.length === 0) {
                return [];
            }
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
            const predictions = [];
            for (const [sensorType, data] of Object.entries(groupedData)) {
                try {
                }
                catch (error) {
                    logger_1.logger.warn(`Anomaly detection failed for sensor type ${sensorType}:`, error);
                }
            }
            return predictions;
        }
        catch (error) {
            logger_1.logger.error('Error in anomaly detection:', error);
            return this.generateMockPredictions('anomaly');
        }
    }
    async performFailurePrediction(sensorData) {
        return this.generateMockPredictions('failure');
    }
    async performPerformanceForecast(sensorData) {
        return this.generateMockPredictions('performance');
    }
    async performMaintenanceScheduling(sensorData) {
        return this.generateMockPredictions('maintenance');
    }
    async performEnergyOptimization(sensorData) {
        return this.generateMockPredictions('energy');
    }
    calculateTrend(data) {
        if (data.length < 2)
            return 'STABLE';
        const values = data.map(d => d.value);
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const difference = secondAvg - firstAvg;
        const threshold = firstAvg * 0.05;
        if (Math.abs(difference) < threshold)
            return 'STABLE';
        if (difference > threshold)
            return 'INCREASING';
        if (difference < -threshold)
            return 'DECREASING';
        const variance = values.reduce((acc, val) => acc + Math.pow(val - firstAvg, 2), 0) / values.length;
        if (variance > firstAvg * 0.1)
            return 'VOLATILE';
        return 'STABLE';
    }
    generateMockPredictions(type) {
        const parameters = ['temperature', 'vibration', 'pressure', 'flow', 'power'];
        const predictions = [];
        parameters.forEach(param => {
            predictions.push({
                parameter: param,
                predictedValue: Math.random() * 100,
                confidence: 0.7 + Math.random() * 0.3,
                timestamp: new Date(Date.now() + Math.random() * 86400000),
                trend: ['INCREASING', 'DECREASING', 'STABLE', 'VOLATILE'][Math.floor(Math.random() * 4)]
            });
        });
        return predictions;
    }
    async getPredictiveAnalyses(modelId) {
        try {
            const query = `
        SELECT * FROM c
        WHERE c.modelId = @modelId
        ORDER BY c.generatedAt DESC
      `;
            const parameters = [
                { name: '@modelId', value: modelId }
            ];
            return await azure_1.azureServices.queryDocuments('predictions', query, parameters);
        }
        catch (error) {
            logger_1.logger.error('Error getting predictive analyses:', error);
            return [];
        }
    }
    async runScheduledAnalysis() {
        try {
            logger_1.logger.info('Running scheduled predictive analysis...');
            const modelsQuery = 'SELECT * FROM c WHERE c.status = @status';
            const modelsParams = [{ name: '@status', value: 'ACTIVE' }];
            const models = await azure_1.azureServices.queryDocuments('models', modelsQuery, modelsParams);
            for (const model of models) {
                try {
                    await this.requestPrediction({
                        modelId: model.id,
                        analysisType: 'ANOMALY_DETECTION',
                        timeframe: '24h'
                    });
                    await this.requestPrediction({
                        modelId: model.id,
                        analysisType: 'FAILURE_PREDICTION',
                        timeframe: '7d'
                    });
                }
                catch (error) {
                    logger_1.logger.error(`Error running analysis for model ${model.id}:`, error);
                }
            }
            logger_1.logger.info('Scheduled predictive analysis completed');
        }
        catch (error) {
            logger_1.logger.error('Error in scheduled predictive analysis:', error);
            throw error;
        }
    }
}
exports.PredictionService = PredictionService;
exports.predictionService = new PredictionService();
//# sourceMappingURL=predictionService.js.map