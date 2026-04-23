import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log: [
      ...(process.env.NODE_ENV !== 'production'
        ? [{ emit: 'stdout' as const, level: 'query' as const }]
        : []),
      { emit: 'stdout' as const, level: 'warn' as const },
      { emit: 'stdout' as const, level: 'error' as const },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Fallback unhandled rejection logger
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Promise rejection');
});

