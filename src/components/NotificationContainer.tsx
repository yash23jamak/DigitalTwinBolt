import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  ExternalLink
} from 'lucide-react';
import { Notification } from '../types';
import { notificationService } from '../services/notificationService';
import { palette, responsive } from '../styles/palette';

export const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notification) => {
      setNotifications(prev => [...prev, notification]);
    });

    setNotifications(notificationService.getNotifications());

    return unsubscribe;
  }, []);

  const removeNotification = (id: string) => {
    notificationService.removeNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />;
      case 'info':
        return <Info className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />;
      default:
        return <Info className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />;
    }
  };

  const getNotificationStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20 text-green-100';
      case 'error':
        return 'bg-red-500/10 border-red-500/20 text-red-100';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-100';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-100';
      default:
        return 'bg-blue-500/10 border-blue-500/20 text-blue-100';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-80 sm:w-96 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            ${getNotificationStyles(notification.type)}
            backdrop-blur-sm rounded-xl border p-3 md:p-4 shadow-lg
            animate-in slide-in-from-right-full duration-300
            hover:shadow-xl transition-all
          `}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {getNotificationIcon(notification.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium text-white mb-1 text-sm md:text-base">
                {notification.title}
              </div>
              <div className="text-xs md:text-sm opacity-90">
                {notification.message}
              </div>

              {notification.action && (
                <button
                  onClick={notification.action.onClick}
                  className="mt-2 inline-flex items-center space-x-1 text-xs md:text-sm font-medium hover:underline"
                >
                  <span>{notification.action.label}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="Dismiss"
            >
              <X className="w-3 h-3 md:w-4 md:h-4" />
            </button>
          </div>

          {/* Progress bar for auto-dismiss */}
          {notification.duration && notification.duration > 0 && (
            <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/30 rounded-full"
                style={{
                  animation: `shrink ${notification.duration}ms linear forwards`
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};