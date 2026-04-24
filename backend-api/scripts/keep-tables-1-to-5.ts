/**
 * keep-tables-1-to-5.ts
 * Xóa tất cả bàn ngoại trừ Bàn 01-05 (ID: tbl-01 đến tbl-05)
 */
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const p = new PrismaClient();

async function main() {
  const keepIds = ['tbl-01', 'tbl-02', 'tbl-03', 'tbl-04', 'tbl-05'];

  // Xem trước có bao nhiêu bàn sẽ bị xóa
  const toDelete = await p.diningTable.findMany({
    where: { id: { notIn: keepIds } },
    select: { id: true, displayName: true }
  });
  console.log(`\nSẽ xóa ${toDelete.length} bàn:`);
  toDelete.forEach(t => console.log('  -', t.displayName, `(${t.id})`));

  // Thực hiện xóa
  const result = await p.diningTable.deleteMany({
    where: { id: { notIn: keepIds } }
  });
  console.log(`\n✅ Đã xóa ${result.count} bàn`);

  // Hiển thị các bàn còn lại
  const remaining = await p.diningTable.findMany({
    select: { id: true, displayName: true, qrToken: true, status: true },
    orderBy: { tableCode: 'asc' }
  });
  console.log('\nBàn còn lại:');
  remaining.forEach(t => console.log(`  - ${t.displayName} | QR: ${t.qrToken} | ${t.status}`));
}

main()
  .catch(err => { console.error('❌', err.message); process.exit(1); })
  .finally(() => p.$disconnect());
