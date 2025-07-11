"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const azure_1 = require("./azure");
const logger_1 = require("../utils/logger");
const uuid_1 = require("uuid");
class NotificationService {
    async createNotification(userId, type, title, message, severity = 'INFO', metadata = {}, actions = []) {
        try {
            const notification = {
                id: (0, uuid_1.v4)(),
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
            await azure_1.azureServices.createDocument('notifications', notification);
            await this.sendRealTimeNotification(notification);
            logger_1.logger.info(`Notification created for user ${userId}: ${title}`);
            return notification;
        }
        catch (error) {
            logger_1.logger.error('Error creating notification:', error);
            throw new Error('Failed to create notification');
        }
    }
    async getNotifications(userId, limit = 50, offset = 0, unreadOnly = false) {
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
            return await azure_1.azureServices.queryDocuments('notifications', query, parameters);
        }
        catch (error) {
            logger_1.logger.error('Error getting notifications:', error);
            return [];
        }
    }
    async getNotification(id) {
        try {
            return await azure_1.azureServices.getDocument('notifications', id);
        }
        catch (error) {
            logger_1.logger.error('Error getting notification:', error);
            return null;
        }
    }
    async markNotificationRead(id) {
        try {
            const notification = await this.getNotification(id);
            if (!notification)
                return null;
            notification.read = true;
            await azure_1.azureServices.updateDocument('notifications', id, notification);
            logger_1.logger.info(`Notification marked as read: ${id}`);
            return notification;
        }
        catch (error) {
            logger_1.logger.error('Error marking notification as read:', error);
            return null;
        }
    }
    async markAllNotificationsRead(userId) {
        try {
            const notifications = await this.getNotifications(userId, 1000, 0, true);
            for (const notification of notifications) {
                notification.read = true;
                await azure_1.azureServices.updateDocument('notifications', notification.id, notification);
            }
            logger_1.logger.info(`All notifications marked as read for user: ${userId}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error marking all notifications as read:', error);
            return false;
        }
    }
    async deleteNotification(id) {
        try {
            await azure_1.azureServices.deleteDocument('notifications', id);
            logger_1.logger.info(`Notification deleted: ${id}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error deleting notification:', error);
            return false;
        }
    }
    async sendRealTimeNotification(notification) {
        try {
            const message = {
                type: 'notification',
                userId: notification.userId,
                notification
            };
            await azure_1.azureServices.sendMessage('real-time-notifications', message);
        }
        catch (error) {
            logger_1.logger.error('Error sending real-time notification:', error);
        }
    }
    async createFaultNotification(userId, fault) {
        const actions = [
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
        return this.createNotification(userId, 'FAULT_DETECTED', `Fault Detected: ${fault.title}`, fault.description, fault.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING', { faultId: fault.id, modelId: fault.modelId }, actions);
    }
    async createMaintenanceNotification(userId, modelId, maintenanceType, dueDate) {
        const actions = [
            {
                id: 'schedule',
                label: 'Schedule Maintenance',
                action: 'schedule_maintenance',
                parameters: { modelId, maintenanceType }
            }
        ];
        return this.createNotification(userId, 'MAINTENANCE_DUE', `Maintenance Due: ${maintenanceType}`, `Maintenance is due for model ${modelId} on ${dueDate.toLocaleDateString()}`, 'WARNING', { modelId, maintenanceType, dueDate }, actions);
    }
    async createAnomalyNotification(userId, modelId, anomalyDetails) {
        return this.createNotification(userId, 'ANOMALY_DETECTED', 'Anomaly Detected', `Unusual behavior detected in model ${modelId}`, 'WARNING', { modelId, anomalyDetails });
    }
    async createModelProcessedNotification(userId, modelId, modelName) {
        const actions = [
            {
                id: 'view',
                label: 'View Model',
                action: 'view_model',
                parameters: { modelId }
            }
        ];
        return this.createNotification(userId, 'MODEL_PROCESSED', 'Model Processing Complete', `Model "${modelName}" has been successfully processed and is ready for use`, 'INFO', { modelId, modelName }, actions);
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
//# sourceMappingURL=notificationService.js.map