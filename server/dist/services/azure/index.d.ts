import { BlobServiceClient } from '@azure/storage-blob';
import { CosmosClient } from '@azure/cosmos';
import { ServiceBusClient } from '@azure/service-bus';
import { TextAnalyticsClient } from '@azure/ai-text-analytics';
declare class AzureServices {
    private blobServiceClient;
    private cosmosClient;
    private serviceBusClient;
    private textAnalyticsClient;
    initialize(): Promise<void>;
    private initializeCosmosDB;
    uploadFile(containerName: string, fileName: string, data: Buffer): Promise<string>;
    deleteFile(containerName: string, fileName: string): Promise<void>;
    getFileUrl(containerName: string, fileName: string): Promise<string>;
    createDocument(containerName: string, document: any): Promise<any>;
    getDocument(containerName: string, id: string, partitionKey?: string): Promise<any>;
    queryDocuments(containerName: string, query: string, parameters?: any[]): Promise<any[]>;
    updateDocument(containerName: string, id: string, document: any, partitionKey?: string): Promise<any>;
    deleteDocument(containerName: string, id: string, partitionKey?: string): Promise<void>;
    sendMessage(queueName: string, message: any): Promise<void>;
    analyzeText(text: string): Promise<any>;
    get blobService(): BlobServiceClient | null;
    get cosmosDB(): CosmosClient | null;
    get serviceBus(): ServiceBusClient | null;
    get textAnalytics(): TextAnalyticsClient | null;
}
export declare const azureServices: AzureServices;
export {};
//# sourceMappingURL=index.d.ts.map