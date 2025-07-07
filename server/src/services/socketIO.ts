import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';

export function setupSocketIO(io: SocketIOServer): SocketIOServer {
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Join rooms for real-time updates
    socket.on('join-model', (modelId: string) => {
      socket.join(`model-${modelId}`);
      logger.info(`Socket ${socket.id} joined model room: ${modelId}`);
    });

    socket.on('join-device', (deviceId: string) => {
      socket.join(`device-${deviceId}`);
      logger.info(`Socket ${socket.id} joined device room: ${deviceId}`);
    });

    // Handle real-time sensor data
    socket.on('sensor-data', (data) => {
      // Broadcast to relevant rooms
      socket.broadcast.emit('sensor-update', data);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}