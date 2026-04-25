/**
 * Seed script — Bếp Nhà Mình
 * Creates 2 stores with branches, tables, categories, menu items, and internal users
 *
 * Run: npm run db:seed
 */

import { PrismaClient, MenuItemStatus, CategoryStatus, TableStatus, UserRole } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { randomUUID } from 'crypto';

config();

const prisma = new PrismaClient();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── Helper ───────────────────────────────────────────────────────────────────

async function createAuthUser(email: string, password: string) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    if (error.message.includes('already been registered')) {
      console.log(`  Auth user already exists: ${email}`);
      const { data: list } = await supabaseAdmin.auth.admin.listUsers();
      const existing = list?.users?.find((u) => u.email === email);
      return existing?.id ?? randomUUID();
    }
    throw new Error(`Failed to create auth user ${email}: ${error.message}`);
  }
  return data.user.id;
}

// ─── Main seed ────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting seed...\n');

  // ── Store 1: Bếp Nhà Mình (primary demo store) ────────────────────────────
  console.log('Creating Store 1: Bếp Nhà Mình...');
  const store1 = await prisma.store.upsert({
    where: { id: 'store-bep-nha-minh' },
    update: {},
    create: {
      id: 'store-bep-nha-minh',
      name: 'Bếp Nhà Mình',
      timezone: 'Asia/Ho_Chi_Minh',
    },
  });

  const branch1 = await prisma.branch.upsert({
    where: { id: 'branch-bep-nha-minh-q1' },
    update: {},
    create: {
      id: 'branch-bep-nha-minh-q1',
      storeId: store1.id,
      name: 'Bếp Nhà Mình — Quận 1',
      address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      isActive: true,
    },
  });

  // Tables for branch1
  const tables1 = [
    { id: 'tbl-01', tableCode: 'table-01', displayName: 'Bàn 01', qrToken: 'qr-bnm-table-01' },
    { id: 'tbl-02', tableCode: 'table-02', displayName: 'Bàn 02', qrToken: 'qr-bnm-table-02' },
    { id: 'tbl-03', tableCode: 'table-03', displayName: 'Bàn 03', qrToken: 'qr-bnm-table-03' },
    { id: 'tbl-04', tableCode: 'table-04', displayName: 'Bàn 04', qrToken: 'qr-bnm-table-04' },
    { id: 'tbl-05', tableCode: 'table-05', displayName: 'Bàn 05', qrToken: 'qr-bnm-table-05' },
  ];

  for (const t of tables1) {
    await prisma.diningTable.upsert({
      where: { id: t.id },
      update: {},
      create: { ...t, branchId: branch1.id, status: TableStatus.ACTIVE },
    });
  }
  console.log(`  ✓ ${tables1.length} tables`);

  // Categories for branch1
  const cats1 = [
    { id: 'cat-bnm-main',    name: 'Món chính',   sortOrder: 1, status: CategoryStatus.ACTIVE },
    { id: 'cat-bnm-light',   name: 'Món nhẹ',     sortOrder: 2, status: CategoryStatus.ACTIVE },
    { id: 'cat-bnm-drink',   name: 'Đồ uống',     sortOrder: 3, status: CategoryStatus.ACTIVE },
    { id: 'cat-bnm-dessert', name: 'Tráng miệng', sortOrder: 4, status: CategoryStatus.ACTIVE },
    { id: 'cat-bnm-combo',   name: 'Combo',        sortOrder: 5, status: CategoryStatus.ACTIVE },
  ];
  for (const c of cats1) {
    await prisma.category.upsert({
      where: { id: c.id },
      update: {},
      create: { ...c, branchId: branch1.id },
    });
  }
  console.log(`  ✓ ${cats1.length} categories`);

  // Menu items for branch1
  const items1 = [
    // Món chính
    {
      id: 'item-bun-bo', categoryId: 'cat-bnm-main', name: 'Bún bò đặc biệt',
      price: 65000, status: MenuItemStatus.ACTIVE, sortOrder: 1,
      shortDescription: 'Bún bò Huế đậm đà, thịt bò tươi, chả lụa thơm, sả ớt',
      tagsJson: ['bestseller'],
      imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&q=80',
      optionGroups: [
        {
          id: 'og-bunbo-size', name: 'Kích cỡ', isRequired: true, minSelect: 1, maxSelect: 1, sortOrder: 1,
          options: [
            { id: 'opt-bunbo-s', name: 'Vừa', priceDelta: 0, sortOrder: 1 },
            { id: 'opt-bunbo-l', name: 'Lớn', priceDelta: 10000, sortOrder: 2 },
          ],
        },
        {
          id: 'og-bunbo-spicy', name: 'Độ cay', isRequired: false, minSelect: 0, maxSelect: 1, sortOrder: 2,
          options: [
            { id: 'opt-bunbo-nokay', name: 'Không cay', priceDelta: 0, sortOrder: 1 },
            { id: 'opt-bunbo-med',   name: 'Vừa cay',   priceDelta: 0, sortOrder: 2 },
            { id: 'opt-bunbo-hot',   name: 'Cay nhiều',  priceDelta: 0, sortOrder: 3 },
          ],
        },
      ],
    },
    {
      id: 'item-com-ga', categoryId: 'cat-bnm-main', name: 'Cơm gà xối mỡ',
      price: 59000, status: MenuItemStatus.ACTIVE, sortOrder: 2,
      shortDescription: 'Cơm trắng mềm, gà xối mỡ giòn vàng, nước mắm gừng',
      tagsJson: [], imageUrl: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80',
      optionGroups: [],
    },
    {
      id: 'item-pho-bo', categoryId: 'cat-bnm-main', name: 'Phở bò tái chín',
      price: 55000, status: MenuItemStatus.ACTIVE, sortOrder: 3,
      shortDescription: 'Nước dùng hầm xương 8 tiếng, thịt bò tươi tái chín',
      tagsJson: [],imageUrl: 'https://images.unsplash.com/photo-1600628421055-4d30de868b8f?w=400&q=80',
      optionGroups: [
        {
          id: 'og-pho-size', name: 'Kích cỡ', isRequired: true, minSelect: 1, maxSelect: 1, sortOrder: 1,
          options: [
            { id: 'opt-pho-s', name: 'Vừa', priceDelta: 0, sortOrder: 1 },
            { id: 'opt-pho-l', name: 'Lớn', priceDelta: 10000, sortOrder: 2 },
          ],
        },
      ],
    },
    {
      id: 'item-com-tam', categoryId: 'cat-bnm-main', name: 'Cơm tấm sườn nướng',
      price: 55000, status: MenuItemStatus.ACTIVE, sortOrder: 4,
      shortDescription: 'Sườn non nướng than hoa, cơm tấm, đồ chua, nước mắm pha',
      tagsJson: ['popular'], imageUrl: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80',
      optionGroups: [],
    },
    {
      id: 'item-bun-cha', categoryId: 'cat-bnm-main', name: 'Bún chả Hà Nội',
      price: 60000, status: MenuItemStatus.SOLD_OUT, sortOrder: 5,
      shortDescription: 'Chả cá viên thơm lừng, bún gạo tươi, nước chấm pha đặc biệt',
      tagsJson: [], imageUrl: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&q=80',
      optionGroups: [],
    },
    // Món nhẹ
    {
      id: 'item-goi-cuon', categoryId: 'cat-bnm-light', name: 'Gỏi cuốn tôm thịt',
      price: 35000, status: MenuItemStatus.ACTIVE, sortOrder: 1,
      shortDescription: 'Bánh tráng mềm, tôm tươi, thịt ba chỉ, rau thơm, bún',
      tagsJson: ['healthy'], imageUrl: 'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=400&q=80',
      optionGroups: [],
    },
    {
      id: 'item-cha-gio', categoryId: 'cat-bnm-light', name: 'Chả giò Sài Gòn',
      price: 30000, status: MenuItemStatus.ACTIVE, sortOrder: 2,
      shortDescription: '5 cái chả giò giòn tan, nhân thịt nấm cà rốt',
      tagsJson: ['popular'], imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80',
      optionGroups: [],
    },
    // Đồ uống
    {
      id: 'item-tra-dao', categoryId: 'cat-bnm-drink', name: 'Trà đào cam sả',
      price: 35000, status: MenuItemStatus.ACTIVE, sortOrder: 1,
      shortDescription: 'Trà đào tươi, cam vắt, sả thơm, đá viên',
      tagsJson: ['bestseller'],
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80',
      optionGroups: [
        {
          id: 'og-tra-duong', name: 'Độ ngọt', isRequired: true, minSelect: 1, maxSelect: 1, sortOrder: 1,
          options: [
            { id: 'opt-tra-100', name: '100% ngọt', priceDelta: 0, sortOrder: 1 },
            { id: 'opt-tra-70',  name: '70% ngọt',  priceDelta: 0, sortOrder: 2 },
            { id: 'opt-tra-50',  name: '50% ngọt',  priceDelta: 0, sortOrder: 3 },
            { id: 'opt-tra-0',   name: 'Không ngọt',priceDelta: 0, sortOrder: 4 },
          ],
        },
        {
          id: 'og-tra-da', name: 'Đá', isRequired: false, minSelect: 0, maxSelect: 1, sortOrder: 2,
          options: [
            { id: 'opt-tra-da', name: 'Ít đá', priceDelta: 0, sortOrder: 1 },
            { id: 'opt-tra-noda', name: 'Không đá', priceDelta: 0, sortOrder: 2 },
          ],
        },
      ],
    },
    {
      id: 'item-ca-phe', categoryId: 'cat-bnm-drink', name: 'Cà phê sữa đá',
      price: 29000, status: MenuItemStatus.ACTIVE, sortOrder: 2,
      shortDescription: 'Cà phê Arabica rang xay, sữa đặc Ông Thọ, đá viên to',
      tagsJson: [],
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80',
      optionGroups: [],
    },
    {
      id: 'item-nuoc-ep', categoryId: 'cat-bnm-drink', name: 'Nước ép cam tươi',
      price: 35000, status: MenuItemStatus.ACTIVE, sortOrder: 3,
      shortDescription: 'Cam Vĩnh Long tươi ép nguyên chất, không đường',
      tagsJson: ['healthy'],
      imageUrl: 'https://images.unsplash.com/photo-1534353473418-4cfa0c1ba604?w=400&q=80',
      optionGroups: [],
    },
    // Tráng miệng
    {
      id: 'item-banh-flan', categoryId: 'cat-bnm-dessert', name: 'Bánh flan caramel',
      price: 25000, status: MenuItemStatus.ACTIVE, sortOrder: 1,
      shortDescription: 'Bánh flan mềm mịn, caramel đắng nhẹ, lạnh thấm vị',
      tagsJson: [],
      imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80',
      optionGroups: [],
    },
    {
      id: 'item-che', categoryId: 'cat-bnm-dessert', name: 'Chè ba màu',
      price: 20000, status: MenuItemStatus.SOLD_OUT, sortOrder: 2,
      shortDescription: 'Đậu xanh, đậu đỏ, thạch lá dứa, nước cốt dừa béo',
      tagsJson: [],
      imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80',
      optionGroups: [],
    },
    // Combo
    {
      id: 'item-combo-1', categoryId: 'cat-bnm-combo', name: 'Combo Gia Đình (4 người)',
      price: 220000, status: MenuItemStatus.ACTIVE, sortOrder: 1,
      shortDescription: 'Bún bò × 2, Cơm gà × 1, Gỏi cuốn × 1 , 4 đồ uống',
      tagsJson: ['popular'],
      imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80',
      optionGroups: [],
    },
  ];

  for (const item of items1) {
    const { optionGroups, ...itemData } = item;
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {},
      create: {
        ...itemData,
        price: itemData.price,
        tagsJson: itemData.tagsJson,
      },
    });
    for (const og of optionGroups) {
      const { options, ...ogData } = og;
      await prisma.menuOptionGroup.upsert({
        where: { id: og.id },
        update: {},
        create: { ...ogData, menuItemId: item.id },
      });
      for (const opt of options) {
        await prisma.menuOption.upsert({
          where: { id: opt.id },
          update: {},
          create: { ...opt, optionGroupId: og.id },
        });
      }
    }
  }
  console.log(`  ✓ ${items1.length} menu items`);

  // ── Store 2: Quán Cơm Miền Tây (second tenant for isolation testing) ────────
  console.log('\nCreating Store 2: Quán Cơm Miền Tây...');
  const store2 = await prisma.store.upsert({
    where: { id: 'store-com-mien-tay' },
    update: {},
    create: {
      id: 'store-com-mien-tay',
      name: 'Quán Cơm Miền Tây',
      timezone: 'Asia/Ho_Chi_Minh',
    },
  });

  const branch2 = await prisma.branch.upsert({
    where: { id: 'branch-com-mien-tay-q7' },
    update: {},
    create: {
      id: 'branch-com-mien-tay-q7',
      storeId: store2.id,
      name: 'Quán Cơm Miền Tây — Quận 7',
      address: '456 Nguyễn Lương Bằng, Quận 7, TP.HCM',
      isActive: true,
    },
  });

  const tables2 = [
    { id: 'tbl-mt-01', tableCode: 'table-01', displayName: 'Bàn 01', qrToken: 'qr-cmt-table-01' },
    { id: 'tbl-mt-02', tableCode: 'table-02', displayName: 'Bàn 02', qrToken: 'qr-cmt-table-02' },
    { id: 'tbl-mt-03', tableCode: 'table-03', displayName: 'Bàn 03', qrToken: 'qr-cmt-table-03' },
  ];
  for (const t of tables2) {
    await prisma.diningTable.upsert({
      where: { id: t.id },
      update: {},
      create: { ...t, branchId: branch2.id, status: TableStatus.ACTIVE },
    });
  }

  const cat2 = await prisma.category.upsert({
    where: { id: 'cat-cmt-main' },
    update: {},
    create: { id: 'cat-cmt-main', branchId: branch2.id, name: 'Cơm đĩa', sortOrder: 1, status: CategoryStatus.ACTIVE },
  });

  await prisma.menuItem.upsert({
    where: { id: 'item-cmt-ca-kho' },
    update: {},
    create: {
      id: 'item-cmt-ca-kho',
      categoryId: cat2.id,
      name: 'Cá kho tộ',
      price: 45000,
      status: MenuItemStatus.ACTIVE,
      sortOrder: 1,
      shortDescription: 'Cá basa kho tiêu đậm đà kiểu miền Tây',
      tagsJson: ['bestseller'],
    },
  });
  console.log(`  ✓ Store 2 basic data`);

  // ── Auth users ────────────────────────────────────────────────────────────

  console.log('\nCreating auth users...');

  // Store 1 users
  const adminAuthId = await createAuthUser('admin@bepnhaminh.vn', 'Admin@123456');
  const admin1 = await prisma.user.upsert({
    where: { supabaseAuthUserId: adminAuthId },
    update: {},
    create: {
      supabaseAuthUserId: adminAuthId,
      storeId: store1.id,
      defaultBranchId: branch1.id,
      displayName: 'Admin — Bếp Nhà Mình',
      email: 'admin@bepnhaminh.vn',
      isActive: true,
    },
  });
  await prisma.userRole_Rel.upsert({
    where: { id: `role-admin1-${admin1.id}` },
    update: {},
    create: {
      id: `role-admin1-${admin1.id}`,
      userId: admin1.id,
      role: UserRole.ADMIN,
      storeId: store1.id,
      branchId: branch1.id,
    },
  });

  const kitchenAuthId = await createAuthUser('bep@bepnhaminh.vn', 'Kitchen@123456');
  const kitchen1 = await prisma.user.upsert({
    where: { supabaseAuthUserId: kitchenAuthId },
    update: {},
    create: {
      supabaseAuthUserId: kitchenAuthId,
      storeId: store1.id,
      defaultBranchId: branch1.id,
      displayName: 'Bếp — Nhân viên KDS',
      email: 'bep@bepnhaminh.vn',
      isActive: true,
    },
  });
  await prisma.userRole_Rel.upsert({
    where: { id: `role-kitchen1-${kitchen1.id}` },
    update: {},
    create: {
      id: `role-kitchen1-${kitchen1.id}`,
      userId: kitchen1.id,
      role: UserRole.KITCHEN,
      storeId: store1.id,
      branchId: branch1.id,
    },
  });

  // Store 2 admin (for tenant isolation testing)
  const admin2AuthId = await createAuthUser('admin@commientry.vn', 'Admin@654321');
  const admin2 = await prisma.user.upsert({
    where: { supabaseAuthUserId: admin2AuthId },
    update: {},
    create: {
      supabaseAuthUserId: admin2AuthId,
      storeId: store2.id,
      defaultBranchId: branch2.id,
      displayName: 'Admin — Quán Cơm Miền Tây',
      email: 'admin@commientry.vn',
      isActive: true,
    },
  });
  await prisma.userRole_Rel.upsert({
    where: { id: `role-admin2-${admin2.id}` },
    update: {},
    create: {
      id: `role-admin2-${admin2.id}`,
      userId: admin2.id,
      role: UserRole.ADMIN,
      storeId: store2.id,
      branchId: branch2.id,
    },
  });

  console.log('  ✓ 3 auth users created');

  // ── Phase 2: Seed delivery config for branch 1 ───────────────────────────
  console.log('\nSetting up Phase 2 delivery config for branch 1...');
  await prisma.branch.update({
    where: { id: 'branch-bep-nha-minh-q1' },
    data: {
      // Tọa độ quán — 123 Nguyễn Huệ, Quận 1, TP.HCM (xấp xỉ)
      // TODO: Cập nhật tọa độ thật từ Google Maps khi deploy production
      latitude: 10.774, // 10°46'26.4"N
      longitude: 106.701, // 106°42'03.6"E
      // Bảng phí ship mặc định
      deliveryBaseKm: 2,      // 0-2km = base fee
      deliveryBaseFee: 15000, // 15.000 đ
      deliveryFeePerKm: 5000, // +5.000đ / km sau 2km
      deliveryMaxKm: 10,      // Không giao quá 10km
    },
  });
  console.log('  ✓ Branch 1 delivery config set');

  console.log('\n✅ Seed completed!\n');
  console.log('Test accounts:');
  console.log('  Admin (Store 1): admin@bepnhaminh.vn / Admin@123456');
  console.log('  Kitchen (Store 1): bep@bepnhaminh.vn / Kitchen@123456');
  console.log('  Admin (Store 2): admin@commientry.vn / Admin@654321');
  console.log('\nTest QR tokens (Store 1 — Bếp Nhà Mình):');
  tables1.forEach((t) => console.log(`  ${t.displayName}: ${t.qrToken}`));
  console.log('\nPhase 2 — Online ordering:');
  console.log('  Branch 1 delivery radius: 10km from Quận 1');
  console.log('  Shipping fee: 15.000đ base (0-2km) + 5.000đ/km after');

}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
