import { DetectedFault } from '../../services/faultDetectionService';
export declare const faultResolvers: {
    Query: {
        faults: (_: any, { limit, offset, status }: any) => Promise<DetectedFault[]>;
        fault: (_: any, { id }: any) => Promise<DetectedFault | null>;
        faultsByModel: (_: any, { modelId }: any) => Promise<any[]>;
        faultsByDevice: (_: any, { deviceId }: any) => Promise<any[]>;
    };
    Mutation: {
        createFault: (_: any, { input }: any, { userId }: any) => Promise<any>;
        acknowledgeFault: (_: any, { id }: any, { userId }: any) => Promise<DetectedFault>;
        resolveFault: (_: any, { id, resolution }: any, { userId }: any) => Promise<DetectedFault>;
    };
    Subscription: {
        faultDetected: {
            subscribe: () => any;
        };
    };
};
//# sourceMappingURL=faultResolvers.d.ts.map