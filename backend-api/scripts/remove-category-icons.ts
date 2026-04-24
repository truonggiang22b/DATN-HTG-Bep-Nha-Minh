/**
 * remove-category-icons.ts
 * Xóa icon emoji ở đầu tên danh mục
 */
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
config();

const p = new PrismaClient();

async function main() {
  const nameMap: Record<string, string> = {
    'cat-do-an-vat': 'Đồ Ăn Vặt',
    'cat-nuoc-uong': 'Nước Uống',
    'cat-tra':       'Trà',
    'cat-tra-sua':   'Trà Sữa',
    'cat-matcha':    'Matcha',
    'cat-do-an':     'Đồ Ăn',
    'cat-do-han':    'Đồ Hàn',
    'cat-mon-ga':    'Món Gà',
    'cat-pizza':     'Pizza',
    'cat-spaghetti': 'Spaghetti',
    'cat-com-tam':   'Cơm Tấm',
    'cat-lasagna':   'Lasagna',
    'cat-penne':     'Penne (Mì ống)',
    'cat-ga-bo-lo':  'Gà Bỏ Lò',
  };

  for (const [id, name] of Object.entries(nameMap)) {
    await p.category.updateMany({ where: { id }, data: { name } });
    console.log(`  ✅ ${name}`);
  }

  console.log('\n🎉 Xong! Tên danh mục đã được cập nhật.');
}

main()
  .catch(err => { console.error('❌', err.message); process.exit(1); })
  .finally(() => p.$disconnect());
