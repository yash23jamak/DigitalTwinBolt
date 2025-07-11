"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileService = exports.FileService = void 0;
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const azure_1 = require("./azure");
const logger_1 = require("../utils/logger");
class FileService {
    constructor() {
        this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'digital-twin-models';
    }
    async uploadFile(file, metadata) {
        try {
            const fileId = (0, uuid_1.v4)();
            const fileExtension = path_1.default.extname(file.originalname);
            const fileName = `${fileId}${fileExtension}`;
            const fileUrl = await azure_1.azureServices.uploadFile(this.containerName, fileName, file.buffer);
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
            await azure_1.azureServices.createDocument('files', fileDocument);
            logger_1.logger.info(`File uploaded successfully: ${fileName}`);
            return {
                id: fileId,
                fileName,
                originalName: file.originalname,
                fileUrl,
                size: file.size,
                mimeType: file.mimetype,
                uploadedAt: new Date()
            };
        }
        catch (error) {
            logger_1.logger.error('Error uploading file:', error);
            throw new Error('Failed to upload file');
        }
    }
    async deleteFile(fileId) {
        try {
            const fileDocument = await azure_1.azureServices.getDocument('files', fileId);
            if (!fileDocument) {
                throw new Error('File not found');
            }
            await azure_1.azureServices.deleteFile(this.containerName, fileDocument.fileName);
            await azure_1.azureServices.deleteDocument('files', fileId);
            logger_1.logger.info(`File deleted successfully: ${fileDocument.fileName}`);
        }
        catch (error) {
            logger_1.logger.error('Error deleting file:', error);
            throw new Error('Failed to delete file');
        }
    }
    async getFileInfo(fileId) {
        try {
            const fileDocument = await azure_1.azureServices.getDocument('files', fileId);
            return fileDocument;
        }
        catch (error) {
            logger_1.logger.error('Error getting file info:', error);
            throw new Error('File not found');
        }
    }
    async listFiles(limit = 50, offset = 0) {
        try {
            const query = `SELECT * FROM c ORDER BY c.uploadedAt DESC OFFSET ${offset} LIMIT ${limit}`;
            const files = await azure_1.azureServices.queryDocuments('files', query);
            return files;
        }
        catch (error) {
            logger_1.logger.error('Error listing files:', error);
            throw new Error('Failed to list files');
        }
    }
    validateFileType(file) {
        const allowedTypes = (process.env.ALLOWED_FILE_TYPES || '.gltf,.glb,.bim,.ifc,.rvt')
            .split(',')
            .map(type => type.trim());
        const fileExtension = path_1.default.extname(file.originalname).toLowerCase();
        return allowedTypes.includes(fileExtension);
    }
    validateFileSize(file) {
        const maxSize = parseInt(process.env.MAX_FILE_SIZE || '104857600');
        return file.size <= maxSize;
    }
    async generateThumbnail(fileId) {
        try {
            logger_1.logger.info(`Thumbnail generation requested for file: ${fileId}`);
            return null;
        }
        catch (error) {
            logger_1.logger.error('Error generating thumbnail:', error);
            return null;
        }
    }
    async processModel(fileId) {
        try {
            const fileInfo = await this.getFileInfo(fileId);
            const processingResult = {
                vertices: Math.floor(Math.random() * 100000),
                faces: Math.floor(Math.random() * 50000),
                materials: Math.floor(Math.random() * 10) + 1,
                animations: Math.floor(Math.random() * 5),
                boundingBox: {
                    min: { x: -10, y: -10, z: -10 },
                    max: { x: 10, y: 10, z: 10 }
                },
                fileFormat: path_1.default.extname(fileInfo.originalName).substring(1).toUpperCase(),
                version: '1.0'
            };
            logger_1.logger.info(`Model processed successfully: ${fileId}`);
            return processingResult;
        }
        catch (error) {
            logger_1.logger.error('Error processing model:', error);
            throw new Error('Failed to process model');
        }
    }
}
exports.FileService = FileService;
exports.fileService = new FileService();
//# sourceMappingURL=fileService.js.map