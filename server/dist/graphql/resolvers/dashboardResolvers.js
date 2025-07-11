"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishSystemHealthUpdate = exports.dashboardResolvers = void 0;
const azure_1 = require("../../services/azure");
const logger_1 = require("../../utils/logger");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const pubsub = new graphql_subscriptions_1.PubSub();
exports.dashboardResolvers = {
    Query: {
        dashboardMetrics: async (_, __, { userId }) => {
            try {
                const modelsQuery = `SELECT VALUE COUNT(1) FROM c`;
                const modelsCount = await azure_1.azureServices.queryDocuments('models', modelsQuery);
                const totalModels = modelsCount[0] || 0;
                const devicesQuery = `SELECT VALUE COUNT(1) FROM c WHERE c.status = 'ONLINE'`;
                const devicesCount = await azure_1.azureServices.queryDocuments('devices', devicesQuery);
                const activeDevices = devicesCount[0] || 0;
                const faultsQuery = `SELECT VALUE COUNT(1) FROM c WHERE c.status = 'ACTIVE'`;
                const faultsCount = await azure_1.azureServices.queryDocuments('faults', faultsQuery);
                const activeFaults = faultsCount[0] || 0;
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const dataPointsQuery = `
          SELECT VALUE COUNT(1) FROM c 
          WHERE c.timestamp >= @yesterday
        `;
                const dataPointsParams = [{ name: '@yesterday', value: yesterday.toISOString() }];
                const dataPointsCount = await azure_1.azureServices.queryDocuments('sensorData', dataPointsQuery, dataPointsParams);
                const dataPoints = dataPointsCount[0] || 0;
                const systemHealth = Math.max(0, 100 - (activeFaults * 10));
                return {
                    totalModels,
                    activeDevices,
                    activeFaults,
                    systemHealth,
                    dataPoints,
                    lastUpdated: new Date()
                };
            }
            catch (error) {
                logger_1.logger.error('Error fetching dashboard metrics:', error);
                throw new Error('Failed to fetch dashboard metrics');
            }
        },
        systemHealth: async (_, __, { userId }) => {
            try {
                const components = [
                    {
                        name: 'Database',
                        status: 'healthy',
                        health: 98.5,
                        lastChecked: new Date()
                    },
                    {
                        name: 'Storage',
                        status: 'healthy',
                        health: 99.2,
                        lastChecked: new Date()
                    },
                    {
                        name: 'Message Queue',
                        status: 'healthy',
                        health: 97.8,
                        lastChecked: new Date()
                    },
                    {
                        name: 'AI Services',
                        status: 'warning',
                        health: 85.3,
                        lastChecked: new Date()
                    },
                    {
                        name: 'Real-time Data',
                        status: 'healthy',
                        health: 96.7,
                        lastChecked: new Date()
                    }
                ];
                const overall = components.reduce((sum, comp) => sum + comp.health, 0) / components.length;
                const trends = [];
                const now = new Date();
                for (let i = 23; i >= 0; i--) {
                    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
                    const value = overall + (Math.random() - 0.5) * 10;
                    trends.push({
                        timestamp,
                        value: Math.max(0, Math.min(100, value))
                    });
                }
                return {
                    overall: Math.round(overall * 100) / 100,
                    components,
                    trends
                };
            }
            catch (error) {
                logger_1.logger.error('Error fetching system health:', error);
                throw new Error('Failed to fetch system health');
            }
        }
    },
    Subscription: {
        systemHealthUpdated: {
            subscribe: () => pubsub.asyncIterator(['SYSTEM_HEALTH_UPDATED'])
        }
    }
};
const publishSystemHealthUpdate = (healthData) => {
    pubsub.publish('SYSTEM_HEALTH_UPDATED', { systemHealthUpdated: healthData });
};
exports.publishSystemHealthUpdate = publishSystemHealthUpdate;
setInterval(async () => {
    try {
        const components = [
            {
                name: 'Database',
                status: 'healthy',
                health: 95 + Math.random() * 5,
                lastChecked: new Date()
            },
            {
                name: 'Storage',
                status: 'healthy',
                health: 96 + Math.random() * 4,
                lastChecked: new Date()
            },
            {
                name: 'Message Queue',
                status: 'healthy',
                health: 94 + Math.random() * 6,
                lastChecked: new Date()
            },
            {
                name: 'AI Services',
                status: Math.random() > 0.8 ? 'warning' : 'healthy',
                health: 80 + Math.random() * 20,
                lastChecked: new Date()
            },
            {
                name: 'Real-time Data',
                status: 'healthy',
                health: 92 + Math.random() * 8,
                lastChecked: new Date()
            }
        ];
        const overall = components.reduce((sum, comp) => sum + comp.health, 0) / components.length;
        const healthData = {
            overall: Math.round(overall * 100) / 100,
            components,
            trends: []
        };
        (0, exports.publishSystemHealthUpdate)(healthData);
    }
    catch (error) {
        logger_1.logger.error('Error in periodic health update:', error);
    }
}, 30000);
//# sourceMappingURL=dashboardResolvers.js.map