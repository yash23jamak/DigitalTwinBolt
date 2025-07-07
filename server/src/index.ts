import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { createContext } from './graphql/context';
import { azureServices } from './services/azure';
import { logger } from './utils/logger';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { setupSocketIO } from './services/socketIO';
import { startCronJobs } from './services/cronJobs';

// Load environment variables
dotenv.config();

async function startServer() {
  try {
    // Initialize Azure services
    await azureServices.initialize();
    logger.info('Azure services initialized successfully');

    // Create Express app
    const app = express();
    const httpServer = http.createServer(app);

    // Initialize Socket.IO
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
      }
    });
    setupSocketIO(io);

    // Create Apollo Server
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
      formatError: (error) => {
        logger.error('GraphQL Error:', error);
        return {
          message: error.message,
          code: error.extensions?.code,
          path: error.path
        };
      }
    });

    await server.start();

    // Middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));
    
    app.use(compression());
    app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
    app.use(cors({
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true
    }));
    
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Rate limiting
    app.use(rateLimiter);

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // GraphQL endpoint
    app.use('/graphql', expressMiddleware(server, {
      context: createContext
    }));

    // File upload endpoint
    app.use('/api/upload', require('./routes/upload'));

    // Error handling middleware
    app.use(errorHandler);

    // Start cron jobs
    startCronJobs();

    const PORT = process.env.PORT || 4000;
    
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server ready at http://localhost:${PORT}`);
      logger.info(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
      logger.info(`🔌 Socket.IO ready for real-time connections`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();