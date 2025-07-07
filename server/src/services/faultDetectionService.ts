import { azureServices } from './azure';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface FaultRule {
  id: string;
  name: string;
  modelId?: string;
  faultType: 'PERFORMANCE' | 'STRUCTURAL' | 'ENVIRONMENTAL' | 'CONNECTIVITY' | 'DATA_QUALITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  conditions: FaultCondition[];
  isActive: boolean;
  description: string;
  createdAt: Date;
  lastTriggered?: Date;
}

export interface FaultCondition {
  parameter: string;
  operator: 'gt' | 'lt' | 'eq' | 'ne' | 'between' | 'outside';
  value: number | [number, number];
  duration?: number;
}

export interface DetectedFault {
  id: string;
  ruleId: string;
  modelId: string;
  deviceId?: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: 'PERFORMANCE' | 'STRUCTURAL' | 'ENVIRONMENTAL' | 'CONNECTIVITY' | 'DATA_QUALITY';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'FALSE_POSITIVE';
  detectedAt: Date;
  resolvedAt?: Date;
  coordinates?: { latitude: number; longitude: number; elevation?: number };
  affectedComponents: string[];
  diagnosticData: any;
  recommendedActions: string[];
  assignedTo?: string;
}

export class FaultDetectionService {
  private faultRules: Map<string, FaultRule> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    const defaultRules: FaultRule[] = [
      {
        id: 'rule-temp-critical',
        name: 'Critical Temperature Alert',
        faultType: 'ENVIRONMENTAL',
        severity: 'CRITICAL',
        conditions: [
          { parameter: 'temperature', operator: 'gt', value: 85 }
        ],
        isActive: true,
        description: 'Temperature exceeds critical threshold',
        createdAt: new Date()
      },
      {
        id: 'rule-vibration-high',
        name: 'High Vibration Detection',
        faultType: 'STRUCTURAL',
        severity: 'HIGH',
        conditions: [
          { parameter: 'vibration', operator: 'gt', value: 8, duration: 30 }
        ],
        isActive: true,
        description: 'Sustained high vibration levels detected',
        createdAt: new Date()
      },
      {
        id: 'rule-connectivity-loss',
        name: 'Connectivity Loss',
        faultType: 'CONNECTIVITY',
        severity: 'MEDIUM',
        conditions: [
          { parameter: 'signal_strength', operator: 'lt', value: 20 }
        ],
        isActive: true,
        description: 'Poor connectivity detected',
        createdAt: new Date()
      }
    ];

    defaultRules.forEach(rule => this.faultRules.set(rule.id, rule));
  }

  async processSensorData(sensorData: any): Promise<DetectedFault[]> {
    const detectedFaults: DetectedFault[] = [];

    try {
      const applicableRules = Array.from(this.faultRules.values()).filter(
        rule => rule.isActive && (!rule.modelId || rule.modelId === sensorData.modelId)
      );

      for (const rule of applicableRules) {
        const isTriggered = this.evaluateRuleConditions(rule, sensorData);
        
        if (isTriggered) {
          const fault = await this.createFault(rule, sensorData);
          detectedFaults.push(fault);
        }
      }

    } catch (error) {
      logger.error('Error processing sensor data for fault detection:', error);
    }

    return detectedFaults;
  }

  private evaluateRuleConditions(rule: FaultRule, sensorData: any): boolean {
    return rule.conditions.some(condition => {
      const parameterValue = this.getParameterValue(condition.parameter, sensorData);
      if (parameterValue === null) return false;

      switch (condition.operator) {
        case 'gt':
          return parameterValue > (condition.value as number);
        case 'lt':
          return parameterValue < (condition.value as number);
        case 'eq':
          return parameterValue === (condition.value as number);
        case 'ne':
          return parameterValue !== (condition.value as number);
        case 'between':
          const [min, max] = condition.value as [number, number];
          return parameterValue >= min && parameterValue <= max;
        case 'outside':
          const [minOut, maxOut] = condition.value as [number, number];
          return parameterValue < minOut || parameterValue > maxOut;
        default:
          return false;
      }
    });
  }

  private getParameterValue(parameter: string, sensorData: any): number | null {
    switch (parameter) {
      case 'temperature':
        return sensorData.sensorType === 'TEMPERATURE' ? sensorData.value : null;
      case 'vibration':
        return sensorData.sensorType === 'VIBRATION' ? sensorData.value : null;
      case 'flow':
        return sensorData.sensorType === 'FLOW' ? sensorData.value : null;
      case 'pressure':
        return sensorData.sensorType === 'PRESSURE' ? sensorData.value : null;
      case 'humidity':
        return sensorData.sensorType === 'HUMIDITY' ? sensorData.value : null;
      case 'power':
        return sensorData.sensorType === 'POWER' ? sensorData.value : null;
      default:
        return null;
    }
  }

  private async createFault(rule: FaultRule, sensorData: any): Promise<DetectedFault> {
    // Check if similar fault already exists and is active
    const existingFaults = await this.getActiveFaultsByModel(sensorData.modelId);
    const existingFault = existingFaults.find(
      fault => fault.ruleId === rule.id && fault.status === 'ACTIVE'
    );

    if (existingFault) {
      return existingFault; // Don't create duplicate active faults
    }

    const diagnosticData = await this.generateDiagnosticData(sensorData.modelId, rule);
    
    const fault: DetectedFault = {
      id: uuidv4(),
      ruleId: rule.id,
      modelId: sensorData.modelId,
      deviceId: sensorData.deviceId,
      title: rule.name,
      description: `${rule.description} - Value: ${sensorData.value}${sensorData.unit}`,
      severity: rule.severity,
      type: rule.faultType,
      status: 'ACTIVE',
      detectedAt: new Date(),
      coordinates: sensorData.coordinates,
      affectedComponents: [sensorData.sensorType],
      diagnosticData,
      recommendedActions: this.generateRecommendedActions(rule.faultType, rule.severity)
    };

    // Store fault in Cosmos DB
    await azureServices.createDocument('faults', fault);

    // Update rule last triggered time
    rule.lastTriggered = new Date();
    this.faultRules.set(rule.id, rule);

    // Send notification via Service Bus
    await this.sendFaultNotification(fault);

    logger.info(`Fault detected: ${fault.title} for model ${fault.modelId}`);
    return fault;
  }

  private async generateDiagnosticData(modelId: string, rule: FaultRule): Promise<any> {
    try {
      // Get recent sensor data for analysis
      const query = `
        SELECT * FROM c 
        WHERE c.modelId = @modelId 
        AND c.timestamp >= @startTime 
        ORDER BY c.timestamp DESC
      `;

      const startTime = new Date(Date.now() - 3600000); // Last hour
      const parameters = [
        { name: '@modelId', value: modelId },
        { name: '@startTime', value: startTime.toISOString() }
      ];

      const recentData = await azureServices.queryDocuments('sensorData', query, parameters);

      const parameters_data: Record<string, number> = {};
      const trends: Record<string, number[]> = {};

      recentData.forEach(data => {
        const key = data.sensorType;
        if (!parameters_data[key]) {
          parameters_data[key] = data.value;
          trends[key] = [];
        }
        trends[key].push(data.value);
      });

      return {
        parameters: parameters_data,
        trends,
        correlations: [], // TODO: Implement correlation analysis
        rootCause: {
          primaryCause: rule.description,
          contributingFactors: [],
          confidence: 0.8
        }
      };

    } catch (error) {
      logger.error('Error generating diagnostic data:', error);
      return {
        parameters: {},
        trends: {},
        correlations: [],
        rootCause: {
          primaryCause: rule.description,
          contributingFactors: [],
          confidence: 0.5
        }
      };
    }
  }

  private generateRecommendedActions(faultType: string, severity: string): string[] {
    const actions: Record<string, string[]> = {
      ENVIRONMENTAL: [
        'Check environmental controls',
        'Verify sensor calibration',
        'Inspect cooling systems'
      ],
      STRUCTURAL: [
        'Perform structural inspection',
        'Check mounting and connections',
        'Review maintenance schedule'
      ],
      CONNECTIVITY: [
        'Check network connections',
        'Verify signal strength',
        'Restart communication modules'
      ],
      PERFORMANCE: [
        'Monitor system resources',
        'Check for software updates',
        'Review system configuration'
      ],
      DATA_QUALITY: [
        'Validate data sources',
        'Check sensor accuracy',
        'Review data processing pipeline'
      ]
    };

    return actions[faultType] || ['Contact technical support'];
  }

  private async sendFaultNotification(fault: DetectedFault): Promise<void> {
    try {
      const notification = {
        type: 'FAULT_DETECTED',
        faultId: fault.id,
        modelId: fault.modelId,
        severity: fault.severity,
        title: fault.title,
        description: fault.description,
        timestamp: fault.detectedAt
      };

      await azureServices.sendMessage('fault-notifications', notification);
    } catch (error) {
      logger.error('Error sending fault notification:', error);
    }
  }

  async getFaults(limit: number = 50, offset: number = 0, status?: string): Promise<DetectedFault[]> {
    try {
      let query = `SELECT * FROM c ORDER BY c.detectedAt DESC OFFSET ${offset} LIMIT ${limit}`;
      const parameters: any[] = [];

      if (status) {
        query = `SELECT * FROM c WHERE c.status = @status ORDER BY c.detectedAt DESC OFFSET ${offset} LIMIT ${limit}`;
        parameters.push({ name: '@status', value: status });
      }

      return await azureServices.queryDocuments('faults', query, parameters);
    } catch (error) {
      logger.error('Error getting faults:', error);
      return [];
    }
  }

  async getFault(id: string): Promise<DetectedFault | null> {
    try {
      return await azureServices.getDocument('faults', id);
    } catch (error) {
      logger.error('Error getting fault:', error);
      return null;
    }
  }

  async getActiveFaultsByModel(modelId: string): Promise<DetectedFault[]> {
    try {
      const query = `
        SELECT * FROM c 
        WHERE c.modelId = @modelId 
        AND c.status = 'ACTIVE' 
        ORDER BY c.detectedAt DESC
      `;

      const parameters = [
        { name: '@modelId', value: modelId }
      ];

      return await azureServices.queryDocuments('faults', query, parameters);
    } catch (error) {
      logger.error('Error getting active faults by model:', error);
      return [];
    }
  }

  async acknowledgeFault(id: string): Promise<DetectedFault | null> {
    try {
      const fault = await this.getFault(id);
      if (!fault) return null;

      fault.status = 'ACKNOWLEDGED';
      await azureServices.updateDocument('faults', id, fault);

      logger.info(`Fault acknowledged: ${id}`);
      return fault;
    } catch (error) {
      logger.error('Error acknowledging fault:', error);
      return null;
    }
  }

  async resolveFault(id: string, resolution?: string): Promise<DetectedFault | null> {
    try {
      const fault = await this.getFault(id);
      if (!fault) return null;

      fault.status = 'RESOLVED';
      fault.resolvedAt = new Date();
      if (resolution) {
        fault.diagnosticData.resolution = resolution;
      }

      await azureServices.updateDocument('faults', id, fault);

      logger.info(`Fault resolved: ${id}`);
      return fault;
    } catch (error) {
      logger.error('Error resolving fault:', error);
      return null;
    }
  }
}

export const faultDetectionService = new FaultDetectionService();