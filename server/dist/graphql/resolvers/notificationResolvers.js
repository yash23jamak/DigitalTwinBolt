"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishNotification = exports.notificationResolvers = void 0;
const notificationService_1 = require("../../services/notificationService");
const logger_1 = require("../../utils/logger");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const pubsub = new graphql_subscriptions_1.PubSub();
exports.notificationResolvers = {
    Query: {
        notifications: async (_, { limit = 50, offset = 0, unreadOnly = false }, { userId }) => {
            try {
                if (!userId) {
                    throw new Error('Authentication required');
                }
                return await notificationService_1.notificationService.getNotifications(userId, limit, offset, unreadOnly);
            }
            catch (error) {
                logger_1.logger.error('Error fetching notifications:', error);
                throw new Error('Failed to fetch notifications');
            }
        },
        notification: async (_, { id }, { userId }) => {
            try {
                if (!userId) {
                    throw new Error('Authentication required');
                }
                const notification = await notificationService_1.notificationService.getNotification(id);
                if (notification && notification.userId !== userId) {
                    throw new Error('Access denied');
                }
                return notification;
            }
            catch (error) {
                logger_1.logger.error('Error fetching notification:', error);
                return null;
            }
        }
    },
    Mutation: {
        markNotificationRead: async (_, { id }, { userId }) => {
            try {
                if (!userId) {
                    throw new Error('Authentication required');
                }
                const notification = await notificationService_1.notificationService.getNotification(id);
                if (!notification) {
                    throw new Error('Notification not found');
                }
                if (notification.userId !== userId) {
                    throw new Error('Access denied');
                }
                return await notificationService_1.notificationService.markNotificationRead(id);
            }
            catch (error) {
                logger_1.logger.error('Error marking notification as read:', error);
                throw new Error('Failed to mark notification as read');
            }
        },
        markAllNotificationsRead: async (_, __, { userId }) => {
            try {
                if (!userId) {
                    throw new Error('Authentication required');
                }
                return await notificationService_1.notificationService.markAllNotificationsRead(userId);
            }
            catch (error) {
                logger_1.logger.error('Error marking all notifications as read:', error);
                throw new Error('Failed to mark all notifications as read');
            }
        },
        deleteNotification: async (_, { id }, { userId }) => {
            try {
                if (!userId) {
                    throw new Error('Authentication required');
                }
                const notification = await notificationService_1.notificationService.getNotification(id);
                if (!notification) {
                    throw new Error('Notification not found');
                }
                if (notification.userId !== userId) {
                    throw new Error('Access denied');
                }
                return await notificationService_1.notificationService.deleteNotification(id);
            }
            catch (error) {
                logger_1.logger.error('Error deleting notification:', error);
                throw new Error('Failed to delete notification');
            }
        }
    },
    Subscription: {
        notificationReceived: {
            subscribe: (0, graphql_subscriptions_1.withFilter)(() => pubsub.asyncIterator(['NOTIFICATION_RECEIVED']), (payload, variables, context) => {
                return payload.notificationReceived.userId === context.userId;
            })
        }
    }
};
const publishNotification = (notification) => {
    pubsub.publish('NOTIFICATION_RECEIVED', { notificationReceived: notification });
};
exports.publishNotification = publishNotification;
//# sourceMappingURL=notificationResolvers.js.map