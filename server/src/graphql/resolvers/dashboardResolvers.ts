import { azureServices } from '../../services/azure';
import { logger } from '../../utils/logger';
import { withFilter } from 'graphql-subscriptions';
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

export const dashboardResolvers = {
  Query: {
    dashboardMetrics: async (_: any, __: any, { userId }: any) => {
      try {
        // Get total models
        const modelsQuery = `SELECT VALUE COUNT(1) FROM c`;
        const modelsCount = await azureServices.queryDocuments('models', modelsQuery);
        const totalModels = modelsCount[0] || 0;

        // Get active devices
        const devicesQuery = `SELECT VALUE COUNT(1) FROM c WHERE c.status = 'ONLINE'`;
        const devicesCount = await azureServices.queryDocuments('devices', devicesQuery);
        const activeDevices = devicesCount[0] || 0;

        // Get active faults
        const faultsQuery = `SELECT VALUE COUNT(1) FROM c WHERE c.status = 'ACTIVE'`;
        const faultsCount = await azureServices.queryDocuments('faults', faultsQuery);
        const activeFaults = faultsCount[0] || 0;

        // Get total data points from last 24 hours
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const dataPointsQuery = `
          SELECT VALUE COUNT(1) FROM c 
          WHERE c.timestamp >= @yesterday
        `;
        const dataPointsParams = [{ name: '@yesterday', value: yesterday.toISOString() }];
        const dataPointsCount = await azureServices.queryDocuments('sensorData', dataPointsQuery, dataPointsParams);
        const dataPoints = dataPointsCount[0] || 0;

        // Calculate system health (mock calculation)
        const systemHealth = Math.max(0, 100 - (activeFaults * 10));

        return {
          totalModels,
          activeDevices,
          activeFaults,
          systemHealth,
          dataPoints,
          lastUpdated: new Date()
        };

      } catch (error) {
        logger.error('Error fetching dashboard metrics:', error);
        throw new Error('Failed to fetch dashboard metrics');
      }
    },

    systemHealth: async (_: any, __: any, { userId }: any) => {
      try {
        // Get overall system health components
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

        // Calculate overall health
        const overall = components.reduce((sum, comp) => sum + comp.health, 0) / components.length;

        // Generate health trends (mock data)
        const trends = [];
        const now = new Date();
        for (let i = 23; i >= 0; i--) {
          const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
          const value = overall + (Math.random() - 0.5) * 10; // Add some variance
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

      } catch (error) {
        logger.error('Error fetching system health:', error);
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

// Helper function to publish system health updates
export const publishSystemHealthUpdate = (healthData: any) => {
  pubsub.publish('SYSTEM_HEALTH_UPDATED', { systemHealthUpdated: healthData });
};

// Periodic system health updates (can be called from cron jobs)
setInterval(async () => {
  try {
    // Calculate current system health
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
      trends: [] // Trends would be calculated from historical data
    };

    publishSystemHealthUpdate(healthData);

  } catch (error) {
    logger.error('Error in periodic health update:', error);
  }
}, 30000); // Update every 30 seconds