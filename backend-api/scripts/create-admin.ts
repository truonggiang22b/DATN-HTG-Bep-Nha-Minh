/**
 * create-admin.ts
 * Script tạo tài khoản admin mới qua Supabase Admin API + Prisma
 * Chạy: npx tsx scripts/create-admin.ts
 */
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const SUPABASE_URL = 'https://umufftukrejijatimotz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtdWZmdHVrcmVqaWphdGltb3R6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ4MzI4MCwiZXhwIjoyMDkyMDU5MjgwfQ.PigaVreJS0uIVHyyn8HB8lKd23f9pOEWYnBeynZdCn8';

// ─── Thông tin tài khoản cần tạo ──────────────────────────────────────────────
const NEW_USER = {
  email: 'giaovien@bepnhaminh.vn',
  password: 'GiaoVien@2026',
  displayName: 'Giáo Viên Demo',
  role: 'ADMIN' as const,
  storeId: 'store-bep-nha-minh',
  branchId: 'branch-bep-nha-minh-q1',
};
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const prisma = new PrismaClient();

async function main() {
  console.log(`\n🔧 Tạo tài khoản mới: ${NEW_USER.email}`);

  // 1. Kiểm tra user đã tồn tại chưa
  const { data: existing } = await supabase.auth.admin.listUsers();
  const existingUser = existing?.users.find(u => u.email === NEW_USER.email);

  let userId: string;

  if (existingUser) {
    console.log(`  ℹ️  User đã tồn tại trong Supabase Auth: ${existingUser.id}`);
    userId = existingUser.id;
  } else {
    // 2. Tạo user trong Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: NEW_USER.email,
      password: NEW_USER.password,
      email_confirm: true, // Bỏ qua bước verify email
    });

    if (error || !data.user) {
      throw new Error(`Supabase Auth lỗi: ${error?.message}`);
    }

    userId = data.user.id;
    console.log(`  ✅ Tạo Supabase Auth user: ${userId}`);
  }

  // 3. Tạo bản ghi User trong DB
  const dbUser = await prisma.user.upsert({
    where: { supabaseAuthUserId: userId },
    update: { displayName: NEW_USER.displayName },
    create: {
      supabaseAuthUserId: userId,
      email: NEW_USER.email,
      displayName: NEW_USER.displayName,
      storeId: NEW_USER.storeId,
      defaultBranchId: NEW_USER.branchId,
      isActive: true,
    },
  });
  console.log(`  ✅ Tạo/cập nhật User record trong DB: ${dbUser.id}`);

  // 4. Gán role
  await prisma.userRole_Rel.upsert({
    where: { id: `role-${NEW_USER.role.toLowerCase()}-${dbUser.id}` },
    update: {},
    create: {
      id: `role-${NEW_USER.role.toLowerCase()}-${dbUser.id}`,
      userId: dbUser.id,
      role: NEW_USER.role,
      storeId: NEW_USER.storeId,
      branchId: NEW_USER.branchId,
    },
  });
  console.log(`  ✅ Gán role: ${NEW_USER.role}`);

  console.log('\n🎉 Hoàn tất!');
  console.log('─────────────────────────────────');
  console.log(`  Email   : ${NEW_USER.email}`);
  console.log(`  Password: ${NEW_USER.password}`);
  console.log(`  Role    : ${NEW_USER.role}`);
  console.log(`  Store   : ${NEW_USER.storeId}`);
  console.log('─────────────────────────────────');
  console.log(`  Login tại: https://datn-htg-bep-nha-minh.vercel.app/login`);
}

main()
  .catch(err => { console.error('❌ Lỗi:', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
