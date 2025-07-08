import { azureServices } from '../../services/azure';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { withFilter } from 'graphql-subscriptions';
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

export const deviceResolvers = {
  Query: {
    devices: async (_: any, { limit = 50, offset = 0 }: any) => {
      try {
        const query = `SELECT * FROM c ORDER BY c.lastSeen DESC OFFSET ${offset} LIMIT ${limit}`;
        return await azureServices.queryDocuments('devices', query);
      } catch (error) {
        logger.error('Error fetching devices:', error);
        throw new Error('Failed to fetch devices');
      }
    },

    device: async (_: any, { id }: any) => {
      try {
        return await azureServices.getDocument('devices', id);
      } catch (error) {
        logger.error('Error fetching device:', error);
        return null;
      }
    },

    devicesByModel: async (_: any, { modelId }: any) => {
      try {
        const query = `SELECT * FROM c WHERE c.modelId = @modelId ORDER BY c.lastSeen DESC`;
        const parameters = [{ name: '@modelId', value: modelId }];
        return await azureServices.queryDocuments('devices', query, parameters);
      } catch (error) {
        logger.error('Error fetching devices by model:', error);
        throw new Error('Failed to fetch devices by model');
      }
    },

    sensorData: async (_: any, { deviceId, from, to }: any) => {
      try {
        let query = `SELECT * FROM c WHERE c.deviceId = @deviceId ORDER BY c.timestamp DESC`;
        const parameters = [{ name: '@deviceId', value: deviceId }];

        if (from && to) {
          query = `
            SELECT * FROM c 
            WHERE c.deviceId = @deviceId 
            AND c.timestamp >= @from 
            AND c.timestamp <= @to 
            ORDER BY c.timestamp DESC
          `;
          parameters.push(
            { name: '@from', value: from },
            { name: '@to', value: to }
          );
        }

        const sensorData = await azureServices.queryDocuments('sensorData', query, parameters);
        
        // Group by sensor type and return latest values
        const latestSensors = sensorData.reduce((acc: any, data: any) => {
          if (!acc[data.sensorType] || new Date(data.timestamp) > new Date(acc[data.sensorType].timestamp)) {
            acc[data.sensorType] = data;
          }
          return acc;
        }, {});

        return Object.values(latestSensors);
      } catch (error) {
        logger.error('Error fetching sensor data:', error);
        throw new Error('Failed to fetch sensor data');
      }
    }
  },

  Mutation: {
    createDevice: async (_: any, { input }: any, { userId }: any) => {
      try {
        const device = {
          id: uuidv4(),
          name: input.name,
          type: input.type,
          status: 'OFFLINE',
          coordinates: input.coordinates,
          modelId: input.modelId,
          lastSeen: new Date(),
          batteryLevel: null,
          signalStrength: null,
          sensors: [],
          metadata: input.metadata || {},
          createdBy: userId || 'anonymous',
          createdAt: new Date()
        };

        const createdDevice = await azureServices.createDocument('devices', device);
        
        // Publish device creation event
        pubsub.publish('DEVICE_STATUS_CHANGED', { deviceStatusChanged: createdDevice });
        
        logger.info(`Device created successfully: ${device.name}`);
        return createdDevice;
      } catch (error) {
        logger.error('Error creating device:', error);
        throw new Error('Failed to create device');
      }
    },

    updateDevice: async (_: any, { id, input }: any) => {
      try {
        const existingDevice = await azureServices.getDocument('devices', id);
        if (!existingDevice) {
          throw new Error('Device not found');
        }

        const updatedDevice = {
          ...existingDevice,
          ...input,
          lastModified: new Date()
        };

        const result = await azureServices.updateDocument('devices', id, updatedDevice);
        
        // Publish device update event
        pubsub.publish('DEVICE_STATUS_CHANGED', { deviceStatusChanged: result });
        
        logger.info(`Device updated successfully: ${id}`);
        return result;
      } catch (error) {
        logger.error('Error updating device:', error);
        throw new Error('Failed to update device');
      }
    },

    deleteDevice: async (_: any, { id }: any) => {
      try {
        const device = await azureServices.getDocument('devices', id);
        if (!device) {
          throw new Error('Device not found');
        }

        // Delete associated sensor data
        const sensorDataQuery = `SELECT * FROM c WHERE c.deviceId = @deviceId`;
        const sensorDataParams = [{ name: '@deviceId', value: id }];
        const sensorData = await azureServices.queryDocuments('sensorData', sensorDataQuery, sensorDataParams);
        
        for (const data of sensorData) {
          await azureServices.deleteDocument('sensorData', data.id, data.deviceId);
        }

        // Delete device
        await azureServices.deleteDocument('devices', id);
        
        logger.info(`Device deleted successfully: ${id}`);
        return true;
      } catch (error) {
        logger.error('Error deleting device:', error);
        throw new Error('Failed to delete device');
      }
    },

    addSensorData: async (_: any, { input }: any) => {
      try {
        const sensorData = {
          id: uuidv4(),
          deviceId: input.deviceId,
          sensorType: input.sensorType,
          value: input.value,
          unit: input.unit,
          timestamp: input.timestamp || new Date(),
          status: 'NORMAL',
          thresholds: null
        };

        // Determine status based on thresholds (mock logic)
        if (input.sensorType === 'TEMPERATURE' && input.value > 80) {
          sensorData.status = 'CRITICAL';
        } else if (input.sensorType === 'TEMPERATURE' && input.value > 70) {
          sensorData.status = 'WARNING';
        }

        const createdSensorData = await azureServices.createDocument('sensorData', sensorData);
        
        // Update device last seen
        try {
          const device = await azureServices.getDocument('devices', input.deviceId);
          if (device) {
            device.lastSeen = new Date();
            device.status = 'ONLINE';
            await azureServices.updateDocument('devices', input.deviceId, device);
          }
        } catch (error) {
          logger.warn('Error updating device last seen:', error);
        }

        // Publish sensor data update
        pubsub.publish('SENSOR_DATA_UPDATED', { 
          sensorDataUpdated: createdSensorData,
          deviceId: input.deviceId 
        });
        
        logger.info(`Sensor data added for device: ${input.deviceId}`);
        return createdSensorData;
      } catch (error) {
        logger.error('Error adding sensor data:', error);
        throw new Error('Failed to add sensor data');
      }
    },

    bulkAddSensorData: async (_: any, { inputs }: any) => {
      try {
        const results = [];
        
        for (const input of inputs) {
          const sensorData = {
            id: uuidv4(),
            deviceId: input.deviceId,
            sensorType: input.sensorType,
            value: input.value,
            unit: input.unit,
            timestamp: input.timestamp || new Date(),
            status: 'NORMAL',
            thresholds: null
          };

          // Determine status based on thresholds
          if (input.sensorType === 'TEMPERATURE' && input.value > 80) {
            sensorData.status = 'CRITICAL';
          } else if (input.sensorType === 'TEMPERATURE' && input.value > 70) {
            sensorData.status = 'WARNING';
          }

          const createdSensorData = await azureServices.createDocument('sensorData', sensorData);
          results.push(createdSensorData);

          // Publish sensor data update
          pubsub.publish('SENSOR_DATA_UPDATED', { 
            sensorDataUpdated: createdSensorData,
            deviceId: input.deviceId 
          });
        }

        logger.info(`Bulk sensor data added: ${results.length} records`);
        return results;
      } catch (error) {
        logger.error('Error adding bulk sensor data:', error);
        throw new Error('Failed to add bulk sensor data');
      }
    }
  },

  Subscription: {
    sensorDataUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(['SENSOR_DATA_UPDATED']),
        (payload, variables) => {
          if (!variables.deviceId) return true;
          return payload.deviceId === variables.deviceId;
        }
      )
    },

    deviceStatusChanged: {
      subscribe: () => pubsub.asyncIterator(['DEVICE_STATUS_CHANGED'])
    }
  }
};