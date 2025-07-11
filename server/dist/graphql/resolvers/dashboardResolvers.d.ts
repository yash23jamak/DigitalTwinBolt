export declare const dashboardResolvers: {
    Query: {
        dashboardMetrics: (_: any, __: any, { userId }: any) => Promise<{
            totalModels: any;
            activeDevices: any;
            activeFaults: any;
            systemHealth: number;
            dataPoints: any;
            lastUpdated: Date;
        }>;
        systemHealth: (_: any, __: any, { userId }: any) => Promise<{
            overall: number;
            components: {
                name: string;
                status: string;
                health: number;
                lastChecked: Date;
            }[];
            trends: {
                timestamp: Date;
                value: number;
            }[];
        }>;
    };
    Subscription: {
        systemHealthUpdated: {
            subscribe: () => any;
        };
    };
};
export declare const publishSystemHealthUpdate: (healthData: any) => void;
//# sourceMappingURL=dashboardResolvers.d.ts.map