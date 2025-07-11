"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.faultDetectionService = exports.FaultDetectionService = void 0;
const azure_1 = require("./azure");
const logger_1 = require("../utils/logger");
const uuid_1 = require("uuid");
class FaultDetectionService {
    constructor() {
        this.faultRules = new Map();
        this.initializeDefaultRules();
    }
    initializeDefaultRules() {
        const defaultRules = [
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
    async processSensorData(sensorData) {
        const detectedFaults = [];
        try {
            const applicableRules = Array.from(this.faultRules.values()).filter(rule => rule.isActive && (!rule.modelId || rule.modelId === sensorData.modelId));
            for (const rule of applicableRules) {
                const isTriggered = this.evaluateRuleConditions(rule, sensorData);
                if (isTriggered) {
                    const fault = await this.createFault(rule, sensorData);
                    detectedFaults.push(fault);
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Error processing sensor data for fault detection:', error);
        }
        return detectedFaults;
    }
    evaluateRuleConditions(rule, sensorData) {
        return rule.conditions.some(condition => {
            const parameterValue = this.getParameterValue(condition.parameter, sensorData);
            if (parameterValue === null)
                return false;
            switch (condition.operator) {
                case 'gt':
                    return parameterValue > condition.value;
                case 'lt':
                    return parameterValue < condition.value;
                case 'eq':
                    return parameterValue === condition.value;
                case 'ne':
                    return parameterValue !== condition.value;
                case 'between':
                    const [min, max] = condition.value;
                    return parameterValue >= min && parameterValue <= max;
                case 'outside':
                    const [minOut, maxOut] = condition.value;
                    return parameterValue < minOut || parameterValue > maxOut;
                default:
                    return false;
            }
        });
    }
    getParameterValue(parameter, sensorData) {
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
    async createFault(rule, sensorData) {
        const existingFaults = await this.getActiveFaultsByModel(sensorData.modelId);
        const existingFault = existingFaults.find(fault => fault.ruleId === rule.id && fault.status === 'ACTIVE');
        if (existingFault) {
            return existingFault;
        }
        const diagnosticData = await this.generateDiagnosticData(sensorData.modelId, rule);
        const fault = {
            id: (0, uuid_1.v4)(),
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
        await azure_1.azureServices.createDocument('faults', fault);
        rule.lastTriggered = new Date();
        this.faultRules.set(rule.id, rule);
        await this.sendFaultNotification(fault);
        logger_1.logger.info(`Fault detected: ${fault.title} for model ${fault.modelId}`);
        return fault;
    }
    async generateDiagnosticData(modelId, rule) {
        try {
            const query = `
        SELECT * FROM c 
        WHERE c.modelId = @modelId 
        AND c.timestamp >= @startTime 
        ORDER BY c.timestamp DESC
      `;
            const startTime = new Date(Date.now() - 3600000);
            const parameters = [
                { name: '@modelId', value: modelId },
                { name: '@startTime', value: startTime.toISOString() }
            ];
            const recentData = await azure_1.azureServices.queryDocuments('sensorData', query, parameters);
            const parameters_data = {};
            const trends = {};
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
                correlations: [],
                rootCause: {
                    primaryCause: rule.description,
                    contributingFactors: [],
                    confidence: 0.8
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating diagnostic data:', error);
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
    generateRecommendedActions(faultType, severity) {
        const actions = {
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
    async sendFaultNotification(fault) {
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
            await azure_1.azureServices.sendMessage('fault-notifications', notification);
        }
        catch (error) {
            logger_1.logger.error('Error sending fault notification:', error);
        }
    }
    async getFaults(limit = 50, offset = 0, status) {
        try {
            let query = `SELECT * FROM c ORDER BY c.detectedAt DESC OFFSET ${offset} LIMIT ${limit}`;
            const parameters = [];
            if (status) {
                query = `SELECT * FROM c WHERE c.status = @status ORDER BY c.detectedAt DESC OFFSET ${offset} LIMIT ${limit}`;
                parameters.push({ name: '@status', value: status });
            }
            return await azure_1.azureServices.queryDocuments('faults', query, parameters);
        }
        catch (error) {
            logger_1.logger.error('Error getting faults:', error);
            return [];
        }
    }
    async getFault(id) {
        try {
            return await azure_1.azureServices.getDocument('faults', id);
        }
        catch (error) {
            logger_1.logger.error('Error getting fault:', error);
            return null;
        }
    }
    async getActiveFaultsByModel(modelId) {
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
            return await azure_1.azureServices.queryDocuments('faults', query, parameters);
        }
        catch (error) {
            logger_1.logger.error('Error getting active faults by model:', error);
            return [];
        }
    }
    async acknowledgeFault(id) {
        try {
            const fault = await this.getFault(id);
            if (!fault)
                return null;
            fault.status = 'ACKNOWLEDGED';
            await azure_1.azureServices.updateDocument('faults', id, fault);
            logger_1.logger.info(`Fault acknowledged: ${id}`);
            return fault;
        }
        catch (error) {
            logger_1.logger.error('Error acknowledging fault:', error);
            return null;
        }
    }
    async resolveFault(id, resolution) {
        try {
            const fault = await this.getFault(id);
            if (!fault)
                return null;
            fault.status = 'RESOLVED';
            fault.resolvedAt = new Date();
            if (resolution) {
                fault.diagnosticData.resolution = resolution;
            }
            await azure_1.azureServices.updateDocument('faults', id, fault);
            logger_1.logger.info(`Fault resolved: ${id}`);
            return fault;
        }
        catch (error) {
            logger_1.logger.error('Error resolving fault:', error);
            return null;
        }
    }
    async runScheduledCheck() {
        try {
            logger_1.logger.info('Running scheduled fault detection check...');
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const query = `
        SELECT * FROM c
        WHERE c.timestamp >= @startTime
        ORDER BY c.timestamp DESC
      `;
            const parameters = [
                { name: '@startTime', value: fiveMinutesAgo.toISOString() }
            ];
            const recentSensorData = await azure_1.azureServices.queryDocuments('sensorData', query, parameters);
            if (recentSensorData.length === 0) {
                logger_1.logger.info('No recent sensor data found for fault detection');
                return;
            }
            let totalFaultsDetected = 0;
            for (const sensorData of recentSensorData) {
                const detectedFaults = await this.processSensorData(sensorData);
                totalFaultsDetected += detectedFaults.length;
            }
            logger_1.logger.info(`Scheduled fault detection check completed. ${totalFaultsDetected} faults detected.`);
        }
        catch (error) {
            logger_1.logger.error('Error in scheduled fault detection check:', error);
            throw error;
        }
    }
}
exports.FaultDetectionService = FaultDetectionService;
exports.faultDetectionService = new FaultDetectionService();
//# sourceMappingURL=faultDetectionService.js.map