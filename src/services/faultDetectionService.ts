import { DigitalTwinModel } from '../types';
import {
  FaultDetectionRule,
  DetectedFault,
  ModelHealthStatus,
  FaultDetectionStatistics,
  DiagnosticData,
  ComponentHealth,
  PerformanceMetrics,
  PredictiveInsight,
  FaultCallback,
  HealthStatusCallback,
  SensorData
} from '../types/services';
import { generateId } from '../utils/helpers';
import { realTimeDataService } from './realTimeDataService';
import { notificationService } from './notificationService';

export class FaultDetectionService {
  private static instance: FaultDetectionService;
  private faultRules: Map<string, FaultDetectionRule> = new Map();
  private detectedFaults: Map<string, DetectedFault> = new Map();
  private modelHealthStatus: Map<string, ModelHealthStatus> = new Map();
  private faultCallbacks: FaultCallback[] = [];
  private healthCallbacks: HealthStatusCallback[] = [];
  private analysisInterval: NodeJS.Timeout | null = null;
  private historicalData: Map<string, SensorData[]> = new Map();

  private constructor() {
    this.initializeDefaultRules();
    this.startContinuousAnalysis();
    this.subscribeToRealTimeData();
  }

  public static getInstance(): FaultDetectionService {
    if (!FaultDetectionService.instance) {
      FaultDetectionService.instance = new FaultDetectionService();
    }
    return FaultDetectionService.instance;
  }

  /**
   * Initialize default fault detection rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: FaultDetectionRule[] = [
      {
        id: 'rule-temp-critical',
        name: 'Critical Temperature Alert',
        faultType: 'environmental',
        severity: 'critical',
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
        faultType: 'structural',
        severity: 'high',
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
        faultType: 'connectivity',
        severity: 'medium',
        conditions: [
          { parameter: 'signal_strength', operator: 'lt', value: 20 }
        ],
        isActive: true,
        description: 'Poor connectivity detected',
        createdAt: new Date()
      },
      {
        id: 'rule-performance-degradation',
        name: 'Performance Degradation',
        faultType: 'performance',
        severity: 'medium',
        conditions: [
          { parameter: 'cpu_usage', operator: 'gt', value: 90, duration: 300 },
          { parameter: 'memory_usage', operator: 'gt', value: 85, duration: 300 }
        ],
        isActive: true,
        description: 'System performance degradation detected',
        createdAt: new Date()
      }
    ];

    defaultRules.forEach(rule => this.faultRules.set(rule.id, rule));
  }

  /**
   * Subscribe to real-time data for continuous monitoring
   */
  private subscribeToRealTimeData(): void {
    realTimeDataService.subscribeToData((sensorData) => {
      this.processSensorData(sensorData);
    });
  }

  /**
   * Process incoming sensor data for fault detection
   */
  private processSensorData(sensorData: SensorData[]): void {
    sensorData.forEach(data => {
      // Store historical data
      const modelHistory = this.historicalData.get(data.modelId) || [];
      modelHistory.push(data);
      
      // Keep only last 1000 data points per model
      if (modelHistory.length > 1000) {
        modelHistory.shift();
      }
      this.historicalData.set(data.modelId, modelHistory);

      // Check for faults
      this.checkFaultConditions(data);
    });

    // Update model health status
    this.updateModelHealthStatus();
  }

  /**
   * Check sensor data against fault detection rules
   */
  private checkFaultConditions(sensorData: SensorData): void {
    const applicableRules = Array.from(this.faultRules.values()).filter(
      rule => rule.isActive && (!rule.modelId || rule.modelId === sensorData.modelId)
    );

    applicableRules.forEach(rule => {
      const isTriggered = this.evaluateRuleConditions(rule, sensorData);
      
      if (isTriggered) {
        this.createFault(rule, sensorData);
      }
    });
  }

  /**
   * Evaluate if rule conditions are met
   */
  private evaluateRuleConditions(rule: FaultDetectionRule, sensorData: SensorData): boolean {
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

  /**
   * Get parameter value from sensor data
   */
  private getParameterValue(parameter: string, sensorData: SensorData): number | null {
    switch (parameter) {
      case 'temperature':
        return sensorData.sensorType === 'temperature' ? sensorData.value : null;
      case 'vibration':
        return sensorData.sensorType === 'vibration' ? sensorData.value : null;
      case 'flow':
        return sensorData.sensorType === 'flow' ? sensorData.value : null;
      case 'pressure':
        return sensorData.sensorType === 'pressure' ? sensorData.value : null;
      case 'humidity':
        return sensorData.sensorType === 'humidity' ? sensorData.value : null;
      case 'power':
        return sensorData.sensorType === 'power' ? sensorData.value : null;
      default:
        return null;
    }
  }

  /**
   * Create a new fault detection
   */
  private createFault(rule: FaultDetectionRule, sensorData: SensorData): void {
    // Check if similar fault already exists and is active
    const existingFault = Array.from(this.detectedFaults.values()).find(
      fault => fault.ruleId === rule.id && 
               fault.modelId === sensorData.modelId && 
               fault.status === 'active'
    );

    if (existingFault) return; // Don't create duplicate active faults

    const diagnosticData = this.generateDiagnosticData(sensorData.modelId, rule);
    
    const fault: DetectedFault = {
      id: generateId(),
      ruleId: rule.id,
      modelId: sensorData.modelId,
      faultType: rule.faultType,
      severity: rule.severity,
      title: rule.name,
      description: `${rule.description} - Value: ${sensorData.value}${sensorData.unit}`,
      detectedAt: new Date(),
      status: 'active',
      affectedComponents: [sensorData.sensorType],
      diagnosticData,
      coordinates: sensorData.coordinates,
      recommendedActions: this.generateRecommendedActions(rule.faultType, rule.severity)
    };

    this.detectedFaults.set(fault.id, fault);
    this.faultRules.get(rule.id)!.lastTriggered = new Date();

    // Notify callbacks
    this.notifyFaultCallbacks(fault);

    // Send notification
    notificationService.error(
      `Fault Detected: ${fault.title}`,
      fault.description,
      { duration: 0 } // Persistent for faults
    );
  }

  /**
   * Generate diagnostic data for a fault
   */
  private generateDiagnosticData(modelId: string, rule: FaultDetectionRule): DiagnosticData {
    const modelHistory = this.historicalData.get(modelId) || [];
    const recentData = modelHistory.slice(-50); // Last 50 data points

    const parameters: Record<string, number> = {};
    const trends: Record<string, number[]> = {};

    recentData.forEach(data => {
      const key = data.sensorType;
      if (!parameters[key]) {
        parameters[key] = data.value;
        trends[key] = [];
      }
      trends[key].push(data.value);
    });

    return {
      parameters,
      trends,
      correlations: [], // TODO: Implement correlation analysis
      rootCauseAnalysis: {
        primaryCause: rule.description,
        contributingFactors: [],
        confidence: 0.8
      }
    };
  }

  /**
   * Generate recommended actions based on fault type and severity
   */
  private generateRecommendedActions(faultType: string, severity: string): string[] {
    const actions: Record<string, string[]> = {
      environmental: [
        'Check environmental controls',
        'Verify sensor calibration',
        'Inspect cooling systems'
      ],
      structural: [
        'Perform structural inspection',
        'Check mounting and connections',
        'Review maintenance schedule'
      ],
      connectivity: [
        'Check network connections',
        'Verify signal strength',
        'Restart communication modules'
      ],
      performance: [
        'Monitor system resources',
        'Check for software updates',
        'Review system configuration'
      ],
      data_quality: [
        'Validate data sources',
        'Check sensor accuracy',
        'Review data processing pipeline'
      ]
    };

    return actions[faultType] || ['Contact technical support'];
  }

  /**
   * Start continuous analysis
   */
  private startContinuousAnalysis(): void {
    this.analysisInterval = setInterval(() => {
      this.performHealthAnalysis();
    }, 30000); // Every 30 seconds
  }

  /**
   * Perform comprehensive health analysis
   */
  private performHealthAnalysis(): void {
    // This would contain more sophisticated analysis algorithms
    // For now, we'll update based on current sensor data and faults
    this.updateModelHealthStatus();
  }

  /**
   * Update model health status
   */
  private updateModelHealthStatus(): void {
    const devices = realTimeDataService.getDevices();
    
    devices.forEach(device => {
      if (!device.modelId) return;

      const modelFaults = Array.from(this.detectedFaults.values()).filter(
        fault => fault.modelId === device.modelId && fault.status === 'active'
      );

      const healthStatus = this.calculateHealthStatus(device.modelId, modelFaults);
      this.modelHealthStatus.set(device.modelId, healthStatus);
      
      // Notify callbacks
      this.notifyHealthCallbacks(healthStatus);
    });
  }

  /**
   * Calculate health status for a model
   */
  private calculateHealthStatus(modelId: string, faults: DetectedFault[]): ModelHealthStatus {
    let healthScore = 100;
    let overallHealth: 'healthy' | 'warning' | 'critical' | 'offline' = 'healthy';

    // Reduce health score based on faults
    faults.forEach(fault => {
      switch (fault.severity) {
        case 'critical':
          healthScore -= 30;
          overallHealth = 'critical';
          break;
        case 'high':
          healthScore -= 20;
          if (overallHealth === 'healthy') overallHealth = 'warning';
          break;
        case 'medium':
          healthScore -= 10;
          if (overallHealth === 'healthy') overallHealth = 'warning';
          break;
        case 'low':
          healthScore -= 5;
          break;
      }
    });

    healthScore = Math.max(0, healthScore);

    return {
      modelId,
      overallHealth,
      healthScore,
      lastUpdated: new Date(),
      components: [], // TODO: Implement component health tracking
      activeFaults: faults,
      performanceMetrics: this.generateMockPerformanceMetrics(),
      predictiveInsights: this.generatePredictiveInsights(faults)
    };
  }

  /**
   * Generate mock performance metrics
   */
  private generateMockPerformanceMetrics(): PerformanceMetrics {
    return {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      networkLatency: Math.random() * 100,
      dataProcessingRate: Math.random() * 1000,
      errorRate: Math.random() * 5,
      uptime: Math.random() * 8760 // Up to 1 year in hours
    };
  }

  /**
   * Generate predictive insights
   */
  private generatePredictiveInsights(faults: DetectedFault[]): PredictiveInsight[] {
    const insights: PredictiveInsight[] = [];

    if (faults.some(f => f.faultType === 'structural')) {
      insights.push({
        type: 'maintenance',
        title: 'Preventive Maintenance Recommended',
        description: 'Structural issues detected that may require maintenance',
        probability: 0.75,
        timeframe: 'within 14 days',
        impact: 'medium',
        recommendedActions: ['Schedule maintenance inspection', 'Check structural components']
      });
    }

    return insights;
  }

  // Public API methods
  public getFaultDetectionStatistics(): FaultDetectionStatistics {
    const allFaults = Array.from(this.detectedFaults.values());
    const activeFaults = allFaults.filter(f => f.status === 'active');
    const resolvedFaults = allFaults.filter(f => f.status === 'resolved');
    
    const allHealthStatuses = Array.from(this.modelHealthStatus.values());
    
    return {
      totalModels: allHealthStatuses.length,
      healthyModels: allHealthStatuses.filter(h => h.overallHealth === 'healthy').length,
      modelsWithWarnings: allHealthStatuses.filter(h => h.overallHealth === 'warning').length,
      criticalModels: allHealthStatuses.filter(h => h.overallHealth === 'critical').length,
      offlineModels: allHealthStatuses.filter(h => h.overallHealth === 'offline').length,
      totalFaults: allFaults.length,
      activeFaults: activeFaults.length,
      resolvedFaults: resolvedFaults.length,
      averageResolutionTime: 2.5, // Mock value
      faultsByType: this.groupFaultsByProperty(allFaults, 'faultType'),
      faultsBySeverity: this.groupFaultsByProperty(allFaults, 'severity'),
      mtbf: 168, // Mock: 1 week
      mttr: 4 // Mock: 4 hours
    };
  }

  private groupFaultsByProperty(faults: DetectedFault[], property: keyof DetectedFault): Record<string, number> {
    return faults.reduce((acc, fault) => {
      const key = fault[property] as string;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  public getDetectedFaults(): DetectedFault[] {
    return Array.from(this.detectedFaults.values());
  }

  public getModelHealthStatus(modelId?: string): ModelHealthStatus[] {
    if (modelId) {
      const status = this.modelHealthStatus.get(modelId);
      return status ? [status] : [];
    }
    return Array.from(this.modelHealthStatus.values());
  }

  public acknowledgeFault(faultId: string): void {
    const fault = this.detectedFaults.get(faultId);
    if (fault) {
      fault.status = 'acknowledged';
      this.detectedFaults.set(faultId, fault);
    }
  }

  public resolveFault(faultId: string): void {
    const fault = this.detectedFaults.get(faultId);
    if (fault) {
      fault.status = 'resolved';
      fault.resolvedAt = new Date();
      this.detectedFaults.set(faultId, fault);
    }
  }

  public subscribeToFaults(callback: FaultCallback): () => void {
    this.faultCallbacks.push(callback);
    return () => {
      const index = this.faultCallbacks.indexOf(callback);
      if (index > -1) {
        this.faultCallbacks.splice(index, 1);
      }
    };
  }

  public subscribeToHealthStatus(callback: HealthStatusCallback): () => void {
    this.healthCallbacks.push(callback);
    return () => {
      const index = this.healthCallbacks.indexOf(callback);
      if (index > -1) {
        this.healthCallbacks.splice(index, 1);
      }
    };
  }

  private notifyFaultCallbacks(fault: DetectedFault): void {
    this.faultCallbacks.forEach(callback => {
      try {
        callback(fault);
      } catch (error) {
        console.error('Error in fault callback:', error);
      }
    });
  }

  private notifyHealthCallbacks(status: ModelHealthStatus): void {
    this.healthCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in health status callback:', error);
      }
    });
  }

  public destroy(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }
  }
}

// Export singleton instance
export const faultDetectionService = FaultDetectionService.getInstance();
