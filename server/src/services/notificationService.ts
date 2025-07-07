import { azureServices } from './azure';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface Notification {
  id: string;
  type: 'FAULT_DETECTED' | 'MAINTENANCE_DUE' | 'ANOMALY_DETECTED' | 'SYSTEM_ALERT' | 'MODEL_PROCESSED' | 'PREDICTION_READY';
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  timestamp: Date;
  read: boolean;
  userId: string;
  metadata: any;
  actions: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
  parameters: any;
}

export class NotificationService {
  async createNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    severity: Notification['severity'] = 'INFO',
    metadata: any = {},
    actions: NotificationAction[] = []
  ): Promise<Notification> {
    try {
      const notification: Notification = {
        id: uuidv4(),
        type,
        title,
        message,
        severity,
        timestamp: new Date(),
        read: false,
        userId,
        metadata,
        actions
      };

      // Store notification in Cosmos DB
      await azureServices.createDocument('notifications', notification);

      // Send real-time notification via Service Bus
      await this.sendRealTimeNotification(notification);

      logger.info(`Notification created for user ${userId}: ${title}`);
      return notification;

    } catch (error) {
      logger.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  async getNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    try {
      let query = `
        SELECT * FROM c 
        WHERE c.userId = @userId 
        ORDER BY c.timestamp DESC 
        OFFSET ${offset} LIMIT ${limit}
      `;

      const parameters = [
        { name: '@userId', value: userId }
      ];

      if (unreadOnly) {
        query = `
          SELECT * FROM c 
          WHERE c.userId = @userId 
          AND c.read = false 
          ORDER BY c.timestamp DESC 
          OFFSET ${offset} LIMIT ${limit}
        `;
      }

      return await azureServices.queryDocuments('notifications', query, parameters);

    } catch (error) {
      logger.error('Error getting notifications:', error);
      return [];
    }
  }

  async getNotification(id: string): Promise<Notification | null> {
    try {
      return await azureServices.getDocument('notifications', id);
    } catch (error) {
      logger.error('Error getting notification:', error);
      return null;
    }
  }

  async markNotificationRead(id: string): Promise<Notification | null> {
    try {
      const notification = await this.getNotification(id);
      if (!notification) return null;

      notification.read = true;
      await azureServices.updateDocument('notifications', id, notification);

      logger.info(`Notification marked as read: ${id}`);
      return notification;

    } catch (error) {
      logger.error('Error marking notification as read:', error);
      return null;
    }
  }

  async markAllNotificationsRead(userId: string): Promise<boolean> {
    try {
      const notifications = await this.getNotifications(userId, 1000, 0, true);
      
      for (const notification of notifications) {
        notification.read = true;
        await azureServices.updateDocument('notifications', notification.id, notification);
      }

      logger.info(`All notifications marked as read for user: ${userId}`);
      return true;

    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  async deleteNotification(id: string): Promise<boolean> {
    try {
      await azureServices.deleteDocument('notifications', id);
      logger.info(`Notification deleted: ${id}`);
      return true;

    } catch (error) {
      logger.error('Error deleting notification:', error);
      return false;
    }
  }

  private async sendRealTimeNotification(notification: Notification): Promise<void> {
    try {
      const message = {
        type: 'notification',
        userId: notification.userId,
        notification
      };

      await azureServices.sendMessage('real-time-notifications', message);
    } catch (error) {
      logger.error('Error sending real-time notification:', error);
    }
  }

  async createFaultNotification(
    userId: string,
    fault: any
  ): Promise<Notification> {
    const actions: NotificationAction[] = [
      {
        id: 'acknowledge',
        label: 'Acknowledge',
        action: 'acknowledge_fault',
        parameters: { faultId: fault.id }
      },
      {
        id: 'resolve',
        label: 'Resolve',
        action: 'resolve_fault',
        parameters: { faultId: fault.id }
      }
    ];

    return this.createNotification(
      userId,
      'FAULT_DETECTED',
      `Fault Detected: ${fault.title}`,
      fault.description,
      fault.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      { faultId: fault.id, modelId: fault.modelId },
      actions
    );
  }

  async createMaintenanceNotification(
    userId: string,
    modelId: string,
    maintenanceType: string,
    dueDate: Date
  ): Promise<Notification> {
    const actions: NotificationAction[] = [
      {
        id: 'schedule',
        label: 'Schedule Maintenance',
        action: 'schedule_maintenance',
        parameters: { modelId, maintenanceType }
      }
    ];

    return this.createNotification(
      userId,
      'MAINTENANCE_DUE',
      `Maintenance Due: ${maintenanceType}`,
      `Maintenance is due for model ${modelId} on ${dueDate.toLocaleDateString()}`,
      'WARNING',
      { modelId, maintenanceType, dueDate },
      actions
    );
  }

  async createAnomalyNotification(
    userId: string,
    modelId: string,
    anomalyDetails: any
  ): Promise<Notification> {
    return this.createNotification(
      userId,
      'ANOMALY_DETECTED',
      'Anomaly Detected',
      `Unusual behavior detected in model ${modelId}`,
      'WARNING',
      { modelId, anomalyDetails }
    );
  }

  async createModelProcessedNotification(
    userId: string,
    modelId: string,
    modelName: string
  ): Promise<Notification> {
    const actions: NotificationAction[] = [
      {
        id: 'view',
        label: 'View Model',
        action: 'view_model',
        parameters: { modelId }
      }
    ];

    return this.createNotification(
      userId,
      'MODEL_PROCESSED',
      'Model Processing Complete',
      `Model "${modelName}" has been successfully processed and is ready for use`,
      'INFO',
      { modelId, modelName },
      actions
    );
  }
}

export const notificationService = new NotificationService();