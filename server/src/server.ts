import { app } from './app.js';
import { config } from './config/index.js';
import { prisma } from './lib/prisma.js';

const server = app.listen(config.PORT, () => {
  console.log(`🚀 ProRoute API Server running on port ${config.PORT} [${config.NODE_ENV}]`);
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Database client disconnected.');
    process.exit(0);
  });

  // Force exit after 10s if stuck
  setTimeout(() => {
    console.error('Forcefully terminating server after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
