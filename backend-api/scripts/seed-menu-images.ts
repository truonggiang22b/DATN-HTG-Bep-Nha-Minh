/**
 * update-menu-images-v2.ts
 * Cập nhật ảnh chính xác cho từng món — dùng URL tìm từ Unsplash browser
 */
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
config();

const p = new PrismaClient();
const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=500&q=80`;

const images: Record<string, string> = {

  // ── 🍟 Đồ Ăn Vặt ─────────────────────────────────────────────────────────
  // Nem chua: Vietnamese street food / nem cuộn sour pork
  'mi-nem-chua-tcc':   U('1563245332-692739e746e7'),
  'mi-nem-chua-pmai':  U('1563245332-692739e746e7'),
  // Khoai tây chiên: golden french fries
  'mi-khoai-chien':    U('1573080496219-bb080dd4f877'),
  // Khoai tây lắc phô mai: seasoned loaded fries
  'mi-khoai-lac':      U('1573080496219-bb080dd4f877'),
  // Xúc xích chiên: grilled sausage
  'mi-xuc-xich':       U('1555243896-c709bfa0b564'),
  // Cá viên chiên: fried fish balls
  'mi-ca-vien':        U('1563245372-f21724e3856d'),
  // Khoai lang kén: sweet potato fritter
  'mi-khoai-lang-ken': U('1571931468379-4e62e51f4614'),

  // ── 🥤 Nước Uống ──────────────────────────────────────────────────────────
  // Nước me đá: tamarind iced drink
  'mi-nuoc-me':        U('1563805352637-3a8f3adedf82'),
  // Chanh leo mix dứa: passion fruit pineapple
  'mi-chanh-leo-dua':  U('1601924638-cbc3d5d567ca'),
  // Nước cam vắt: fresh orange juice
  'mi-nuoc-cam':       U('1534353473418-4cfa0c1ba604'),
  // Nước ép dứa: pineapple juice
  'mi-ep-dua':         U('1587049352846-4a222e784d38'),
  // Nước ép dưa hấu: watermelon juice
  'mi-ep-dua-hau':     U('1560781290-7dc94c0f8f4f'),
  // Coca/Pepsi: cola
  'mi-coca-pepsi':     U('1553361371-9014bcd06459'),
  // C2: iced tea bottle
  'mi-c2':             U('1556679343-c7306c1976bc'),
  // Bò húc: energy drink
  'mi-bo-huc':         U('1624517452488-04d1d5ca5f6b'),

  // ── 🍵 Trà - dùng ảnh bubble tea/fruit tea đẹp ───────────────────────────
  // Trà quất nha đam: kumquat aloe vera tea
  'mi-tra-quat-nd':    U('1551024709-8f23befc6f87'),
  'mi-tra-quat-ls':    U('1551024709-8f23befc6f87'),
  'mi-tra-quat-mo':    U('1551024709-8f23befc6f87'),
  'mi-tra-chanh-nd':   U('1551024709-8f23befc6f87'),
  // Trà mãng cầu, hoa quả: fruit teas
  'mi-tra-mang-cau':   U('1551024709-8f23befc6f87'),
  'mi-tra-hoa-qua':    U('1551024709-8f23befc6f87'),
  'mi-tra-xoai-cl':    U('1551024709-8f23befc6f87'),
  // Trà dưa lưới, đào cam
  'mi-tra-dua-luoi':   U('1615485290382-755b4c04614e'),
  'mi-tra-dl-kem':     U('1615485290382-755b4c04614e'),
  'mi-tra-dao-cam':    U('1548247416-ec66f4900b2e'),

  // ── 🧋 Trà Sữa — boba milk tea ────────────────────────────────────────────
  'mi-ts-oolong':      U('1558618666-fcd25c85cd64'),
  'mi-ts-kieu-sen':    U('1558618666-fcd25c85cd64'),
  // Brown sugar milk tea
  'mi-ts-sua-dd':      U('1558618666-fcd25c85cd64'),
  'mi-ts-sua-trung':   U('1558618666-fcd25c85cd64'),
  'mi-ts-kieu-sua':    U('1558618666-fcd25c85cd64'),
  // Taro milk tea (khoai môn tím)
  'mi-ts-khoai-mon':   U('1558618666-fcd25c85cd64'),
  // Mint milk tea
  'mi-ts-bac-ha':      U('1544145945-f90425340c7e'),
  // Matcha milk tea
  'mi-ts-matcha':      U('1541167760496-162955ed8a9f'),

  // ── ☕ Matcha ──────────────────────────────────────────────────────────────
  'mi-matcha-latte':   U('1541167760496-162955ed8a9f'),
  'mi-matcha-xoai':    U('1541167760496-162955ed8a9f'),
  'mi-matcha-caramel': U('1541167760496-162955ed8a9f'),

  // ── 🍽️ Đồ Ăn ─────────────────────────────────────────────────────────────
  // Xôi gà cay: sticky rice with chicken
  'mi-xoi-ga':         U('1603133872878-684f208fb84b'),
  // Bánh mì chảo: pan-fried banh mi with egg
  'mi-banh-mi-chao':   U('1509722747041-616f39b57169'),
  // Bò bít tết: steak
  'mi-bo-bit-tet':     U('1546069901-ba9599a7e63c'),
  // Salad gà
  'mi-salad-ga':       U('1512621776951-a57141f2eefd'),
  // Salad cá ngừ
  'mi-salad-ca-ngu':   U('1512621776951-a57141f2eefd'),

  // ── 🇰🇷 Đồ Hàn ────────────────────────────────────────────────────────────
  // Kimbap — exact kimbap photo from Unsplash
  'mi-kimbap':         U('1608711311075-802c6767576a'),
  'mi-kimbap-chien':   U('1608711311075-802c6767576a'),
  // Bánh gạo, Tokbokki — exact tteokbokki
  'mi-banh-gao-lac':   U('1711200155252-850f24250269'),
  'mi-tokbokki-tt':    U('1711200155252-850f24250269'),
  'mi-tokbokki-pmai':  U('1711200155252-850f24250269'),

  // ── 🍗 Món Gà ─────────────────────────────────────────────────────────────
  // Crispy fried chicken — exact photo from Unsplash
  'mi-ga-dui-canh':    U('1562967914-173699042b08'),
  'mi-ga-popcorn':     U('1562967914-173699042b08'),

  // ── 🍕 Pizza ──────────────────────────────────────────────────────────────
  'mi-pizza-hawaii':   U('1565299624946-b28f40a0ae38'),
  'mi-pizza-meat':     U('1565299624946-b28f40a0ae38'),
  'mi-pizza-seafood':  U('1565299624946-b28f40a0ae38'),
  'mi-pizza-cheese':   U('1604382355076-af4b0eb60143'),
  'mi-pizza-tuna':     U('1565299624946-b28f40a0ae38'),
  'mi-pizza-chicken':  U('1565299624946-b28f40a0ae38'),
  'mi-pizza-salami':   U('1565299624946-b28f40a0ae38'),

  // ── 🍝 Spaghetti ──────────────────────────────────────────────────────────
  'mi-spa-bolognese':  U('1546549032-9571cd6b27df'),
  'mi-spa-chicken':    U('1621996659602-c5c5a6896f31'),
  'mi-spa-carbonara':  U('1612874742237-6526221588e3'),

  // ── 🍚 Cơm Tấm — Vietnamese broken rice (exact photo) ────────────────────
  'mi-com-suon-bi':    U('1627443122119-9f796a570494'),
  'mi-com-suon-trung': U('1627443122119-9f796a570494'),
  'mi-com-suon-cha-t': U('1627443122119-9f796a570494'),
  'mi-com-suon-bi-c':  U('1627443122119-9f796a570494'),
  'mi-com-dac-biet':   U('1627443122119-9f796a570494'),

  // ── 🧀 Lasagna ────────────────────────────────────────────────────────────
  'mi-lasagna-beef':   U('1574894709920-11b28e7367e3'),
  'mi-mi-ong-bo':      U('1574894709920-11b28e7367e3'),

  // ── 🍝 Penne ──────────────────────────────────────────────────────────────
  'mi-penne-bolognese': U('1546549032-9571cd6b27df'),
  'mi-penne-chicken':   U('1621996659602-c5c5a6896f31'),
  'mi-penne-ham':       U('1621996659602-c5c5a6896f31'),

  // ── 🍗 Gà Bỏ Lò ──────────────────────────────────────────────────────────
  'mi-ga-cay-lo':      U('1562967914-173699042b08'),
  'mi-sun-ga-lo':      U('1562967914-173699042b08'),
};

async function main() {
  console.log('🖼️  Cập nhật ảnh cho', Object.keys(images).length, 'món...\n');
  let ok = 0;
  for (const [id, imageUrl] of Object.entries(images)) {
    const r = await p.menuItem.updateMany({ where: { id }, data: { imageUrl } });
    if (r.count > 0) { ok++; process.stdout.write('.'); }
    else console.warn(`\n  ⚠️  Không tìm thấy: ${id}`);
  }
  console.log(`\n\n✅ Cập nhật ${ok}/${Object.keys(images).length} món thành công`);
  console.log('  → Test: https://datn-htg-bep-nha-minh.vercel.app/qr/qr-bnm-table-01\n');
}

main()
  .catch(err => { console.error('\n❌', err.message); process.exit(1); })
  .finally(() => p.$disconnect());
