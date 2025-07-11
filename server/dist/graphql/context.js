"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContext = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
const createContext = async ({ req }) => {
    const context = { req };
    try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default-secret');
            context.userId = decoded.userId;
            context.user = decoded;
        }
    }
    catch (error) {
        logger_1.logger.warn('Invalid token provided:', error);
    }
    return context;
};
exports.createContext = createContext;
//# sourceMappingURL=context.js.map