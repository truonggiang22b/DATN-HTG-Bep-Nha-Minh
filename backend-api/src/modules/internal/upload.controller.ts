/**
 * upload.controller.ts
 *
 * POST /api/internal/upload
 *
 * Strategy:
 *   - Production  → Supabase Storage (CDN, persistent)
 *   - Development → local disk at /uploads/menu-images/ (fallback)
 *
 * Switch: nếu SUPABASE_STORAGE_BUCKET env được set (hoặc NODE_ENV=production)
 *         thì dùng Supabase Storage; ngược lại dùng disk.
 *
 * Frontend nhận lại: { url, filename, size, mimetype }
 * `url` luôn là URL có thể dùng trực tiếp làm imageUrl cho MenuItem.
 */
import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { success } from '../../utils/apiResponse';
import { AppError } from '../../utils/errors';
import { uploadToStorage } from '../../lib/supabaseStorage';
import { env } from '../../config/env';

// ── Shared config ─────────────────────────────────────────────────────────────
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận ảnh JPG, PNG, WEBP, GIF'));
  }
};

// ── Determine storage strategy ────────────────────────────────────────────────
const USE_CLOUD_STORAGE =
  env.NODE_ENV === 'production' || !!process.env.SUPABASE_STORAGE_BUCKET;

// ── Multer config (memory storage in production for cloud upload) ──────────────
let multerStorage: multer.StorageEngine;

if (USE_CLOUD_STORAGE) {
  // Use memory storage — buffer is then uploaded to Supabase Storage
  multerStorage = multer.memoryStorage();
} else {
  // Dev fallback: disk storage
  const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'menu-images');
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  multerStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename:    (_req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase() || '.jpg';
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
      cb(null, name);
    },
  });
}

export const upload = multer({
  storage: multerStorage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES, files: 1 },
});

// ── Controller ────────────────────────────────────────────────────────────────
export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw AppError.badRequest('NO_FILE', 'Không có file nào được gửi lên');
    }

    const ext      = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    const mimetype = req.file.mimetype;
    const size     = req.file.size;

    let url: string;
    let filename: string;

    if (USE_CLOUD_STORAGE) {
      // ── Cloud path (production) ──────────────────────────────────────────────
      if (!req.file.buffer) {
        throw AppError.internal('Upload buffer không tồn tại');
      }
      const result = await uploadToStorage(req.file.buffer, ext, mimetype);
      url      = result.url;
      filename = result.path;
    } else {
      // ── Disk path (development) ──────────────────────────────────────────────
      const protocol = req.protocol;
      const host     = req.get('host') ?? 'localhost:3001';
      filename = req.file.filename!;
      url      = `${protocol}://${host}/uploads/menu-images/${filename}`;
    }

    return success(res, { url, filename, size, mimetype }, 201);
  } catch (err) {
    next(err);
  }
}
