export interface FaultRule {
    id: string;
    name: string;
    modelId?: string;
    faultType: 'PERFORMANCE' | 'STRUCTURAL' | 'ENVIRONMENTAL' | 'CONNECTIVITY' | 'DATA_QUALITY';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    conditions: FaultCondition[];
    isActive: boolean;
    description: string;
    createdAt: Date;
    lastTriggered?: Date;
}
export interface FaultCondition {
    parameter: string;
    operator: 'gt' | 'lt' | 'eq' | 'ne' | 'between' | 'outside';
    value: number | [number, number];
    duration?: number;
}
export interface DetectedFault {
    id: string;
    ruleId: string;
    modelId: string;
    deviceId: string;
    title: string;
    description: string;
    severity: string;
    type: string;
    status: string;
    detectedAt: Date;
    resolvedAt?: Date;
    coordinates?: any;
    affectedComponents?: any[];
    diagnosticData?: any;
    recommendedActions?: string[];
    assignedTo?: string;
    createdBy?: string;
    resolution?: string;
    resolvedBy?: string;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
}
export declare class FaultDetectionService {
    private faultRules;
    constructor();
    private initializeDefaultRules;
    processSensorData(sensorData: any): Promise<DetectedFault[]>;
    private evaluateRuleConditions;
    private getParameterValue;
    private createFault;
    private generateDiagnosticData;
    private generateRecommendedActions;
    private sendFaultNotification;
    getFaults(limit?: number, offset?: number, status?: string): Promise<DetectedFault[]>;
    getFault(id: string): Promise<DetectedFault | null>;
    getActiveFaultsByModel(modelId: string): Promise<DetectedFault[]>;
    acknowledgeFault(id: string): Promise<DetectedFault | null>;
    resolveFault(id: string, resolution?: string): Promise<DetectedFault | null>;
    runScheduledCheck(): Promise<void>;
}
export declare const faultDetectionService: FaultDetectionService;
//# sourceMappingURL=faultDetectionService.d.ts.map