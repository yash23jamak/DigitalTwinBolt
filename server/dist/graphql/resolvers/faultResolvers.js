"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.faultResolvers = void 0;
const faultDetectionService_1 = require("../../services/faultDetectionService");
const azure_1 = require("../../services/azure");
const logger_1 = require("../../utils/logger");
const uuid_1 = require("uuid");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const pubsub = new graphql_subscriptions_1.PubSub();
exports.faultResolvers = {
    Query: {
        faults: async (_, { limit = 50, offset = 0, status }) => {
            try {
                return await faultDetectionService_1.faultDetectionService.getFaults(limit, offset, status);
            }
            catch (error) {
                logger_1.logger.error('Error fetching faults:', error);
                throw new Error('Failed to fetch faults');
            }
        },
        fault: async (_, { id }) => {
            try {
                return await faultDetectionService_1.faultDetectionService.getFault(id);
            }
            catch (error) {
                logger_1.logger.error('Error fetching fault:', error);
                return null;
            }
        },
        faultsByModel: async (_, { modelId }) => {
            try {
                const query = `
          SELECT * FROM c 
          WHERE c.modelId = @modelId 
          ORDER BY c.detectedAt DESC
        `;
                const parameters = [{ name: '@modelId', value: modelId }];
                return await azure_1.azureServices.queryDocuments('faults', query, parameters);
            }
            catch (error) {
                logger_1.logger.error('Error fetching faults by model:', error);
                throw new Error('Failed to fetch faults by model');
            }
        },
        faultsByDevice: async (_, { deviceId }) => {
            try {
                const query = `
          SELECT * FROM c 
          WHERE c.deviceId = @deviceId 
          ORDER BY c.detectedAt DESC
        `;
                const parameters = [{ name: '@deviceId', value: deviceId }];
                return await azure_1.azureServices.queryDocuments('faults', query, parameters);
            }
            catch (error) {
                logger_1.logger.error('Error fetching faults by device:', error);
                throw new Error('Failed to fetch faults by device');
            }
        }
    },
    Mutation: {
        createFault: async (_, { input }, { userId }) => {
            try {
                const fault = {
                    id: (0, uuid_1.v4)(),
                    ruleId: 'manual-' + (0, uuid_1.v4)(),
                    modelId: input.modelId,
                    deviceId: input.deviceId,
                    title: input.title,
                    description: input.description,
                    severity: input.severity,
                    type: input.type,
                    status: 'ACTIVE',
                    detectedAt: new Date(),
                    coordinates: input.coordinates,
                    affectedComponents: input.affectedComponents,
                    diagnosticData: {
                        parameters: {},
                        trends: {},
                        correlations: [],
                        rootCause: {
                            primaryCause: 'Manual fault creation',
                            contributingFactors: [],
                            confidence: 1.0
                        }
                    },
                    recommendedActions: [
                        'Investigate the reported issue',
                        'Check affected components',
                        'Contact maintenance team if needed'
                    ],
                    assignedTo: userId || 'unassigned',
                    createdBy: userId || 'anonymous'
                };
                const createdFault = await azure_1.azureServices.createDocument('faults', fault);
                pubsub.publish('FAULT_DETECTED', { faultDetected: createdFault });
                logger_1.logger.info(`Manual fault created: ${fault.title}`);
                return createdFault;
            }
            catch (error) {
                logger_1.logger.error('Error creating fault:', error);
                throw new Error('Failed to create fault');
            }
        },
        acknowledgeFault: async (_, { id }, { userId }) => {
            try {
                const result = await faultDetectionService_1.faultDetectionService.acknowledgeFault(id);
                if (!result) {
                    throw new Error('Fault not found');
                }
                result.acknowledgedBy = userId;
                result.acknowledgedAt = new Date();
                await azure_1.azureServices.updateDocument('faults', id, result);
                logger_1.logger.info(`Fault acknowledged: ${id} by ${userId}`);
                return result;
            }
            catch (error) {
                logger_1.logger.error('Error acknowledging fault:', error);
                throw new Error('Failed to acknowledge fault');
            }
        },
        resolveFault: async (_, { id, resolution }, { userId }) => {
            try {
                const result = await faultDetectionService_1.faultDetectionService.resolveFault(id, resolution);
                if (!result) {
                    throw new Error('Fault not found');
                }
                result.resolvedBy = userId;
                result.resolution = resolution;
                await azure_1.azureServices.updateDocument('faults', id, result);
                logger_1.logger.info(`Fault resolved: ${id} by ${userId}`);
                return result;
            }
            catch (error) {
                logger_1.logger.error('Error resolving fault:', error);
                throw new Error('Failed to resolve fault');
            }
        }
    },
    Subscription: {
        faultDetected: {
            subscribe: () => pubsub.asyncIterator(['FAULT_DETECTED'])
        }
    }
};
//# sourceMappingURL=faultResolvers.js.map