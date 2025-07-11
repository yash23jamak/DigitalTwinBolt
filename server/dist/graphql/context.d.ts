import { Request } from 'express';
export interface Context {
    userId?: string;
    user?: any;
    req: Request;
}
export declare const createContext: ({ req }: {
    req: Request;
}) => Promise<Context>;
//# sourceMappingURL=context.d.ts.map