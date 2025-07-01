// Test file to demonstrate notification functionality
import { notificationService } from '../services/notificationService';
import { fileManagementService } from '../services/fileManagementService';

// Test notification service
export const testNotifications = () => {
  console.log('Testing notification system...');
  
  // Test success notification
  notificationService.success(
    'Test Success',
    'This is a test success notification'
  );
  
  // Test error notification
  setTimeout(() => {
    notificationService.error(
      'Test Error',
      'This is a test error notification that persists'
    );
  }, 1000);
  
  // Test warning notification
  setTimeout(() => {
    notificationService.warning(
      'Test Warning',
      'This is a test warning notification'
    );
  }, 2000);
  
  // Test info notification
  setTimeout(() => {
    notificationService.info(
      'Test Info',
      'This is a test info notification'
    );
  }, 3000);
  
  // Test notification with action
  setTimeout(() => {
    notificationService.addNotification({
      type: 'info',
      title: 'Test Action',
      message: 'This notification has an action button',
      duration: 0,
      action: {
        label: 'Click Me',
        onClick: () => {
          alert('Action button clicked!');
        }
      }
    });
  }, 4000);
};

// Test file management service
export const testFileManagement = () => {
  console.log('Testing file management system...');
  
  // Create a mock model for testing
  const mockModel = {
    id: 'test-model-1',
    name: 'test-model.gltf',
    url: 'blob:test-url',
    type: 'gltf' as const,
    uploadDate: new Date(),
    size: 1024 * 1024, // 1MB
    metadata: {
      vertices: 10000,
      faces: 5000,
      materials: 2,
      animations: 1
    }
  };
  
  // Test validation
  const isValid = fileManagementService.validateModel(mockModel);
  console.log('Model validation result:', isValid);
  
  // Test file size formatting
  const formattedSize = fileManagementService.formatFileSize(mockModel.size);
  console.log('Formatted file size:', formattedSize);
};

// Export test functions for use in console
if (typeof window !== 'undefined') {
  (window as any).testNotifications = testNotifications;
  (window as any).testFileManagement = testFileManagement;
}
