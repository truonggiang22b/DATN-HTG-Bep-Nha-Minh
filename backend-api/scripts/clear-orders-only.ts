/**
 * clear-orders-only.ts
 * Xóa toàn bộ đơn hàng cũ để giao diện sạch trước demo.
 * 
 * ✅ GIỮ LẠI: Store, Branch, User, DiningTable, MenuItem, Category
 * ❌ XÓA   : OrderStatusHistory, OrderItemOption, OrderItem, Order, TableSession
 *
 * Chạy: npx tsx scripts/clear-orders-only.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🧹 Đang xóa lịch sử đơn hàng cũ...\n');
  console.log('  ✅ GIỮ LẠI: Menu, Danh mục, Bàn/QR, User, Store');
  console.log('  ❌ XÓA   : Đơn hàng, Phiên bàn, Lịch sử trạng thái\n');

  // 1. OrderStatusHistory (FK → Order)
  const step1 = await prisma.orderStatusHistory.deleteMany({});
  console.log(`  [1/5] OrderStatusHistory : đã xóa ${step1.count} bản ghi`);

  // 2. OrderItemOption (FK → OrderItem) — chỉ chạy nếu model tồn tại
  try {
    // @ts-ignore — model này có thể chưa được generate
    const step2 = await (prisma as any).orderItemOption?.deleteMany({});
    if (step2) console.log(`  [2/5] OrderItemOption    : đã xóa ${step2.count} bản ghi`);
    else console.log(`  [2/5] OrderItemOption    : bỏ qua (không có model)`);
  } catch {
    console.log(`  [2/5] OrderItemOption    : bỏ qua`);
  }

  // 3. OrderItem (FK → Order)
  const step3 = await prisma.orderItem.deleteMany({});
  console.log(`  [3/6] OrderItem          : đã xóa ${step3.count} bản ghi`);

  // 4. DeliveryInfo (FK → Order, Phase 2)
  const step4 = await prisma.deliveryInfo.deleteMany({});
  console.log(`  [4/6] DeliveryInfo       : đã xóa ${step4.count} bản ghi`);

  // 5. Order
  const step5 = await prisma.order.deleteMany({});
  console.log(`  [5/6] Order              : đã xóa ${step5.count} bản ghi`);

  // 6. TableSession
  const step6 = await prisma.tableSession.deleteMany({});
  console.log(`  [6/6] TableSession       : đã xóa ${step6.count} bản ghi`);

  // ── Kiểm tra còn lại
  const menuCount     = await prisma.menuItem.count();
  const tableCount    = await prisma.diningTable.count();
  const orderRemain   = await prisma.order.count();

  console.log('\n✅ Xong! Giao diện đã sạch sẵn sàng demo.');
  console.log('──────────────────────────────────────────');
  console.log(`  MenuItem còn lại : ${menuCount}  (menu vẫn đầy đủ)`);
  console.log(`  Bàn/QR còn lại   : ${tableCount} (QR vẫn hoạt động)`);
  console.log(`  Order còn lại    : ${orderRemain} (phải = 0)`);
  console.log('──────────────────────────────────────────\n');
}

main()
  .catch(err => { console.error('\n❌ Lỗi:', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
