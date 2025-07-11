"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketIO = setupSocketIO;
const logger_1 = require("../utils/logger");
function setupSocketIO(io) {
    io.on('connection', (socket) => {
        logger_1.logger.info(`Client connected: ${socket.id}`);
        socket.on('join-model', (modelId) => {
            socket.join(`model-${modelId}`);
            logger_1.logger.info(`Socket ${socket.id} joined model room: ${modelId}`);
        });
        socket.on('join-device', (deviceId) => {
            socket.join(`device-${deviceId}`);
            logger_1.logger.info(`Socket ${socket.id} joined device room: ${deviceId}`);
        });
        socket.on('sensor-data', (data) => {
            socket.broadcast.emit('sensor-update', data);
        });
        socket.on('disconnect', () => {
            logger_1.logger.info(`Client disconnected: ${socket.id}`);
        });
    });
    return io;
}
//# sourceMappingURL=socketIO.js.map