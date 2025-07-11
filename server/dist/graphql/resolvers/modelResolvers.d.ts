export declare const modelResolvers: {
    Query: {
        models: (_: any, { limit, offset, filter }: any) => Promise<any[]>;
        model: (_: any, { id }: any) => Promise<any>;
        modelsByType: (_: any, { type }: any) => Promise<any[]>;
    };
    Mutation: {
        uploadModel: (_: any, { file, input }: any, { userId }: any) => Promise<any>;
        updateModel: (_: any, { id, input }: any) => Promise<any>;
        deleteModel: (_: any, { id }: any) => Promise<boolean>;
        processModel: (_: any, { id }: any) => Promise<boolean>;
    };
};
//# sourceMappingURL=modelResolvers.d.ts.map