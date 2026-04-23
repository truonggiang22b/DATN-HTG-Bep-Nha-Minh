import 'dotenv/config';
import './config/env'; // validates env vars early, fails fast if missing

import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { logger } from './lib/logger';
import { errorHandler } from './middlewares/errorHandler';
import { healthRouter } from './modules/health/health.router';
import { publicRouter } from './modules/public/public.router';
import { authRouter } from './modules/auth/auth.router';
import { internalRouter } from './modules/internal/internal.router';

const app = express();

// ─── Security middleware ──────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ─── CORS ────────────────────────────────────────────────────────────────────
// Support nhiều origin: dev localhost + production FRONTEND_URL
const allowedOrigins = new Set<string>([env.FRONTEND_URL]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server (no origin) and localhost in non-production
      if (!origin) return callback(null, true);
      if (env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      if (allowedOrigins.has(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

// ─── Request parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request logging ──────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    customLogLevel: (_req, res) => (res.statusCode >= 500 ? 'error' : 'info'),
  })
);

// ─── Rate limiters ────────────────────────────────────────────────────────────
// Public API (unauthenticated): max 60 requests / minute per IP
const publicLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
  },
  skip: () => env.NODE_ENV === 'test', // Không giới hạn khi chạy test
});

// Auth endpoint: max 10 login attempts / minute per IP (chống brute-force)
const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Quá nhiều lần đăng nhập. Vui lòng thử lại sau 1 phút.' },
  },
  skip: () => env.NODE_ENV === 'test',
});

// Internal API (authenticated): max 200 requests / minute per IP
const internalLimiter = rateLimit({
  windowMs: 60_000,
  max: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/api/public',   publicLimiter,   publicRouter);
app.use('/api/auth',     authLimiter,     authRouter);
app.use('/api/internal', internalLimiter, internalRouter);

// ─── Static files (uploaded images) — ONLY in development ────────────────────
// In production, images are served from Supabase Storage (CDN)
if (env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
} else {
  // In production: if someone hits /uploads, redirect to the storage CDN
  app.use('/uploads', (_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ảnh được lưu trên cloud storage' } });
  });
}

// 404
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route không tồn tại' } });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export { app };
