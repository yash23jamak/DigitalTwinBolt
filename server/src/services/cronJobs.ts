import cron from 'node-cron';
import { logger } from '../utils/logger';
import { predictionService } from './predictionService';
import { faultDetectionService } from './faultDetectionService';

export function startCronJobs(): void {
  logger.info('Starting cron jobs...');

  // Run predictive analysis every hour
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Running hourly predictive analysis...');
      await predictionService.runScheduledAnalysis();
    } catch (error) {
      logger.error('Error in predictive analysis cron job:', error);
    }
  });

  // Run fault detection every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      logger.info('Running fault detection check...');
      await faultDetectionService.runScheduledCheck();
    } catch (error) {
      logger.error('Error in fault detection cron job:', error);
    }
  });

  // Clean up old logs and data every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      logger.info('Running daily cleanup...');
      // Add cleanup logic here
    } catch (error) {
      logger.error('Error in cleanup cron job:', error);
    }
  });

  // Health check every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      logger.info('Running system health check...');
      // Add health check logic here
    } catch (error) {
      logger.error('Error in health check cron job:', error);
    }
  });

  logger.info('Cron jobs started successfully');
}