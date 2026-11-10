import { app } from './app.js';
import { config } from './config/index.js';
import { prisma } from './lib/prisma.js';
import { logger } from './lib/logger.js';

const server = app.listen(config.PORT, () => {
  logger.info(`🚀 ProRoute API Server running on port ${config.PORT} [${config.NODE_ENV}]`);
});

let isShuttingDown = false;

const gracefulShutdown = async (signal: string, exitCode = 0) => {
  if (isShuttingDown) {
    logger.warn(`Shutdown already in progress. Ignoring duplicate signal: ${signal}`);
    return;
  }
  isShuttingDown = true;

  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Fail-safe force exit after 10s if in-flight requests or DB hangs
  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded (10s). Forcefully terminating process.');
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  try {
    // 1. Connection Draining: Stop accepting new requests and finish in-flight requests
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    logger.info('HTTP server closed. All in-flight requests completed.');

    // 2. Resource Cleanup: Disconnect database pool safely
    await prisma.$disconnect();
    logger.info('Database client disconnected cleanly.');

    logger.info(`Graceful shutdown completed successfully. Exiting with code ${exitCode}.`);
    process.exit(exitCode);
  } catch (err: unknown) {
    logger.error({ err }, 'Error occurred during graceful shutdown. Exiting with failure code 1.');
    process.exit(1);
  }
};

// Process Termination Signals
process.on('SIGINT', () => gracefulShutdown('SIGINT', 0));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM', 0));

// Process Fatal Failure Listeners
process.on('unhandledRejection', (reason: unknown) => {
  logger.fatal({ err: reason }, 'Unhandled Promise Rejection detected in process.');
  gracefulShutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (err: Error) => {
  logger.fatal({ err }, 'Uncaught Exception detected in process.');
  gracefulShutdown('uncaughtException', 1);
});

