"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelResolvers = void 0;
const fileService_1 = require("../../services/fileService");
const azure_1 = require("../../services/azure");
const logger_1 = require("../../utils/logger");
const uuid_1 = require("uuid");
exports.modelResolvers = {
    Query: {
        models: async (_, { limit = 50, offset = 0, filter }) => {
            try {
                let query = `SELECT * FROM c ORDER BY c.uploadDate DESC OFFSET ${offset} LIMIT ${limit}`;
                const parameters = [];
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
                return await azure_1.azureServices.queryDocuments('models', query, parameters);
            }
            catch (error) {
                logger_1.logger.error('Error fetching models:', error);
                throw new Error('Failed to fetch models');
            }
        },
        model: async (_, { id }) => {
            try {
                return await azure_1.azureServices.getDocument('models', id);
            }
            catch (error) {
                logger_1.logger.error('Error fetching model:', error);
                return null;
            }
        },
        modelsByType: async (_, { type }) => {
            try {
                const query = `SELECT * FROM c WHERE c.type = @type ORDER BY c.uploadDate DESC`;
                const parameters = [{ name: '@type', value: type }];
                return await azure_1.azureServices.queryDocuments('models', query, parameters);
            }
            catch (error) {
                logger_1.logger.error('Error fetching models by type:', error);
                throw new Error('Failed to fetch models by type');
            }
        }
    },
    Mutation: {
        uploadModel: async (_, { file, input }, { userId }) => {
            try {
                const { createReadStream, filename, mimetype, encoding } = await file;
                const stream = createReadStream();
                const chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                const buffer = Buffer.concat(chunks);
                const mockFile = {
                    originalname: filename,
                    mimetype,
                    buffer,
                    size: buffer.length
                };
                if (!fileService_1.fileService.validateFileType(mockFile)) {
                    throw new Error('Invalid file type');
                }
                if (!fileService_1.fileService.validateFileSize(mockFile)) {
                    throw new Error('File size exceeds limit');
                }
                const uploadResult = await fileService_1.fileService.uploadFile(mockFile, input);
                const metadata = await fileService_1.fileService.processModel(uploadResult.id);
                const model = {
                    id: (0, uuid_1.v4)(),
                    name: input.name,
                    description: input.description || '',
                    type: input.type,
                    fileUrl: uploadResult.fileUrl,
                    thumbnailUrl: await fileService_1.fileService.generateThumbnail(uploadResult.id),
                    size: uploadResult.size,
                    uploadDate: new Date(),
                    lastModified: new Date(),
                    coordinates: input.coordinates,
                    metadata,
                    status: 'PROCESSING',
                    tags: input.tags || [],
                    createdBy: userId || 'anonymous'
                };
                const createdModel = await azure_1.azureServices.createDocument('models', model);
                setTimeout(async () => {
                    try {
                        createdModel.status = 'READY';
                        await azure_1.azureServices.updateDocument('models', createdModel.id, createdModel);
                        logger_1.logger.info(`Model processing completed: ${createdModel.id}`);
                    }
                    catch (error) {
                        logger_1.logger.error('Error updating model status:', error);
                    }
                }, 5000);
                logger_1.logger.info(`Model uploaded successfully: ${model.name}`);
                return createdModel;
            }
            catch (error) {
                logger_1.logger.error('Error uploading model:', error);
                throw new Error('Failed to upload model');
            }
        },
        updateModel: async (_, { id, input }) => {
            try {
                const existingModel = await azure_1.azureServices.getDocument('models', id);
                if (!existingModel) {
                    throw new Error('Model not found');
                }
                const updatedModel = {
                    ...existingModel,
                    ...input,
                    lastModified: new Date()
                };
                const result = await azure_1.azureServices.updateDocument('models', id, updatedModel);
                logger_1.logger.info(`Model updated successfully: ${id}`);
                return result;
            }
            catch (error) {
                logger_1.logger.error('Error updating model:', error);
                throw new Error('Failed to update model');
            }
        },
        deleteModel: async (_, { id }) => {
            try {
                const model = await azure_1.azureServices.getDocument('models', id);
                if (!model) {
                    throw new Error('Model not found');
                }
                try {
                    await fileService_1.fileService.deleteFile(id);
                }
                catch (error) {
                    logger_1.logger.warn('Error deleting file from storage:', error);
                }
                await azure_1.azureServices.deleteDocument('models', id);
                logger_1.logger.info(`Model deleted successfully: ${id}`);
                return true;
            }
            catch (error) {
                logger_1.logger.error('Error deleting model:', error);
                throw new Error('Failed to delete model');
            }
        },
        processModel: async (_, { id }) => {
            try {
                const model = await azure_1.azureServices.getDocument('models', id);
                if (!model) {
                    throw new Error('Model not found');
                }
                model.status = 'PROCESSING';
                await azure_1.azureServices.updateDocument('models', id, model);
                setTimeout(async () => {
                    try {
                        const metadata = await fileService_1.fileService.processModel(id);
                        model.metadata = metadata;
                        model.status = 'READY';
                        model.lastModified = new Date();
                        await azure_1.azureServices.updateDocument('models', id, model);
                        logger_1.logger.info(`Model processing completed: ${id}`);
                    }
                    catch (error) {
                        logger_1.logger.error('Error in model processing:', error);
                        model.status = 'ERROR';
                        await azure_1.azureServices.updateDocument('models', id, model);
                    }
                }, 3000);
                return true;
            }
            catch (error) {
                logger_1.logger.error('Error processing model:', error);
                throw new Error('Failed to process model');
            }
        }
    }
};
//# sourceMappingURL=modelResolvers.js.map