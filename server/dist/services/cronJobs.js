"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCronJobs = startCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const logger_1 = require("../utils/logger");
const predictionService_1 = require("./predictionService");
const faultDetectionService_1 = require("./faultDetectionService");
function startCronJobs() {
    logger_1.logger.info('Starting cron jobs...');
    node_cron_1.default.schedule('0 * * * *', async () => {
        try {
            logger_1.logger.info('Running hourly predictive analysis...');
            await predictionService_1.predictionService.runScheduledAnalysis();
        }
        catch (error) {
            logger_1.logger.error('Error in predictive analysis cron job:', error);
        }
    });
    node_cron_1.default.schedule('*/5 * * * *', async () => {
        try {
            logger_1.logger.info('Running fault detection check...');
            await faultDetectionService_1.faultDetectionService.runScheduledCheck();
        }
        catch (error) {
            logger_1.logger.error('Error in fault detection cron job:', error);
        }
    });
    node_cron_1.default.schedule('0 0 * * *', async () => {
        try {
            logger_1.logger.info('Running daily cleanup...');
        }
        catch (error) {
            logger_1.logger.error('Error in cleanup cron job:', error);
        }
    });
    node_cron_1.default.schedule('*/30 * * * *', async () => {
        try {
            logger_1.logger.info('Running system health check...');
        }
        catch (error) {
            logger_1.logger.error('Error in health check cron job:', error);
        }
    });
    logger_1.logger.info('Cron jobs started successfully');
}
//# sourceMappingURL=cronJobs.js.map