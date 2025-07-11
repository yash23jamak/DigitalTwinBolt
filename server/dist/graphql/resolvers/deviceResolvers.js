"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceResolvers = void 0;
const azure_1 = require("../../services/azure");
const logger_1 = require("../../utils/logger");
const uuid_1 = require("uuid");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const pubsub = new graphql_subscriptions_1.PubSub();
exports.deviceResolvers = {
    Query: {
        devices: async (_, { limit = 50, offset = 0 }) => {
            try {
                const query = `SELECT * FROM c ORDER BY c.lastSeen DESC OFFSET ${offset} LIMIT ${limit}`;
                return await azure_1.azureServices.queryDocuments('devices', query);
            }
            catch (error) {
                logger_1.logger.error('Error fetching devices:', error);
                throw new Error('Failed to fetch devices');
            }
        },
        device: async (_, { id }) => {
            try {
                return await azure_1.azureServices.getDocument('devices', id);
            }
            catch (error) {
                logger_1.logger.error('Error fetching device:', error);
                return null;
            }
        },
        devicesByModel: async (_, { modelId }) => {
            try {
                const query = `SELECT * FROM c WHERE c.modelId = @modelId ORDER BY c.lastSeen DESC`;
                const parameters = [{ name: '@modelId', value: modelId }];
                return await azure_1.azureServices.queryDocuments('devices', query, parameters);
            }
            catch (error) {
                logger_1.logger.error('Error fetching devices by model:', error);
                throw new Error('Failed to fetch devices by model');
            }
        },
        sensorData: async (_, { deviceId, from, to }) => {
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
                    parameters.push({ name: '@from', value: from }, { name: '@to', value: to });
                }
                const sensorData = await azure_1.azureServices.queryDocuments('sensorData', query, parameters);
                const latestSensors = sensorData.reduce((acc, data) => {
                    if (!acc[data.sensorType] || new Date(data.timestamp) > new Date(acc[data.sensorType].timestamp)) {
                        acc[data.sensorType] = data;
                    }
                    return acc;
                }, {});
                return Object.values(latestSensors);
            }
            catch (error) {
                logger_1.logger.error('Error fetching sensor data:', error);
                throw new Error('Failed to fetch sensor data');
            }
        }
    },
    Mutation: {
        createDevice: async (_, { input }, { userId }) => {
            try {
                const device = {
                    id: (0, uuid_1.v4)(),
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
                const createdDevice = await azure_1.azureServices.createDocument('devices', device);
                pubsub.publish('DEVICE_STATUS_CHANGED', { deviceStatusChanged: createdDevice });
                logger_1.logger.info(`Device created successfully: ${device.name}`);
                return createdDevice;
            }
            catch (error) {
                logger_1.logger.error('Error creating device:', error);
                throw new Error('Failed to create device');
            }
        },
        updateDevice: async (_, { id, input }) => {
            try {
                const existingDevice = await azure_1.azureServices.getDocument('devices', id);
                if (!existingDevice) {
                    throw new Error('Device not found');
                }
                const updatedDevice = {
                    ...existingDevice,
                    ...input,
                    lastModified: new Date()
                };
                const result = await azure_1.azureServices.updateDocument('devices', id, updatedDevice);
                pubsub.publish('DEVICE_STATUS_CHANGED', { deviceStatusChanged: result });
                logger_1.logger.info(`Device updated successfully: ${id}`);
                return result;
            }
            catch (error) {
                logger_1.logger.error('Error updating device:', error);
                throw new Error('Failed to update device');
            }
        },
        deleteDevice: async (_, { id }) => {
            try {
                const device = await azure_1.azureServices.getDocument('devices', id);
                if (!device) {
                    throw new Error('Device not found');
                }
                const sensorDataQuery = `SELECT * FROM c WHERE c.deviceId = @deviceId`;
                const sensorDataParams = [{ name: '@deviceId', value: id }];
                const sensorData = await azure_1.azureServices.queryDocuments('sensorData', sensorDataQuery, sensorDataParams);
                for (const data of sensorData) {
                    await azure_1.azureServices.deleteDocument('sensorData', data.id, data.deviceId);
                }
                await azure_1.azureServices.deleteDocument('devices', id);
                logger_1.logger.info(`Device deleted successfully: ${id}`);
                return true;
            }
            catch (error) {
                logger_1.logger.error('Error deleting device:', error);
                throw new Error('Failed to delete device');
            }
        },
        addSensorData: async (_, { input }) => {
            try {
                const sensorData = {
                    id: (0, uuid_1.v4)(),
                    deviceId: input.deviceId,
                    sensorType: input.sensorType,
                    value: input.value,
                    unit: input.unit,
                    timestamp: input.timestamp || new Date(),
                    status: 'NORMAL',
                    thresholds: null
                };
                if (input.sensorType === 'TEMPERATURE' && input.value > 80) {
                    sensorData.status = 'CRITICAL';
                }
                else if (input.sensorType === 'TEMPERATURE' && input.value > 70) {
                    sensorData.status = 'WARNING';
                }
                const createdSensorData = await azure_1.azureServices.createDocument('sensorData', sensorData);
                try {
                    const device = await azure_1.azureServices.getDocument('devices', input.deviceId);
                    if (device) {
                        device.lastSeen = new Date();
                        device.status = 'ONLINE';
                        await azure_1.azureServices.updateDocument('devices', input.deviceId, device);
                    }
                }
                catch (error) {
                    logger_1.logger.warn('Error updating device last seen:', error);
                }
                pubsub.publish('SENSOR_DATA_UPDATED', {
                    sensorDataUpdated: createdSensorData,
                    deviceId: input.deviceId
                });
                logger_1.logger.info(`Sensor data added for device: ${input.deviceId}`);
                return createdSensorData;
            }
            catch (error) {
                logger_1.logger.error('Error adding sensor data:', error);
                throw new Error('Failed to add sensor data');
            }
        },
        bulkAddSensorData: async (_, { inputs }) => {
            try {
                const results = [];
                for (const input of inputs) {
                    const sensorData = {
                        id: (0, uuid_1.v4)(),
                        deviceId: input.deviceId,
                        sensorType: input.sensorType,
                        value: input.value,
                        unit: input.unit,
                        timestamp: input.timestamp || new Date(),
                        status: 'NORMAL',
                        thresholds: null
                    };
                    if (input.sensorType === 'TEMPERATURE' && input.value > 80) {
                        sensorData.status = 'CRITICAL';
                    }
                    else if (input.sensorType === 'TEMPERATURE' && input.value > 70) {
                        sensorData.status = 'WARNING';
                    }
                    const createdSensorData = await azure_1.azureServices.createDocument('sensorData', sensorData);
                    results.push(createdSensorData);
                    pubsub.publish('SENSOR_DATA_UPDATED', {
                        sensorDataUpdated: createdSensorData,
                        deviceId: input.deviceId
                    });
                }
                logger_1.logger.info(`Bulk sensor data added: ${results.length} records`);
                return results;
            }
            catch (error) {
                logger_1.logger.error('Error adding bulk sensor data:', error);
                throw new Error('Failed to add bulk sensor data');
            }
        }
    },
    Subscription: {
        sensorDataUpdated: {
            subscribe: (0, graphql_subscriptions_1.withFilter)(() => pubsub.asyncIterator(['SENSOR_DATA_UPDATED']), (payload, variables) => {
                if (!variables.deviceId)
                    return true;
                return payload.deviceId === variables.deviceId;
            })
        },
        deviceStatusChanged: {
            subscribe: () => pubsub.asyncIterator(['DEVICE_STATUS_CHANGED'])
        }
    }
};
//# sourceMappingURL=deviceResolvers.js.map