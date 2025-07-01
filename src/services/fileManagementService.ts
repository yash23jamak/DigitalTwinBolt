import { DigitalTwinModel } from '../types';
import { notificationService } from './notificationService';

class FileManagementService {
  private static instance: FileManagementService;

  private constructor() { }

  public static getInstance(): FileManagementService {
    if (!FileManagementService.instance) {
      FileManagementService.instance = new FileManagementService();
    }
    return FileManagementService.instance;
  }

  /**
   * Download a model file
   */
  public async downloadModel(model: DigitalTwinModel): Promise<void> {
    try {
      notificationService.info(
        'Download Started',
        `Preparing ${model.name} for download...`
      );

      // For blob URLs (uploaded files), we can download directly
      if (model.url.startsWith('blob:')) {
        await this.downloadFromBlob(model);
      } else {
        // For external URLs, fetch and download
        await this.downloadFromUrl(model);
      }

      notificationService.success(
        'Download Complete',
        `${model.name} has been downloaded successfully.`
      );
    } catch (error) {
      console.error('Error downloading model:', error);
      notificationService.error(
        'Download Failed',
        `Failed to download ${model.name}. Please try again.`
      );
    }
  }

  /**
   * Download from blob URL
   */
  private async downloadFromBlob(model: DigitalTwinModel): Promise<void> {
    const link = document.createElement('a');
    link.href = model.url;
    link.download = model.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Download from external URL
   */
  private async downloadFromUrl(model: DigitalTwinModel): Promise<void> {
    const response = await fetch(model.url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = model.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the blob URL
    window.URL.revokeObjectURL(url);
  }

  /**
   * Delete a model file with confirmation
   */
  public async deleteModel(
    model: DigitalTwinModel,
    onConfirm: (model: DigitalTwinModel) => void
  ): Promise<void> {
    return new Promise((resolve) => {
      // Show confirmation notification with action
      notificationService.warning(
        'Confirm Deletion',
        `Are you sure you want to delete "${model.name}"? This action cannot be undone.`,
        {
          duration: 0, // Don't auto-dismiss
          action: {
            label: 'Delete',
            onClick: () => {
              this.performDelete(model, onConfirm);
              resolve();
            }
          }
        }
      );
    });
  }

  /**
   * Perform the actual deletion
   */
  private performDelete(
    model: DigitalTwinModel,
    onConfirm: (model: DigitalTwinModel) => void
  ): void {
    try {
      // Clean up blob URL if it exists
      if (model.url.startsWith('blob:')) {
        URL.revokeObjectURL(model.url);
      }

      // Call the confirmation callback to remove from state
      onConfirm(model);

      notificationService.success(
        'Model Deleted',
        `${model.name} has been deleted successfully.`
      );
    } catch (error) {
      console.error('Error deleting model:', error);
      notificationService.error(
        'Deletion Failed',
        `Failed to delete ${model.name}. Please try again.`
      );
    }
  }

  /**
   * Get file size in human readable format
   */
  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate file before operations
   */
  public validateModel(model: DigitalTwinModel): boolean {
    if (!model.id || !model.name || !model.url) {
      notificationService.error(
        'Invalid Model',
        'Model data is incomplete or corrupted.'
      );
      return false;
    }
    return true;
  }

  /**
   * Bulk delete models
   */
  public async bulkDeleteModels(
    models: DigitalTwinModel[],
    onConfirm: (models: DigitalTwinModel[]) => void
  ): Promise<void> {
    if (models.length === 0) return;

    return new Promise((resolve) => {
      const modelNames = models.map(m => m.name).join(', ');
      notificationService.warning(
        'Confirm Bulk Deletion',
        `Are you sure you want to delete ${models.length} models? (${modelNames})`,
        {
          duration: 0,
          action: {
            label: `Delete ${models.length} Models`,
            onClick: () => {
              this.performBulkDelete(models, onConfirm);
              resolve();
            }
          }
        }
      );
    });
  }

  /**
   * Perform bulk deletion
   */
  private performBulkDelete(
    models: DigitalTwinModel[],
    onConfirm: (models: DigitalTwinModel[]) => void
  ): void {
    try {
      // Clean up blob URLs
      models.forEach(model => {
        if (model.url.startsWith('blob:')) {
          URL.revokeObjectURL(model.url);
        }
      });

      onConfirm(models);

      notificationService.success(
        'Models Deleted',
        `${models.length} models have been deleted successfully.`
      );
    } catch (error) {
      console.error('Error in bulk delete:', error);
      notificationService.error(
        'Bulk Deletion Failed',
        'Some models could not be deleted. Please try again.'
      );
    }
  }
}

// Export singleton instance
export const fileManagementService = FileManagementService.getInstance();
