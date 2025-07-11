import { DetectedFault, faultDetectionService } from '../../services/faultDetectionService';
import { azureServices } from '../../services/azure';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { withFilter, PubSub as GqlPubSub } from 'graphql-subscriptions';

const pubsub: any = new GqlPubSub();

export const faultResolvers = {
    Query: {
        faults: async (_: any, { limit = 50, offset = 0, status }: any) => {
            try {
                return await faultDetectionService.getFaults(limit, offset, status);
            } catch (error) {
                logger.error('Error fetching faults:', error);
                throw new Error('Failed to fetch faults');
            }
        },

        fault: async (_: any, { id }: any) => {
            try {
                return await faultDetectionService.getFault(id);
            } catch (error) {
                logger.error('Error fetching fault:', error);
                return null;
            }
        },

        faultsByModel: async (_: any, { modelId }: any) => {
            try {
                const query = `
          SELECT * FROM c 
          WHERE c.modelId = @modelId 
          ORDER BY c.detectedAt DESC
        `;
                const parameters = [{ name: '@modelId', value: modelId }];
                return await azureServices.queryDocuments('faults', query, parameters);
            } catch (error) {
                logger.error('Error fetching faults by model:', error);
                throw new Error('Failed to fetch faults by model');
            }
        },

        faultsByDevice: async (_: any, { deviceId }: any) => {
            try {
                const query = `
          SELECT * FROM c 
          WHERE c.deviceId = @deviceId 
          ORDER BY c.detectedAt DESC
        `;
                const parameters = [{ name: '@deviceId', value: deviceId }];
                return await azureServices.queryDocuments('faults', query, parameters);
            } catch (error) {
                logger.error('Error fetching faults by device:', error);
                throw new Error('Failed to fetch faults by device');
            }
        }
    },

    Mutation: {
        createFault: async (_: any, { input }: any, { userId }: any) => {
            try {
                const fault = {
                    id: uuidv4(),
                    ruleId: 'manual-' + uuidv4(),
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

                const createdFault = await azureServices.createDocument('faults', fault);

                // Publish fault detection event
                pubsub.publish('FAULT_DETECTED', { faultDetected: createdFault });

                logger.info(`Manual fault created: ${fault.title}`);
                return createdFault;
            } catch (error) {
                logger.error('Error creating fault:', error);
                throw new Error('Failed to create fault');
            }
        },

        acknowledgeFault: async (_: any, { id }: any, { userId }: any) => {
            try {
                const result: DetectedFault | null = await faultDetectionService.acknowledgeFault(id);
                if (!result) {
                    throw new Error('Fault not found');
                }

                // Add acknowledgment metadata
                result.acknowledgedBy = userId;
                result.acknowledgedAt = new Date();
                await azureServices.updateDocument('faults', id, result);

                logger.info(`Fault acknowledged: ${id} by ${userId}`);
                return result;
            } catch (error) {
                logger.error('Error acknowledging fault:', error);
                throw new Error('Failed to acknowledge fault');
            }
        },

        resolveFault: async (_: any, { id, resolution }: any, { userId }: any) => {
            try {
                const result = await faultDetectionService.resolveFault(id, resolution);
                if (!result) {
                    throw new Error('Fault not found');
                }

                // Add resolution metadata
                result.resolvedBy = userId;
                result.resolution = resolution;
                await azureServices.updateDocument('faults', id, result);

                logger.info(`Fault resolved: ${id} by ${userId}`);
                return result;
            } catch (error) {
                logger.error('Error resolving fault:', error);
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