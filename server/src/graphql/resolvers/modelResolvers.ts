import { fileService } from '../../services/fileService';
import { azureServices } from '../../services/azure';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export const modelResolvers = {
  Query: {
    models: async (_: any, { limit = 50, offset = 0, filter }: any) => {
      try {
        let query = `SELECT * FROM c ORDER BY c.uploadDate DESC OFFSET ${offset} LIMIT ${limit}`;
        const parameters: any[] = [];

        if (filter) {
          query = `
            SELECT * FROM c 
            WHERE CONTAINS(LOWER(c.name), LOWER(@filter)) 
            OR CONTAINS(LOWER(c.description), LOWER(@filter))
            ORDER BY c.uploadDate DESC 
            OFFSET ${offset} LIMIT ${limit}
          `;
          parameters.push({ name: '@filter', value: filter });
        }

        return await azureServices.queryDocuments('models', query, parameters);
      } catch (error) {
        logger.error('Error fetching models:', error);
        throw new Error('Failed to fetch models');
      }
    },

    model: async (_: any, { id }: any) => {
      try {
        return await azureServices.getDocument('models', id);
      } catch (error) {
        logger.error('Error fetching model:', error);
        return null;
      }
    },

    modelsByType: async (_: any, { type }: any) => {
      try {
        const query = `SELECT * FROM c WHERE c.type = @type ORDER BY c.uploadDate DESC`;
        const parameters = [{ name: '@type', value: type }];
        
        return await azureServices.queryDocuments('models', query, parameters);
      } catch (error) {
        logger.error('Error fetching models by type:', error);
        throw new Error('Failed to fetch models by type');
      }
    }
  },

  Mutation: {
    uploadModel: async (_: any, { file, input }: any, { userId }: any) => {
      try {
        const { createReadStream, filename, mimetype, encoding } = await file;
        
        // Convert stream to buffer
        const stream = createReadStream();
        const chunks: Buffer[] = [];
        
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        
        const buffer = Buffer.concat(chunks);
        
        // Create mock file object for fileService
        const mockFile = {
          originalname: filename,
          mimetype,
          buffer,
          size: buffer.length
        } as Express.Multer.File;

        // Validate file
        if (!fileService.validateFileType(mockFile)) {
          throw new Error('Invalid file type');
        }

        if (!fileService.validateFileSize(mockFile)) {
          throw new Error('File size exceeds limit');
        }

        // Upload file
        const uploadResult = await fileService.uploadFile(mockFile, input);

        // Process model to extract metadata
        const metadata = await fileService.processModel(uploadResult.id);

        // Create model document
        const model = {
          id: uuidv4(),
          name: input.name,
          description: input.description || '',
          type: input.type,
          fileUrl: uploadResult.fileUrl,
          thumbnailUrl: await fileService.generateThumbnail(uploadResult.id),
          size: uploadResult.size,
          uploadDate: new Date(),
          lastModified: new Date(),
          coordinates: input.coordinates,
          metadata,
          status: 'PROCESSING',
          tags: input.tags || [],
          createdBy: userId || 'anonymous'
        };

        // Store model in Cosmos DB
        const createdModel = await azureServices.createDocument('models', model);

        // Start background processing
        setTimeout(async () => {
          try {
            createdModel.status = 'READY';
            await azureServices.updateDocument('models', createdModel.id, createdModel);
            logger.info(`Model processing completed: ${createdModel.id}`);
          } catch (error) {
            logger.error('Error updating model status:', error);
          }
        }, 5000);

        logger.info(`Model uploaded successfully: ${model.name}`);
        return createdModel;

      } catch (error) {
        logger.error('Error uploading model:', error);
        throw new Error('Failed to upload model');
      }
    },

    updateModel: async (_: any, { id, input }: any) => {
      try {
        const existingModel = await azureServices.getDocument('models', id);
        if (!existingModel) {
          throw new Error('Model not found');
        }

        const updatedModel = {
          ...existingModel,
          ...input,
          lastModified: new Date()
        };

        const result = await azureServices.updateDocument('models', id, updatedModel);
        logger.info(`Model updated successfully: ${id}`);
        return result;

      } catch (error) {
        logger.error('Error updating model:', error);
        throw new Error('Failed to update model');
      }
    },

    deleteModel: async (_: any, { id }: any) => {
      try {
        const model = await azureServices.getDocument('models', id);
        if (!model) {
          throw new Error('Model not found');
        }

        // Delete file from storage
        try {
          await fileService.deleteFile(id);
        } catch (error) {
          logger.warn('Error deleting file from storage:', error);
        }

        // Delete model document
        await azureServices.deleteDocument('models', id);

        logger.info(`Model deleted successfully: ${id}`);
        return true;

      } catch (error) {
        logger.error('Error deleting model:', error);
        throw new Error('Failed to delete model');
      }
    },

    processModel: async (_: any, { id }: any) => {
      try {
        const model = await azureServices.getDocument('models', id);
        if (!model) {
          throw new Error('Model not found');
        }

        // Update status to processing
        model.status = 'PROCESSING';
        await azureServices.updateDocument('models', id, model);

        // Simulate processing
        setTimeout(async () => {
          try {
            const metadata = await fileService.processModel(id);
            model.metadata = metadata;
            model.status = 'READY';
            model.lastModified = new Date();
            
            await azureServices.updateDocument('models', id, model);
            logger.info(`Model processing completed: ${id}`);
          } catch (error) {
            logger.error('Error in model processing:', error);
            model.status = 'ERROR';
            await azureServices.updateDocument('models', id, model);
          }
        }, 3000);

        return true;

      } catch (error) {
        logger.error('Error processing model:', error);
        throw new Error('Failed to process model');
      }
    }
  }
};