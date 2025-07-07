import { azureServices } from './azure';
import { logger } from '../utils/logger';

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

export class PredictionService {
  async requestPrediction(request: PredictionRequest): Promise<PredictiveAnalysis> {
    try {
      logger.info(`Prediction requested for model ${request.modelId}, type: ${request.analysisType}`);

      // Get historical sensor data for the model
      const sensorData = await this.getHistoricalSensorData(request.modelId, request.timeframe);

      let predictions: Prediction[] = [];
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

      const analysis: PredictiveAnalysis = {
        id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        modelId: request.modelId,
        analysisType: request.analysisType,
        predictions,
        confidence,
        timeframe: request.timeframe,
        generatedAt: new Date(),
        parameters: request.parameters || {}
      };

      // Store analysis in Cosmos DB
      await azureServices.createDocument('predictions', analysis);

      logger.info(`Prediction analysis completed for model ${request.modelId}`);
      return analysis;

    } catch (error) {
      logger.error('Error in prediction service:', error);
      throw new Error('Failed to generate predictions');
    }
  }

  private async getHistoricalSensorData(modelId: string, timeframe: string): Promise<any[]> {
    try {
      // Calculate date range based on timeframe
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

      return await azureServices.queryDocuments('sensorData', query, parameters);

    } catch (error) {
      logger.error('Error getting historical sensor data:', error);
      return [];
    }
  }

  private async performAnomalyDetection(sensorData: any[]): Promise<Prediction[]> {
    try {
      if (sensorData.length === 0) {
        return [];
      }

      // Group data by sensor type
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

      const predictions: Prediction[] = [];

      // Use Azure Anomaly Detector for each sensor type
      for (const [sensorType, data] of Object.entries(groupedData)) {
        try {
          const anomalyResult = await azureServices.detectAnomalies(data as any[]);
          
          if (anomalyResult && anomalyResult.isAnomaly) {
            predictions.push({
              parameter: sensorType,
              predictedValue: anomalyResult.expectedValue || 0,
              confidence: 0.85,
              timestamp: new Date(),
              trend: this.calculateTrend(data as any[])
            });
          }
        } catch (error) {
          logger.warn(`Anomaly detection failed for sensor type ${sensorType}:`, error);
        }
      }

      return predictions;

    } catch (error) {
      logger.error('Error in anomaly detection:', error);
      return this.generateMockPredictions('anomaly');
    }
  }

  private async performFailurePrediction(sensorData: any[]): Promise<Prediction[]> {
    // Mock implementation - in production, this would use ML models
    return this.generateMockPredictions('failure');
  }

  private async performPerformanceForecast(sensorData: any[]): Promise<Prediction[]> {
    // Mock implementation - in production, this would use ML models
    return this.generateMockPredictions('performance');
  }

  private async performMaintenanceScheduling(sensorData: any[]): Promise<Prediction[]> {
    // Mock implementation - in production, this would use ML models
    return this.generateMockPredictions('maintenance');
  }

  private async performEnergyOptimization(sensorData: any[]): Promise<Prediction[]> {
    // Mock implementation - in production, this would use ML models
    return this.generateMockPredictions('energy');
  }

  private calculateTrend(data: any[]): 'INCREASING' | 'DECREASING' | 'STABLE' | 'VOLATILE' {
    if (data.length < 2) return 'STABLE';

    const values = data.map(d => d.value);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;
    const threshold = firstAvg * 0.05; // 5% threshold

    if (Math.abs(difference) < threshold) return 'STABLE';
    if (difference > threshold) return 'INCREASING';
    if (difference < -threshold) return 'DECREASING';

    // Check for volatility
    const variance = values.reduce((acc, val) => acc + Math.pow(val - firstAvg, 2), 0) / values.length;
    if (variance > firstAvg * 0.1) return 'VOLATILE';

    return 'STABLE';
  }

  private generateMockPredictions(type: string): Prediction[] {
    const parameters = ['temperature', 'vibration', 'pressure', 'flow', 'power'];
    const predictions: Prediction[] = [];

    parameters.forEach(param => {
      predictions.push({
        parameter: param,
        predictedValue: Math.random() * 100,
        confidence: 0.7 + Math.random() * 0.3,
        timestamp: new Date(Date.now() + Math.random() * 86400000), // Next 24 hours
        trend: ['INCREASING', 'DECREASING', 'STABLE', 'VOLATILE'][Math.floor(Math.random() * 4)] as any
      });
    });

    return predictions;
  }

  async getPredictiveAnalyses(modelId: string): Promise<PredictiveAnalysis[]> {
    try {
      const query = `
        SELECT * FROM c 
        WHERE c.modelId = @modelId 
        ORDER BY c.generatedAt DESC
      `;

      const parameters = [
        { name: '@modelId', value: modelId }
      ];

      return await azureServices.queryDocuments('predictions', query, parameters);

    } catch (error) {
      logger.error('Error getting predictive analyses:', error);
      return [];
    }
  }
}

export const predictionService = new PredictionService();