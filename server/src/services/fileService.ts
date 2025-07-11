import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { azureServices } from './azure';
import { logger } from '../utils/logger';

export interface FileUploadResult {
  id: string;
  fileName: string;
  originalName: string;
  fileUrl: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export class FileService {
  private containerName: string;

  constructor() {
    this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'digital-twin-models';
  }

  async uploadFile(
    file: Express.Multer.File,
    metadata?: any
  ): Promise<FileUploadResult> {
    try {
      const fileId = uuidv4();
      const fileExtension = path.extname(file.originalname);
      const fileName = `${fileId}${fileExtension}`;

      // Upload to Azure Blob Storage
      const fileUrl = await azureServices.uploadFile(
        this.containerName,
        fileName,
        file.buffer
      );

      // Store file metadata in Cosmos DB
      const fileDocument = {
        id: fileId,
        fileName,
        originalName: file.originalname,
        fileUrl,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
        metadata: metadata || {}
      };

      await azureServices.createDocument('files', fileDocument);

      logger.info(`File uploaded successfully: ${fileName}`);

      return {
        id: fileId,
        fileName,
        originalName: file.originalname,
        fileUrl,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date()
      };

    } catch (error) {
      logger.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      // Get file metadata from Cosmos DB
      const fileDocument = await azureServices.getDocument('files', fileId);
      
      if (!fileDocument) {
        throw new Error('File not found');
      }

      // Delete from Azure Blob Storage
      await azureServices.deleteFile(this.containerName, fileDocument.fileName);

      // Delete metadata from Cosmos DB
      await azureServices.deleteDocument('files', fileId);

      logger.info(`File deleted successfully: ${fileDocument.fileName}`);

    } catch (error) {
      logger.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  async getFileInfo(fileId: string): Promise<any> {
    try {
      const fileDocument = await azureServices.getDocument('files', fileId);
      return fileDocument;
    } catch (error) {
      logger.error('Error getting file info:', error);
      throw new Error('File not found');
    }
  }

  async listFiles(limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const query = `SELECT * FROM c ORDER BY c.uploadedAt DESC OFFSET ${offset} LIMIT ${limit}`;
      const files = await azureServices.queryDocuments('files', query);
      return files;
    } catch (error) {
      logger.error('Error listing files:', error);
      throw new Error('Failed to list files');
    }
  }

  validateFileType(file: Express.Multer.File): boolean {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || '.gltf,.glb,.bim,.ifc,.rvt')
      .split(',')
      .map(type => type.trim());

    const fileExtension = path.extname(file.originalname).toLowerCase();
    return allowedTypes.includes(fileExtension);
  }

  validateFileSize(file: Express.Multer.File): boolean {
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '104857600'); // 100MB default
    return file.size <= maxSize;
  }

  async generateThumbnail(fileId: string): Promise<string | null> {
    try {
      // This would integrate with Azure Functions or other services
      // to generate thumbnails for 3D models
      // For now, return null as placeholder
      logger.info(`Thumbnail generation requested for file: ${fileId}`);
      return null;
    } catch (error) {
      logger.error('Error generating thumbnail:', error);
      return null;
    }
  }

  async processModel(fileId: string): Promise<any> {
    try {
      // This would integrate with Azure Functions or other services
      // to process 3D models (extract metadata, validate, etc.)
      const fileInfo = await this.getFileInfo(fileId);
      
      // Mock processing result
      const processingResult = {
        vertices: Math.floor(Math.random() * 100000),
        faces: Math.floor(Math.random() * 50000),
        materials: Math.floor(Math.random() * 10) + 1,
        animations: Math.floor(Math.random() * 5),
        boundingBox: {
          min: { x: -10, y: -10, z: -10 },
          max: { x: 10, y: 10, z: 10 }
        },
        fileFormat: path.extname(fileInfo.originalName).substring(1).toUpperCase(),
        version: '1.0'
      };

      logger.info(`Model processed successfully: ${fileId}`);
      return processingResult;

    } catch (error) {
      logger.error('Error processing model:', error);
      throw new Error('Failed to process model');
    }
  }
}

export const fileService = new FileService();