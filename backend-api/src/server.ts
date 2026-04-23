import { app } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';

const PORT = Number(env.PORT);

async function start() {
  try {
    // Verify DB connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT} [${env.NODE_ENV}]`);
      logger.info(`📋 Health check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    logger.error({ err }, '❌ Failed to start server');
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

start();
