import { notificationService } from '../../services/notificationService';
import { logger } from '../../utils/logger';
import { withFilter, PubSub as GqlPubSub } from 'graphql-subscriptions';

const pubsub: any = new GqlPubSub();

export const notificationResolvers = {
    Query: {
        notifications: async (_: any, { limit = 50, offset = 0, unreadOnly = false }: any, { userId }: any) => {
            try {
                if (!userId) {
                    throw new Error('Authentication required');
                }

                return await notificationService.getNotifications(userId, limit, offset, unreadOnly);
            } catch (error) {
                logger.error('Error fetching notifications:', error);
                throw new Error('Failed to fetch notifications');
            }
        },

        notification: async (_: any, { id }: any, { userId }: any) => {
            try {
                if (!userId) {
                    throw new Error('Authentication required');
                }

                const notification = await notificationService.getNotification(id);

                // Check if user owns this notification
                if (notification && notification.userId !== userId) {
                    throw new Error('Access denied');
                }

                return notification;
            } catch (error) {
                logger.error('Error fetching notification:', error);
                return null;
            }
        }
    },

    Mutation: {
        markNotificationRead: async (_: any, { id }: any, { userId }: any) => {
            try {
                if (!userId) {
                    throw new Error('Authentication required');
                }

                const notification = await notificationService.getNotification(id);
                if (!notification) {
                    throw new Error('Notification not found');
                }

                if (notification.userId !== userId) {
                    throw new Error('Access denied');
                }

                return await notificationService.markNotificationRead(id);
            } catch (error) {
                logger.error('Error marking notification as read:', error);
                throw new Error('Failed to mark notification as read');
            }
        },

        markAllNotificationsRead: async (_: any, __: any, { userId }: any) => {
            try {
                if (!userId) {
                    throw new Error('Authentication required');
                }

                return await notificationService.markAllNotificationsRead(userId);
            } catch (error) {
                logger.error('Error marking all notifications as read:', error);
                throw new Error('Failed to mark all notifications as read');
            }
        },

        deleteNotification: async (_: any, { id }: any, { userId }: any) => {
            try {
                if (!userId) {
                    throw new Error('Authentication required');
                }

                const notification = await notificationService.getNotification(id);
                if (!notification) {
                    throw new Error('Notification not found');
                }

                if (notification.userId !== userId) {
                    throw new Error('Access denied');
                }

                return await notificationService.deleteNotification(id);
            } catch (error) {
                logger.error('Error deleting notification:', error);
                throw new Error('Failed to delete notification');
            }
        }
    },

    Subscription: {
        notificationReceived: {
            subscribe: withFilter(
                () => pubsub.asyncIterator(['NOTIFICATION_RECEIVED']),
                (payload, variables, context) => {
                    // Only send notifications to the intended user
                    return payload.notificationReceived.userId === context.userId;
                }
            )
        }
    }
};

// Helper function to publish notifications (can be called from other services)
export const publishNotification = (notification: any) => {
    pubsub.publish('NOTIFICATION_RECEIVED', { notificationReceived: notification });
};