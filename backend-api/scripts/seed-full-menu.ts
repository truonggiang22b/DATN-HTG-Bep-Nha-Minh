/**
 * seed-full-menu.ts
 * Seeds toàn bộ menu demo cho Bếp Nhà Mình
 * Chạy: npx tsx scripts/seed-full-menu.ts
 */
import { PrismaClient, CategoryStatus, MenuItemStatus } from '@prisma/client';
import { config } from 'dotenv';

config();

const p = new PrismaClient();
const BRANCH_ID = 'branch-bep-nha-minh-q1';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertCat(id: string, name: string, sortOrder: number) {
  return p.category.upsert({
    where: { id },
    update: {},
    create: { id, branchId: BRANCH_ID, name, sortOrder, status: CategoryStatus.ACTIVE },
  });
}

type OptionDef = { name: string; priceAdj: number };
type GroupDef  = { groupName: string; required: boolean; multi?: boolean; opts: OptionDef[] };

async function seedItem(
  id: string,
  categoryId: string,
  name: string,
  price: number,
  sortOrder: number,
  description?: string,
  groups?: GroupDef[]
) {
  const item = await p.menuItem.upsert({
    where: { id },
    update: {},
    create: {
      id,
      categoryId,
      name,
      price,
      shortDescription: description ?? null,
      status: MenuItemStatus.ACTIVE,
      sortOrder,
    },
  });

  if (groups) {
    for (let gi = 0; gi < groups.length; gi++) {
      const g = groups[gi];
      const gid = `og-${id}-${gi}`;
      const group = await p.menuOptionGroup.upsert({
        where: { id: gid },
        update: {},
        create: {
          id: gid,
          menuItemId: item.id,
          name: g.groupName,
          isRequired: g.required,
          minSelect: g.required ? 1 : 0,
          maxSelect: g.multi ? 3 : 1,
        },
      });
      for (let oi = 0; oi < g.opts.length; oi++) {
        const opt = g.opts[oi];
        const optId = `op-${gid}-${oi}`;
        await p.menuOption.upsert({
          where: { id: optId },
          update: {},
          create: {
            id: optId,
            optionGroupId: group.id,
            name: opt.name,
            priceDelta: opt.priceAdj,
            sortOrder: oi,
          },
        });
      }
    }
  }
  return item;
}

// ─── Size helpers ──────────────────────────────────────────────────────────────

const sz = (a: string, b: string, diff: number): GroupDef => ({
  groupName: 'Size', required: false,
  opts: [{ name: a, priceAdj: 0 }, { name: b, priceAdj: diff }],
});

const szVL = (a: number, b: number): GroupDef => sz(`Vừa (${a}k)`, `Lớn (${b}k)`, (b - a) * 1000);
const szML = (a: number, b: number): GroupDef => sz(`M (${a}k)`, `L (${b}k)`, (b - a) * 1000);
const szNL = (a: number, b: number): GroupDef => sz(`Nhỏ (${a}k)`, `Lớn (${b}k)`, (b - a) * 1000);

const topping5k: GroupDef = {
  groupName: 'Thêm topping', required: false,
  opts: [{ name: 'Thêm topping (+5k)', priceAdj: 5000 }],
};

const trungNuong: GroupDef = {
  groupName: 'Topping', required: false,
  opts: [{ name: 'Thêm trứng nướng (+5k)', priceAdj: 5000 }],
};

const pizzaSize: GroupDef = {
  groupName: 'Size', required: true,
  opts: [
    { name: 'S — 20cm (89k)', priceAdj: 0 },
    { name: 'M — 25cm (119k)', priceAdj: 30000 },
    { name: 'L — 30cm (159k)', priceAdj: 70000 },
  ],
};

const pizzaSizeSeafood: GroupDef = {
  groupName: 'Size', required: true,
  opts: [
    { name: 'S — 20cm (109k)', priceAdj: 0 },
    { name: 'M — 25cm (139k)', priceAdj: 30000 },
    { name: 'L — 30cm (179k)', priceAdj: 70000 },
  ],
};

const extraCheese: GroupDef = {
  groupName: 'Thêm phô mai', required: false,
  opts: [
    { name: 'Ít phô mai (+30k)', priceAdj: 30000 },
    { name: 'Nhiều phô mai (+50k)', priceAdj: 50000 },
    { name: 'Rất nhiều phô mai (+80k)', priceAdj: 80000 },
  ],
};

const sotGa: GroupDef = {
  groupName: 'Cách chế biến', required: true,
  opts: [
    { name: 'Chiên giòn', priceAdj: 0 },
    { name: 'Sốt kem (+10k)', priceAdj: 10000 },
    { name: 'Sốt cay Hàn Quốc (+10k)', priceAdj: 10000 },
    { name: 'Sốt cay ngọt (+10k)', priceAdj: 10000 },
    { name: 'Sốt mật ong (+10k)', priceAdj: 10000 },
    { name: 'Sốt phô mai (+10k)', priceAdj: 10000 },
  ],
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding full demo menu...\n');

  // ── Categories
  const C = {
    vat:       await upsertCat('cat-do-an-vat',  '🍟 Đồ Ăn Vặt',        1),
    nuoc:      await upsertCat('cat-nuoc-uong',  '🥤 Nước Uống',         2),
    tra:       await upsertCat('cat-tra',        '🍵 Trà',               3),
    traSua:    await upsertCat('cat-tra-sua',    '🧋 Trà Sữa',           4),
    matcha:    await upsertCat('cat-matcha',     '☕ Matcha',             5),
    doAn:      await upsertCat('cat-do-an',      '🍽️ Đồ Ăn',            6),
    han:       await upsertCat('cat-do-han',     '🇰🇷 Đồ Hàn',           7),
    ga:        await upsertCat('cat-mon-ga',     '🍗 Món Gà',            8),
    pizza:     await upsertCat('cat-pizza',      '🍕 Pizza',             9),
    spaghetti: await upsertCat('cat-spaghetti',  '🍝 Spaghetti',        10),
    comTam:    await upsertCat('cat-com-tam',    '🍚 Cơm Tấm',          11),
    lasagna:   await upsertCat('cat-lasagna',    '🧀 Lasagna',          12),
    penne:     await upsertCat('cat-penne',      '🍝 Penne (Mì ống)',   13),
    gaBoLo:    await upsertCat('cat-ga-bo-lo',   '🍗 Gà Bỏ Lò',        14),
  };
  console.log(`✅ ${Object.keys(C).length} danh mục sẵn sàng`);

  // ── 🍟 Đồ Ăn Vặt
  await seedItem('mi-nem-chua-tcc',    C.vat.id, 'Nem chua Trần Công Châu',  30000, 1, undefined, [szNL(30, 60)]);
  await seedItem('mi-nem-chua-pmai',   C.vat.id, 'Nem chua phô mai',         45000, 2, undefined, [szNL(45, 90)]);
  await seedItem('mi-khoai-chien',     C.vat.id, 'Khoai tây chiên',          30000, 3);
  await seedItem('mi-khoai-lac',       C.vat.id, 'Khoai tây lắc phô mai',    35000, 4);
  await seedItem('mi-xuc-xich',        C.vat.id, 'Xúc xích',                 30000, 5);
  await seedItem('mi-ca-vien',         C.vat.id, 'Cá viên chiên',            30000, 6);
  await seedItem('mi-khoai-lang-ken',  C.vat.id, 'Khoai lang kén',           30000, 7);

  // ── 🥤 Nước Uống
  await seedItem('mi-nuoc-me',         C.nuoc.id, 'Nước me đá',              20000, 1);
  await seedItem('mi-chanh-leo-dua',   C.nuoc.id, 'Chanh leo mix dứa',       20000, 2);
  await seedItem('mi-nuoc-cam',        C.nuoc.id, 'Nước cam vắt',            25000, 3, undefined, [szNL(25, 35)]);
  await seedItem('mi-ep-dua',          C.nuoc.id, 'Nước ép dứa',             25000, 4, undefined, [szNL(25, 35)]);
  await seedItem('mi-ep-dua-hau',      C.nuoc.id, 'Nước ép dưa hấu',         25000, 5, undefined, [szNL(25, 35)]);
  await seedItem('mi-coca-pepsi',      C.nuoc.id, 'Coca/Pepsi',              15000, 6);
  await seedItem('mi-c2',              C.nuoc.id, 'C2',                      10000, 7);
  await seedItem('mi-bo-huc',          C.nuoc.id, 'Bò húc',                  15000, 8);

  // ── 🍵 Trà
  await seedItem('mi-tra-quat-nd',     C.tra.id, 'Trà quất nha đam',         20000, 1, 'Full topping', [topping5k]);
  await seedItem('mi-tra-quat-ls',     C.tra.id, 'Trà quất nha đam lắc sữa', 25000, 2, 'Full topping', [topping5k]);
  await seedItem('mi-tra-quat-mo',     C.tra.id, 'Trà quất mật ong',         25000, 3, 'Full topping', [topping5k]);
  await seedItem('mi-tra-chanh-nd',    C.tra.id, 'Trà chanh nha đam',        20000, 4, 'Full topping', [topping5k]);
  await seedItem('mi-tra-mang-cau',    C.tra.id, 'Trà mãng cầu',             25000, 5, undefined,      [szVL(25, 30), topping5k]);
  await seedItem('mi-tra-hoa-qua',     C.tra.id, 'Trà hoa quả nhiệt đới',    20000, 6, undefined,      [szVL(20, 25), topping5k]);
  await seedItem('mi-tra-xoai-cl',     C.tra.id, 'Trà xoài chanh leo',       25000, 7, undefined,      [szVL(25, 30), topping5k]);
  await seedItem('mi-tra-dua-luoi',    C.tra.id, 'Trà dưa lưới',             25000, 8, undefined,      [szVL(25, 30), topping5k]);
  await seedItem('mi-tra-dl-kem',      C.tra.id, 'Trà dưa lưới kem cheese',  30000, 9, undefined,      [szVL(30, 35), topping5k]);
  await seedItem('mi-tra-dao-cam',     C.tra.id, 'Trà đào cam sả',           25000, 10, undefined,     [szVL(25, 30), topping5k]);

  // ── 🧋 Trà Sữa
  await seedItem('mi-ts-oolong',       C.traSua.id, 'Ô long sen vàng',                    30000, 1, undefined, [szML(30, 40), trungNuong]);
  await seedItem('mi-ts-kieu-sen',     C.traSua.id, 'Kiều mạch sen nướng',                30000, 2, undefined, [szML(30, 40), trungNuong]);
  await seedItem('mi-ts-sua-dd',       C.traSua.id, 'Sữa tươi đường đen',                 30000, 3, undefined, [szML(30, 35), trungNuong]);
  await seedItem('mi-ts-sua-trung',    C.traSua.id, 'Sữa tươi đường đen trứng nướng',     35000, 4, undefined, [szML(35, 40)]);
  await seedItem('mi-ts-kieu-sua',     C.traSua.id, 'Kiều mạch sữa',                      30000, 5, undefined, [szML(30, 40), trungNuong]);
  await seedItem('mi-ts-khoai-mon',    C.traSua.id, 'Kiều mạch sữa khoai môn',            35000, 6, undefined, [szML(35, 45), trungNuong]);
  await seedItem('mi-ts-bac-ha',       C.traSua.id, 'Kiều mạch sữa bạc hà',              35000, 7, undefined, [szML(35, 45), trungNuong]);
  await seedItem('mi-ts-matcha',       C.traSua.id, 'Kiều mạch sữa matcha',               35000, 8, undefined, [szML(35, 45), trungNuong]);

  // ── ☕ Matcha
  await seedItem('mi-matcha-latte',    C.matcha.id, 'Matcha latte',          30000, 1, undefined, [szML(30, 35)]);
  await seedItem('mi-matcha-xoai',     C.matcha.id, 'Matcha latte xoài',     35000, 2, undefined, [szML(35, 40)]);
  await seedItem('mi-matcha-caramel',  C.matcha.id, 'Matcha latte caramel',  35000, 3, undefined, [szML(35, 40)]);

  // ── 🍽️ Đồ Ăn
  await seedItem('mi-xoi-ga',          C.doAn.id, 'Xôi gà cay / Xôi sườn cay', 45000, 1);
  await seedItem('mi-banh-mi-chao',    C.doAn.id, 'Bánh mì chảo',               45000, 2);
  await seedItem('mi-bo-bit-tet',      C.doAn.id, 'Bò bít tết',                 70000, 3);
  await seedItem('mi-salad-ga',        C.doAn.id, 'Salad gà',                   30000, 4);
  await seedItem('mi-salad-ca-ngu',    C.doAn.id, 'Salad cá ngừ',               40000, 5);

  // ── 🇰🇷 Đồ Hàn
  await seedItem('mi-kimbap',          C.han.id, 'Kimbap thường',                35000, 1);
  await seedItem('mi-kimbap-chien',    C.han.id, 'Kimbap chiên',                 45000, 2);
  await seedItem('mi-banh-gao-lac',    C.han.id, 'Bánh gạo chiên lắc phô mai',   35000, 3);
  await seedItem('mi-tokbokki-tt',     C.han.id, 'Tokbokki truyền thống',        35000, 4);
  await seedItem('mi-tokbokki-pmai',   C.han.id, 'Tokbokki phô mai',             45000, 5);

  // ── 🍗 Món Gà
  await seedItem('mi-ga-dui-canh',     C.ga.id, 'Đùi/Cánh/Má chiên giòn hoặc sốt', 35000, 1,
    'Chọn cách chế biến: chiên giòn (35k) hoặc có sốt (45k)', [sotGa]);
  await seedItem('mi-ga-popcorn',      C.ga.id, 'Gà popcorn', 50000, 2,
    'Chiên giòn (50k) hoặc sốt (60k)',
    [{ groupName: 'Loại', required: true, opts: [{ name: 'Chiên giòn (50k)', priceAdj: 0 }, { name: 'Có sốt (60k)', priceAdj: 10000 }] }]);

  // ── 🍕 Pizza
  await seedItem('mi-pizza-hawaii',    C.pizza.id, 'Pizza Hawaii',       89000, 1, 'Dứa, Jambong, Phô mai', [pizzaSize, extraCheese]);
  await seedItem('mi-pizza-meat',      C.pizza.id, 'Pizza Meat Love',    89000, 2, 'Bò băm, Jambong, Cà chua, Hành tây, Phô mai', [pizzaSize, extraCheese]);
  await seedItem('mi-pizza-seafood',   C.pizza.id, 'Pizza Seafood',     109000, 3, 'Mực, Tôm, Thanh cua, Nấm, Phô mai', [pizzaSizeSeafood, extraCheese]);
  await seedItem('mi-pizza-cheese',    C.pizza.id, 'Pizza Cheese',       89000, 4, 'Mozzarella, Cheese Das, Parmesan', [pizzaSize, extraCheese]);
  await seedItem('mi-pizza-tuna',      C.pizza.id, 'Pizza Tuna',         89000, 5, 'Cá ngừ, Cà chua, Hành tây, Ngô, Phô mai', [pizzaSize, extraCheese]);
  await seedItem('mi-pizza-chicken',   C.pizza.id, 'Pizza Chicken BBQ',  89000, 6, 'Gà, Hành tây, Ớt xanh đỏ, Phô mai', [pizzaSize, extraCheese]);
  await seedItem('mi-pizza-salami',    C.pizza.id, 'Pizza Danish Salami',89000, 7, 'Xúc xích, Phô mai', [pizzaSize, extraCheese]);

  // ── 🍝 Spaghetti
  await seedItem('mi-spa-bolognese',   C.spaghetti.id, 'Spaghetti Bolognese',  55000, 1, undefined,
    [{ groupName: 'Thêm phô mai', required: false, opts: [{ name: 'Thêm phô mai (+10k)', priceAdj: 10000 }] }]);
  await seedItem('mi-spa-chicken',     C.spaghetti.id, 'Spaghetti Chicken',    70000, 2);
  await seedItem('mi-spa-carbonara',   C.spaghetti.id, 'Spaghetti Carbonara',  80000, 3);

  // ── 🍚 Cơm Tấm
  await seedItem('mi-com-suon-bi',     C.comTam.id, 'Cơm tấm sườn bì',        45000, 1);
  await seedItem('mi-com-suon-trung',  C.comTam.id, 'Cơm tấm sườn trứng',     45000, 2);
  await seedItem('mi-com-suon-cha-t',  C.comTam.id, 'Cơm tấm sườn chả trứng', 45000, 3);
  await seedItem('mi-com-suon-bi-c',   C.comTam.id, 'Cơm tấm sườn bì chả',    50000, 4);
  await seedItem('mi-com-dac-biet',    C.comTam.id, 'Cơm tấm đặc biệt',       55000, 5);

  // ── 🧀 Lasagna
  await seedItem('mi-lasagna-beef',    C.lasagna.id, 'Lasagna beef',           120000, 1);
  await seedItem('mi-mi-ong-bo',       C.lasagna.id, 'Mì ống bò lò phô mai',  130000, 2);

  // ── 🍝 Penne
  await seedItem('mi-penne-bolognese', C.penne.id, 'Bolognese Penne',          75000, 1);
  await seedItem('mi-penne-chicken',   C.penne.id, 'Cream Chicken & Mushroom Penne', 80000, 2);
  await seedItem('mi-penne-ham',       C.penne.id, 'Cream Ham Penne',          90000, 3);

  // ── 🍗 Gà Bỏ Lò
  await seedItem('mi-ga-cay-lo',       C.gaBoLo.id, 'Gà cay bỏ lò phô mai',   119000, 1);
  await seedItem('mi-sun-ga-lo',       C.gaBoLo.id, 'Sụn gà cay bỏ lò phô mai', 125000, 2);

  // ── Summary
  const totalCat   = await p.category.count({ where: { branchId: BRANCH_ID } });
  const totalItems = await p.menuItem.count();
  const totalOG    = await p.menuOptionGroup.count();
  const totalOpts  = await p.menuOption.count();

  console.log('\n🎉 Seed hoàn tất!');
  console.log('─────────────────────────────────────');
  console.log(`  Danh mục    : ${totalCat}`);
  console.log(`  Món ăn      : ${totalItems}`);
  console.log(`  Option groups: ${totalOG}`);
  console.log(`  Options      : ${totalOpts}`);
  console.log('─────────────────────────────────────');
  console.log('\n  Test tại: https://datn-htg-bep-nha-minh.vercel.app/qr/qr-bnm-table-01');
}

main()
  .catch(err => { console.error('\n❌ Lỗi:', err.message); process.exit(1); })
  .finally(() => p.$disconnect());
