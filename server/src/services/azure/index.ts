import { BlobServiceClient } from '@azure/storage-blob';
import { CosmosClient } from '@azure/cosmos';
import { ServiceBusClient } from '@azure/service-bus';
import { AnomalyDetectorClient } from '@azure/ai-anomaly-detector';
import { TextAnalyticsClient } from '@azure/ai-text-analytics';
import { DefaultAzureCredential } from '@azure/identity';
import { logger } from '../../utils/logger';

class AzureServices {
  private blobServiceClient: BlobServiceClient | null = null;
  private cosmosClient: CosmosClient | null = null;
  private serviceBusClient: ServiceBusClient | null = null;
  private anomalyDetectorClient: AnomalyDetectorClient | null = null;
  private textAnalyticsClient: TextAnalyticsClient | null = null;

  async initialize() {
    try {
      // Initialize Blob Storage
      if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
        this.blobServiceClient = BlobServiceClient.fromConnectionString(
          process.env.AZURE_STORAGE_CONNECTION_STRING
        );
        logger.info('Azure Blob Storage initialized');
      }

      // Initialize Cosmos DB
      if (process.env.AZURE_COSMOS_ENDPOINT && process.env.AZURE_COSMOS_KEY) {
        this.cosmosClient = new CosmosClient({
          endpoint: process.env.AZURE_COSMOS_ENDPOINT,
          key: process.env.AZURE_COSMOS_KEY
        });
        
        // Create database and containers if they don't exist
        await this.initializeCosmosDB();
        logger.info('Azure Cosmos DB initialized');
      }

      // Initialize Service Bus
      if (process.env.AZURE_SERVICE_BUS_CONNECTION_STRING) {
        this.serviceBusClient = new ServiceBusClient(
          process.env.AZURE_SERVICE_BUS_CONNECTION_STRING
        );
        logger.info('Azure Service Bus initialized');
      }

      // Initialize Anomaly Detector
      if (process.env.AZURE_ANOMALY_DETECTOR_ENDPOINT && process.env.AZURE_ANOMALY_DETECTOR_KEY) {
        this.anomalyDetectorClient = new AnomalyDetectorClient(
          process.env.AZURE_ANOMALY_DETECTOR_ENDPOINT,
          { key: process.env.AZURE_ANOMALY_DETECTOR_KEY }
        );
        logger.info('Azure Anomaly Detector initialized');
      }

      // Initialize Text Analytics
      if (process.env.AZURE_TEXT_ANALYTICS_ENDPOINT && process.env.AZURE_TEXT_ANALYTICS_KEY) {
        this.textAnalyticsClient = new TextAnalyticsClient(
          process.env.AZURE_TEXT_ANALYTICS_ENDPOINT,
          { key: process.env.AZURE_TEXT_ANALYTICS_KEY }
        );
        logger.info('Azure Text Analytics initialized');
      }

    } catch (error) {
      logger.error('Failed to initialize Azure services:', error);
      throw error;
    }
  }

  private async initializeCosmosDB() {
    if (!this.cosmosClient) return;

    const databaseName = process.env.AZURE_COSMOS_DATABASE_NAME || 'DigitalTwinDB';
    
    // Create database
    const { database } = await this.cosmosClient.databases.createIfNotExists({
      id: databaseName
    });

    // Create containers
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

  // Blob Storage methods
  async uploadFile(containerName: string, fileName: string, data: Buffer): Promise<string> {
    if (!this.blobServiceClient) {
      throw new Error('Blob service not initialized');
    }

    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists({ access: 'blob' });

    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.upload(data, data.length);

    return blockBlobClient.url;
  }

  async deleteFile(containerName: string, fileName: string): Promise<void> {
    if (!this.blobServiceClient) {
      throw new Error('Blob service not initialized');
    }

    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.delete();
  }

  async getFileUrl(containerName: string, fileName: string): Promise<string> {
    if (!this.blobServiceClient) {
      throw new Error('Blob service not initialized');
    }

    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    return blockBlobClient.url;
  }

  // Cosmos DB methods
  async createDocument(containerName: string, document: any): Promise<any> {
    if (!this.cosmosClient) {
      throw new Error('Cosmos client not initialized');
    }

    const database = this.cosmosClient.database(process.env.AZURE_COSMOS_DATABASE_NAME || 'DigitalTwinDB');
    const container = database.container(containerName);
    
    const { resource } = await container.items.create(document);
    return resource;
  }

  async getDocument(containerName: string, id: string, partitionKey?: string): Promise<any> {
    if (!this.cosmosClient) {
      throw new Error('Cosmos client not initialized');
    }

    const database = this.cosmosClient.database(process.env.AZURE_COSMOS_DATABASE_NAME || 'DigitalTwinDB');
    const container = database.container(containerName);
    
    const { resource } = await container.item(id, partitionKey || id).read();
    return resource;
  }

  async queryDocuments(containerName: string, query: string, parameters?: any[]): Promise<any[]> {
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

  async updateDocument(containerName: string, id: string, document: any, partitionKey?: string): Promise<any> {
    if (!this.cosmosClient) {
      throw new Error('Cosmos client not initialized');
    }

    const database = this.cosmosClient.database(process.env.AZURE_COSMOS_DATABASE_NAME || 'DigitalTwinDB');
    const container = database.container(containerName);
    
    const { resource } = await container.item(id, partitionKey || id).replace(document);
    return resource;
  }

  async deleteDocument(containerName: string, id: string, partitionKey?: string): Promise<void> {
    if (!this.cosmosClient) {
      throw new Error('Cosmos client not initialized');
    }

    const database = this.cosmosClient.database(process.env.AZURE_COSMOS_DATABASE_NAME || 'DigitalTwinDB');
    const container = database.container(containerName);
    
    await container.item(id, partitionKey || id).delete();
  }

  // Service Bus methods
  async sendMessage(queueName: string, message: any): Promise<void> {
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

  // AI Services methods
  async detectAnomalies(data: { timestamp: Date; value: number }[]): Promise<any> {
    if (!this.anomalyDetectorClient) {
      throw new Error('Anomaly Detector client not initialized');
    }

    const request = {
      series: data.map(point => ({
        timestamp: point.timestamp,
        value: point.value
      })),
      granularity: 'daily'
    };

    return await this.anomalyDetectorClient.detectEntireSeries(request);
  }

  async analyzeText(text: string): Promise<any> {
    if (!this.textAnalyticsClient) {
      throw new Error('Text Analytics client not initialized');
    }

    const results = await this.textAnalyticsClient.analyzeSentiment([text]);
    return results[0];
  }

  // Getters
  get blobService() { return this.blobServiceClient; }
  get cosmosDB() { return this.cosmosClient; }
  get serviceBus() { return this.serviceBusClient; }
  get anomalyDetector() { return this.anomalyDetectorClient; }
  get textAnalytics() { return this.textAnalyticsClient; }
}

export const azureServices = new AzureServices();