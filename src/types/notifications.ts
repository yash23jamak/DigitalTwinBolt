// Notification System Types
export interface Notification {
  read: any;
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number; // Auto-dismiss duration in ms, 0 for persistent
  action?: {
    label: string;
    onClick: () => void;
  };
}

export type NotificationCallback = (notification: Notification) => void;
