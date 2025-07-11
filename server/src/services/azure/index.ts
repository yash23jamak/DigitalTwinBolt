import { BlobServiceClient } from '@azure/storage-blob';
import { CosmosClient } from '@azure/cosmos';
import { ServiceBusClient } from '@azure/service-bus';
// import { AnomalyDetectorClient } from '@azure/ai-anomaly-detector';
import { TextAnalyticsClient } from '@azure/ai-text-analytics';
import { DefaultAzureCredential } from '@azure/identity';
import { AzureKeyCredential } from '@azure/core-auth';
import { logger } from '../../utils/logger';

class AzureServices {
  private blobServiceClient: BlobServiceClient | null = null;
  private cosmosClient: CosmosClient | null = null;
  private serviceBusClient: ServiceBusClient | null = null;
  // private anomalyDetectorClient: AnomalyDetectorClient | null = null;
  private textAnalyticsClient: TextAnalyticsClient | null = null;

  async initialize() {
    try {
      // Initialize Blob Storage
      if (this.isValidAzureConfig(process.env.AZURE_STORAGE_CONNECTION_STRING)) {
        try {
          this.blobServiceClient = BlobServiceClient.fromConnectionString(
            process.env.AZURE_STORAGE_CONNECTION_STRING!
          );
          logger.info('Azure Blob Storage initialized');
        } catch (error) {
          logger.warn('Failed to initialize Azure Blob Storage:', error);
        }
      } else {
        logger.info('Azure Blob Storage not configured - using mock implementation');
      }

      // Initialize Cosmos DB
      if (this.isValidAzureConfig(process.env.AZURE_COSMOS_ENDPOINT) &&
        this.isValidAzureConfig(process.env.AZURE_COSMOS_KEY)) {
        try {
          this.cosmosClient = new CosmosClient({
            endpoint: process.env.AZURE_COSMOS_ENDPOINT!,
            key: process.env.AZURE_COSMOS_KEY!
          });

          // Create database and containers if they don't exist
          await this.initializeCosmosDB();
          logger.info('Azure Cosmos DB initialized');
        } catch (error) {
          logger.warn('Failed to initialize Azure Cosmos DB:', error);
        }
      } else {
        logger.info('Azure Cosmos DB not configured - using mock implementation');
      }

      // Initialize Service Bus
      if (this.isValidAzureConfig(process.env.AZURE_SERVICE_BUS_CONNECTION_STRING)) {
        try {
          this.serviceBusClient = new ServiceBusClient(
            process.env.AZURE_SERVICE_BUS_CONNECTION_STRING!
          );
          logger.info('Azure Service Bus initialized');
        } catch (error) {
          logger.warn('Failed to initialize Azure Service Bus:', error);
        }
      } else {
        logger.info('Azure Service Bus not configured - using mock implementation');
      }

      // Initialize Text Analytics
      if (this.isValidAzureConfig(process.env.AZURE_TEXT_ANALYTICS_ENDPOINT) &&
        this.isValidAzureConfig(process.env.AZURE_TEXT_ANALYTICS_KEY)) {
        try {
          this.textAnalyticsClient = new TextAnalyticsClient(
            process.env.AZURE_TEXT_ANALYTICS_ENDPOINT!,
            new AzureKeyCredential(process.env.AZURE_TEXT_ANALYTICS_KEY!)
          );
          logger.info('Azure Text Analytics initialized');
        } catch (error) {
          logger.warn('Failed to initialize Azure Text Analytics:', error);
        }
      } else {
        logger.info('Azure Text Analytics not configured - using mock implementation');
      }

      logger.info('Azure services initialization completed');

    } catch (error) {
      logger.error('Failed to initialize Azure services:', error);
      // Don't throw error in development - allow server to start with mock implementations
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  private isValidAzureConfig(value: string | undefined): boolean {
    return !!(value &&
      value !== 'your_azure_storage_connection_string' &&
      value !== 'your_cosmos_db_endpoint' &&
      value !== 'your_cosmos_db_key' &&
      value !== 'your_service_bus_connection_string' &&
      value !== 'your_anomaly_detector_endpoint' &&
      value !== 'your_anomaly_detector_key' &&
      value !== 'your_text_analytics_endpoint' &&
      value !== 'your_text_analytics_key' &&
      !value.startsWith('your_'));
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
      logger.warn(`Mock: Creating document in ${containerName}:`, document.id || 'unknown');
      return { ...document, id: document.id || `mock_${Date.now()}` };
    }

    const database = this.cosmosClient.database(process.env.AZURE_COSMOS_DATABASE_NAME || 'DigitalTwinDB');
    const container = database.container(containerName);

    const { resource } = await container.items.create(document);
    return resource;
  }

  async getDocument(containerName: string, id: string, partitionKey?: string): Promise<any> {
    if (!this.cosmosClient) {
      logger.warn(`Mock: Getting document ${id} from ${containerName}`);
      return null; // Mock implementation returns null for non-existent documents
    }

    const database = this.cosmosClient.database(process.env.AZURE_COSMOS_DATABASE_NAME ?? 'DigitalTwinDB');
    const container = database.container(containerName);

    const { resource } = await container.item(id, partitionKey ?? id).read();
    return resource;
  }

  async queryDocuments(containerName: string, query: string, parameters?: any[]): Promise<any[]> {
    if (!this.cosmosClient) {
      logger.warn(`Mock: Querying documents from ${containerName} with query: ${query}`);
      return []; // Mock implementation returns empty array
    }

    const database = this.cosmosClient.database(process.env.AZURE_COSMOS_DATABASE_NAME ?? 'DigitalTwinDB');
    const container = database.container(containerName);

    const querySpec = {
      query,
      parameters: parameters ?? []
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
      logger.warn(`Mock: Sending message to queue ${queueName}:`, message);
      return; // Mock implementation - just log the message
    }

    const sender = this.serviceBusClient.createSender(queueName);
    await sender.sendMessages({
      body: message,
      contentType: 'application/json'
    });
    await sender.close();
  }

  // AI Services methods
  // async detectAnomalies(data: { timestamp: Date; value: number }[]): Promise<any> {
  // if (!this.anomalyDetectorClient) {
  //   throw new Error('Anomaly Detector client not initialized');
  // }

  //   const request = {
  //     series: data.map(point => ({
  //       timestamp: point.timestamp,
  //       value: point.value
  //     })),
  //     granularity: 'daily'
  //   };

  //   return await this.anomalyDetectorClient.detectEntireSeries(request);
  // }

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
  // get anomalyDetector() { return this.anomalyDetectorClient; }
  get textAnalytics() { return this.textAnalyticsClient; }
}

export const azureServices = new AzureServices();