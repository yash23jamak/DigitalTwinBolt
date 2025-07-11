"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const drainHttpServer_1 = require("@apollo/server/plugin/drainHttpServer");
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const schema_1 = require("./graphql/schema");
const resolvers_1 = require("./graphql/resolvers");
const context_1 = require("./graphql/context");
const azure_1 = require("./services/azure");
const logger_1 = require("./utils/logger");
const rateLimiter_1 = require("./middleware/rateLimiter");
const errorHandler_1 = require("./middleware/errorHandler");
const socketIO_1 = require("./services/socketIO");
const cronJobs_1 = require("./services/cronJobs");
dotenv_1.default.config();
async function startServer() {
    try {
        await azure_1.azureServices.initialize();
        logger_1.logger.info('Azure services initialized successfully');
        const app = (0, express_1.default)();
        const httpServer = http_1.default.createServer(app);
        const io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: process.env.CLIENT_URL || "http://localhost:5173",
                methods: ["GET", "POST"]
            }
        });
        (0, socketIO_1.setupSocketIO)(io);
        const resolvers = await (0, resolvers_1.createResolvers)();
        const server = new server_1.ApolloServer({
            typeDefs: schema_1.typeDefs,
            resolvers,
            plugins: [(0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer })],
            formatError: (error) => {
                logger_1.logger.error('GraphQL Error:', error);
                return {
                    message: error.message,
                    code: error.extensions?.code,
                    path: error.path
                };
            }
        });
        await server.start();
        app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));
        app.use((0, compression_1.default)());
        app.use((0, morgan_1.default)('combined', { stream: { write: (message) => logger_1.logger.info(message.trim()) } }));
        app.use((0, cors_1.default)({
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            credentials: true
        }));
        app.use(express_1.default.json({ limit: '50mb' }));
        app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
        app.use(rateLimiter_1.rateLimiter);
        app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '1.0.0'
            });
        });
        app.use('/graphql', (0, express4_1.expressMiddleware)(server, {
            context: context_1.createContext
        }));
        app.use('/api/upload', require('./routes/upload'));
        app.use(errorHandler_1.errorHandler);
        (0, cronJobs_1.startCronJobs)();
        const PORT = process.env.PORT || 4000;
        httpServer.listen(PORT, () => {
            logger_1.logger.info(`🚀 Server ready at http://localhost:${PORT}`);
            logger_1.logger.info(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
            logger_1.logger.info(`🔌 Socket.IO ready for real-time connections`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
startServer();
//# sourceMappingURL=index.js.map