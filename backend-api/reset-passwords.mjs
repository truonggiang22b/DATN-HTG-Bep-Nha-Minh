import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const users = [
  { email: 'admin@bepnhaminh.vn',  id: 'e07f6f11-516b-490e-8557-b91b257f1c03', password: 'Admin@123456' },
  { email: 'bep@bepnhaminh.vn',    id: 'ac19d265-ce66-4f77-9af5-22688fce7821', password: 'Kitchen@123456' },
  { email: 'admin@commientry.vn',  id: 'ef36d2bd-c1f2-40fc-8d3f-35d4d9dbeb70', password: 'Admin@654321' },
  { email: 'giaovien@bepnhaminh.vn', id: '64ccee0b-4ce8-4818-8e9a-5f593c29d459', password: 'GiaoVien@123456' },
];

for (const u of users) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(u.id, { password: u.password });
  if (error) {
    console.error(`❌ Failed ${u.email}: ${error.message}`);
  } else {
    console.log(`✅ Reset password: ${u.email} → ${u.password}`);
  }
}
