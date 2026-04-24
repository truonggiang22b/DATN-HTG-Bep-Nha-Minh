/**
 * reset-demo-data.ts
 * Xóa toàn bộ data cũ (orders, menu, categories) để demo từ đầu.
 * GIỮ LẠI: Store, Branch, User, DiningTable (QR vẫn hoạt động)
 *
 * Chạy: npx tsx scripts/reset-demo-data.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🗑️  Bắt đầu reset demo data...\n');
  console.log('  ✅ GIỮ LẠI: Store, Branch, User, DiningTable (QR tokens)');
  console.log('  ❌ XÓA: Orders, TableSessions, MenuItems, Categories\n');

  // ── Bước 1: Xóa order history (phải xóa trước vì có FK)
  const deletedHistory = await prisma.orderStatusHistory.deleteMany({});
  console.log(`  [1/7] OrderStatusHistory: xóa ${deletedHistory.count} bản ghi`);

  // ── Bước 2: Xóa order items
  const deletedOrderItems = await prisma.orderItem.deleteMany({});
  console.log(`  [2/7] OrderItem        : xóa ${deletedOrderItems.count} bản ghi`);

  // ── Bước 3: Xóa orders
  const deletedOrders = await prisma.order.deleteMany({});
  console.log(`  [3/7] Order            : xóa ${deletedOrders.count} bản ghi`);

  // ── Bước 4: Xóa table sessions
  const deletedSessions = await prisma.tableSession.deleteMany({});
  console.log(`  [4/7] TableSession     : xóa ${deletedSessions.count} bản ghi`);

  // ── Bước 5: Xóa menu options
  const deletedOptions = await prisma.menuOption.deleteMany({});
  console.log(`  [5/7] MenuOption       : xóa ${deletedOptions.count} bản ghi`);

  // ── Bước 6: Xóa menu option groups
  const deletedOptionGroups = await prisma.menuOptionGroup.deleteMany({});
  console.log(`  [6/7] MenuOptionGroup  : xóa ${deletedOptionGroups.count} bản ghi`);

  // ── Bước 7: Xóa menu items
  const deletedItems = await prisma.menuItem.deleteMany({});
  console.log(`  [7/7] MenuItem         : xóa ${deletedItems.count} bản ghi`);

  // ── Bước 8: Xóa categories
  const deletedCats = await prisma.category.deleteMany({});
  console.log(`  [8/8] Category         : xóa ${deletedCats.count} bản ghi`);

  // ── Thống kê còn lại
  const storeCount = await prisma.store.count();
  const tableCount = await prisma.diningTable.count();
  const userCount = await prisma.user.count();

  console.log('\n✅ Reset hoàn tất!');
  console.log('─────────────────────────────────────────');
  console.log(`  Store còn lại  : ${storeCount}`);
  console.log(`  Bàn/QR còn lại : ${tableCount} (QR tokens vẫn hoạt động)`);
  console.log(`  User còn lại   : ${userCount}`);
  console.log('─────────────────────────────────────────');
  console.log('\n📋 Bước tiếp theo:');
  console.log('  1. Vào https://datn-htg-bep-nha-minh.vercel.app/login');
  console.log('  2. Đăng nhập admin@bepnhaminh.vn / Admin@123456');
  console.log('  3. Vào /admin/menu → tạo danh mục và món mới');
  console.log('  4. Vào /qr/qr-bnm-table-01 để test QR vẫn hoạt động\n');
}

main()
  .catch(err => { console.error('\n❌ Lỗi:', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
