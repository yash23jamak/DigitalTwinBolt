export declare const notificationResolvers: {
    Query: {
        notifications: (_: any, { limit, offset, unreadOnly }: any, { userId }: any) => Promise<import("../../services/notificationService").Notification[]>;
        notification: (_: any, { id }: any, { userId }: any) => Promise<import("../../services/notificationService").Notification | null>;
    };
    Mutation: {
        markNotificationRead: (_: any, { id }: any, { userId }: any) => Promise<import("../../services/notificationService").Notification | null>;
        markAllNotificationsRead: (_: any, __: any, { userId }: any) => Promise<boolean>;
        deleteNotification: (_: any, { id }: any, { userId }: any) => Promise<boolean>;
    };
    Subscription: {
        notificationReceived: {
            subscribe: import("graphql-subscriptions").IterableResolverFn<any, any, any>;
        };
    };
};
export declare const publishNotification: (notification: any) => void;
//# sourceMappingURL=notificationResolvers.d.ts.map