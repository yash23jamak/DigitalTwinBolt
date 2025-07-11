export declare const deviceResolvers: {
    Query: {
        devices: (_: any, { limit, offset }: any) => Promise<any[]>;
        device: (_: any, { id }: any) => Promise<any>;
        devicesByModel: (_: any, { modelId }: any) => Promise<any[]>;
        sensorData: (_: any, { deviceId, from, to }: any) => Promise<unknown[]>;
    };
    Mutation: {
        createDevice: (_: any, { input }: any, { userId }: any) => Promise<any>;
        updateDevice: (_: any, { id, input }: any) => Promise<any>;
        deleteDevice: (_: any, { id }: any) => Promise<boolean>;
        addSensorData: (_: any, { input }: any) => Promise<any>;
        bulkAddSensorData: (_: any, { inputs }: any) => Promise<any[]>;
    };
    Subscription: {
        sensorDataUpdated: {
            subscribe: import("graphql-subscriptions").IterableResolverFn<any, any, any>;
        };
        deviceStatusChanged: {
            subscribe: () => any;
        };
    };
};
//# sourceMappingURL=deviceResolvers.d.ts.map