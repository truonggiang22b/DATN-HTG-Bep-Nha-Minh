/**
 * supabaseStorage.ts
 * Upload helper sử dụng Supabase Storage.
 *
 * Bucket cần được tạo trước trên Supabase Dashboard:
 *   Storage → New bucket → "menu-images" → Public ✓
 *
 * Env var:
 *   SUPABASE_STORAGE_BUCKET (optional, default: "menu-images")
 */
import { supabaseAdmin } from './supabase';

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'menu-images';

export interface StorageUploadResult {
  url:      string;
  path:     string;
  bucket:   string;
}

/**
 * Upload buffer lên Supabase Storage.
 * Tự động sinh tên file duy nhất: <timestamp>-<randomhex>.<ext>
 */
export async function uploadToStorage(
  buffer:   Buffer,
  ext:      string, // e.g. ".jpg"
  mimetype: string,
): Promise<StorageUploadResult> {
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  const filePath = filename; // top-level trong bucket

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      contentType:    mimetype,
      cacheControl:   '31536000', // 1 year — ảnh menu không thay đổi thường xuyên
      upsert:         false,
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  // Public URL — không cần signed URL vì bucket là public
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath);

  return {
    url:    data.publicUrl,
    path:   filePath,
    bucket: BUCKET,
  };
}
