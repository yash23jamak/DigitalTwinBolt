export interface FileUploadResult {
    id: string;
    fileName: string;
    originalName: string;
    fileUrl: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
}
export declare class FileService {
    private containerName;
    constructor();
    uploadFile(file: Express.Multer.File, metadata?: any): Promise<FileUploadResult>;
    deleteFile(fileId: string): Promise<void>;
    getFileInfo(fileId: string): Promise<any>;
    listFiles(limit?: number, offset?: number): Promise<any[]>;
    validateFileType(file: Express.Multer.File): boolean;
    validateFileSize(file: Express.Multer.File): boolean;
    generateThumbnail(fileId: string): Promise<string | null>;
    processModel(fileId: string): Promise<any>;
}
export declare const fileService: FileService;
//# sourceMappingURL=fileService.d.ts.map