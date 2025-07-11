"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.azureServices = void 0;
const storage_blob_1 = require("@azure/storage-blob");
const cosmos_1 = require("@azure/cosmos");
const service_bus_1 = require("@azure/service-bus");
const ai_text_analytics_1 = require("@azure/ai-text-analytics");
const logger_1 = require("../../utils/logger");
class AzureServices {
    constructor() {
        this.blobServiceClient = null;
        this.cosmosClient = null;
        this.serviceBusClient = null;
        this.textAnalyticsClient = null;
    }
    async initialize() {
        try {
            if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
                this.blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
                logger_1.logger.info('Azure Blob Storage initialized');
            }
            if (process.env.AZURE_COSMOS_ENDPOINT && process.env.AZURE_COSMOS_KEY) {
                this.cosmosClient = new cosmos_1.CosmosClient({
                    endpoint: process.env.AZURE_COSMOS_ENDPOINT,
                    key: process.env.AZURE_COSMOS_KEY
                });
                await this.initializeCosmosDB();
                logger_1.logger.info('Azure Cosmos DB initialized');
            }
            if (process.env.AZURE_SERVICE_BUS_CONNECTION_STRING) {
                this.serviceBusClient = new service_bus_1.ServiceBusClient(process.env.AZURE_SERVICE_BUS_CONNECTION_STRING);
                logger_1.logger.info('Azure Service Bus initialized');
            }
            if (process.env.AZURE_TEXT_ANALYTICS_ENDPOINT && process.env.AZURE_TEXT_ANALYTICS_KEY) {
                this.textAnalyticsClient = new ai_text_analytics_1.TextAnalyticsClient(process.env.AZURE_TEXT_ANALYTICS_ENDPOINT, { key: process.env.AZURE_TEXT_ANALYTICS_KEY });
                logger_1.logger.info('Azure Text Analytics initialized');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Azure services:', error);
            throw error;
        }
    }
    async initializeCosmosDB() {
        if (!this.cosmosClient)
            return;
        const databaseName = process.env.AZURE_COSMOS_DATABASE_NAME || 'DigitalTwinDB';
        const { database } = await this.cosmosClient.databases.createIfNotExists({
            id: databaseName
        });
        const containers = [
            { id: 'models', partitionKey: '/id' },
            { id: 'devices', partitionKey: '/id' },
            { id: 'sensorData', partitionKey: '/deviceId' },
            { id: 'faults', partitionKey: '/modelId' },
            { id: 'predictions', partitionKey: '/modelId' },
            { id: 'notifications', partitionKey: '/userId' }
        ];
        for (const container of containers) {
            await database.containers.createIfNotExists(container);
        }
    }
    async uploadFile(containerName, fileName, data) {
        if (!this.blobServiceClient) {
            throw new Error('Blob service not initialized');
        }
        const containerClient = this.blobServiceClient.getContainerClient(containerName);
        await containerClient.createIfNotExists({ access: 'blob' });
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);
        await blockBlobClient.upload(data, data.length);
        return blockBlobClient.url;
    }
    async deleteFile(containerName, fileName) {
        if (!this.blobServiceClient) {
            throw new Error('Blob service not initialized');
        }
        const containerClient = this.blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);
        await blockBlobClient.delete();
    }
    async getFileUrl(containerName, fileName) {
        if (!this.blobServiceClient) {
            throw new Error('Blob service not initialized');
        }
        const containerClient = this.blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);
        return blockBlobClient.url;
    }
    async createDocument(containerName, document) {
        if (!this.cosmosClient) {
            throw new Error('Cosmos client not initialized');
        }
        const database = this.cosmosClient.database(process.env.AZURE_COSMOS_DATABASE_NAME || 'DigitalTwinDB');
        const container = database.container(containerName);
        const { resource } = await container.items.create(document);
        return resource;
    }
    async getDocument(containerName, id, partitionKey) {
        if (!this.cosmosClient) {
            throw new Error('Cosmos client not initialized');
        }
        const database = this.cosmosClient.database(process.env.AZURE_COSMOS_DATABASE_NAME || 'DigitalTwinDB');
        const container = database.container(containerName);
        const { resource } = await container.item(id, partitionKey || id).read();
        return resource;
    }
    async queryDocuments(containerName, query, parameters) {
        if (!this.cosmosClient) {
            throw new Error('Cosmos client not initialized');
        }
        const database = this.cosmosClient.database(process.env.AZURE_COSMOS_DATABASE_NAME || 'DigitalTwinDB');
        const container = database.container(containerName);
        const querySpec = {
            query,
            parameters: parameters || []
        };
        const { resources } = await container.items.query(querySpec).fetchAll();
        return resources;
    }
    async updateDocument(containerName, id, document, partitionKey) {
        if (!this.cosmosClient) {
            throw new Error('Cosmos client not initialized');
        }
        const database = this.cosmosClient.database(process.env.AZURE_COSMOS_DATABASE_NAME || 'DigitalTwinDB');
        const container = database.container(containerName);
        const { resource } = await container.item(id, partitionKey || id).replace(document);
        return resource;
    }
    async deleteDocument(containerName, id, partitionKey) {
        if (!this.cosmosClient) {
            throw new Error('Cosmos client not initialized');
        }
        const database = this.cosmosClient.database(process.env.AZURE_COSMOS_DATABASE_NAME || 'DigitalTwinDB');
        const container = database.container(containerName);
        await container.item(id, partitionKey || id).delete();
    }
    async sendMessage(queueName, message) {
        if (!this.serviceBusClient) {
            throw new Error('Service Bus client not initialized');
        }
        const sender = this.serviceBusClient.createSender(queueName);
        await sender.sendMessages({
            body: message,
            contentType: 'application/json'
        });
        await sender.close();
    }
    async analyzeText(text) {
        if (!this.textAnalyticsClient) {
            throw new Error('Text Analytics client not initialized');
        }
        const results = await this.textAnalyticsClient.analyzeSentiment([text]);
        return results[0];
    }
    get blobService() { return this.blobServiceClient; }
    get cosmosDB() { return this.cosmosClient; }
    get serviceBus() { return this.serviceBusClient; }
    get textAnalytics() { return this.textAnalyticsClient; }
}
exports.azureServices = new AzureServices();
//# sourceMappingURL=index.js.map