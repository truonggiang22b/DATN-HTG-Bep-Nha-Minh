import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_BASE_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  // DIRECT_URL dùng cho Prisma migrate (kết nối trực tiếp, không qua pooler)
  // Bắt buộc có trong production để `prisma migrate deploy` chạy đúng
  DIRECT_URL: z.string().min(1),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(1),
  // Optional — if set (or NODE_ENV=production), uploads go to Supabase Storage
  SUPABASE_STORAGE_BUCKET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:\n', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
