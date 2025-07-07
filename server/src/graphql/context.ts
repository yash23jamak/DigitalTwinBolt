import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export interface Context {
  userId?: string;
  user?: any;
  req: Request;
}

export const createContext = async ({ req }: { req: Request }): Promise<Context> => {
  const context: Context = { req };

  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
      context.userId = decoded.userId;
      context.user = decoded;
    }
  } catch (error) {
    logger.warn('Invalid token provided:', error);
  }

  return context;
};