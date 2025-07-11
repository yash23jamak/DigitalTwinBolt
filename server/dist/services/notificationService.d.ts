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
export declare class NotificationService {
    createNotification(userId: string, type: Notification['type'], title: string, message: string, severity?: Notification['severity'], metadata?: any, actions?: NotificationAction[]): Promise<Notification>;
    getNotifications(userId: string, limit?: number, offset?: number, unreadOnly?: boolean): Promise<Notification[]>;
    getNotification(id: string): Promise<Notification | null>;
    markNotificationRead(id: string): Promise<Notification | null>;
    markAllNotificationsRead(userId: string): Promise<boolean>;
    deleteNotification(id: string): Promise<boolean>;
    private sendRealTimeNotification;
    createFaultNotification(userId: string, fault: any): Promise<Notification>;
    createMaintenanceNotification(userId: string, modelId: string, maintenanceType: string, dueDate: Date): Promise<Notification>;
    createAnomalyNotification(userId: string, modelId: string, anomalyDetails: any): Promise<Notification>;
    createModelProcessedNotification(userId: string, modelId: string, modelName: string): Promise<Notification>;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=notificationService.d.ts.map