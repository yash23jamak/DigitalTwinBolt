import { Notification, NotificationCallback } from '../types';
import { generateId } from '../utils/helpers';

class NotificationService {
  private static instance: NotificationService;
  private notifications: Notification[] = [];
  private callbacks: NotificationCallback[] = [];

  private constructor() { }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Add a new notification
   */
  public addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): string {
    const id = generateId();
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      duration: notification.duration ?? 5000 // Default 5 seconds
    };

    this.notifications.push(newNotification);
    this.notifyCallbacks(newNotification);

    // Auto-dismiss if duration is set and > 0
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }

  /**
   * Remove a notification by ID
   */
  public removeNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  /**
   * Get all notifications
   */
  public getNotifications(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Clear all notifications
   */
  public clearAll(): void {
    this.notifications = [];
  }

  /**
   * Subscribe to notification updates
   */
  public subscribe(callback: NotificationCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all callbacks
   */
  private notifyCallbacks(notification: Notification): void {
    this.callbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
  }

  // Convenience methods for different notification types
  public success(title: string, message: string, options?: Partial<Notification>): string {
    return this.addNotification({
      type: 'success',
      title,
      message,
      ...options
    });
  }

  public error(title: string, message: string, options?: Partial<Notification>): string {
    return this.addNotification({
      type: 'error',
      title,
      message,
      duration: 0, // Errors persist by default
      ...options
    });
  }

  public warning(title: string, message: string, options?: Partial<Notification>): string {
    return this.addNotification({
      type: 'warning',
      title,
      message,
      ...options
    });
  }

  public info(title: string, message: string, options?: Partial<Notification>): string {
    return this.addNotification({
      type: 'info',
      title,
      message,
      ...options
    });
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
