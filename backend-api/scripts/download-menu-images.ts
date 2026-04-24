/**
 * download-menu-images.ts
 * Tải ảnh Unsplash về máy, đặt tên theo tên món ăn
 * Ảnh lưu vào: All_Food/menu-images/
 *
 * Chạy: npx tsx scripts/download-menu-images.ts
 */
import https from 'https';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve(__dirname, '../../menu-images');

// Đảm bảo thư mục tồn tại
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=600&q=85&fit=crop`;

// [tên file, URL ảnh]
const items: [string, string][] = [

  // ── Đồ Ăn Vặt ─────────────────────────────────────────────────────────────
  ['nem_chua_tran_cong_chau',   U('1563245332-692739e746e7')],
  ['nem_chua_pho_mai',          U('1563245332-692739e746e7')],
  ['khoai_tay_chien',           U('1573080496219-bb080dd4f877')],
  ['khoai_tay_lac_pho_mai',     U('1573080496219-bb080dd4f877')],
  ['xuc_xich',                  U('1555243896-c709bfa0b564')],
  ['ca_vien_chien',             U('1563245372-f21724e3856d')],
  ['khoai_lang_ken',            U('1571931468379-4e62e51f4614')],

  // ── Nước Uống ─────────────────────────────────────────────────────────────
  ['nuoc_me_da',                U('1563805352637-3a8f3adedf82')],
  ['chanh_leo_mix_dua',         U('1601924638-cbc3d5d567ca')],
  ['nuoc_cam_vat',              U('1534353473418-4cfa0c1ba604')],
  ['nuoc_ep_dua',               U('1587049352846-4a222e784d38')],
  ['nuoc_ep_dua_hau',           U('1560781290-7dc94c0f8f4f')],
  ['coca_pepsi',                U('1553361371-9014bcd06459')],
  ['c2_tra_xanh',               U('1556679343-c7306c1976bc')],
  ['bo_huc',                    U('1624517452488-04d1d5ca5f6b')],

  // ── Trà ───────────────────────────────────────────────────────────────────
  ['tra_quat_nha_dam',          U('1551024709-8f23befc6f87')],
  ['tra_quat_nha_dam_lac_sua',  U('1551024709-8f23befc6f87')],
  ['tra_quat_mat_ong',          U('1551024709-8f23befc6f87')],
  ['tra_chanh_nha_dam',         U('1551024709-8f23befc6f87')],
  ['tra_mang_cau',              U('1571006682260-3b3e25e6d4a6')],
  ['tra_hoa_qua_nhiet_doi',     U('1571006682260-3b3e25e6d4a6')],
  ['tra_xoai_chanh_leo',        U('1571006682260-3b3e25e6d4a6')],
  ['tra_dua_luoi',              U('1615485290382-755b4c04614e')],
  ['tra_dua_luoi_kem_cheese',   U('1615485290382-755b4c04614e')],
  ['tra_dao_cam_sa',            U('1548247416-ec66f4900b2e')],

  // ── Trà Sữa ───────────────────────────────────────────────────────────────
  ['o_long_sen_vang',           U('1558618666-fcd25c85cd64')],
  ['kieu_mach_sen_nuong',       U('1558618666-fcd25c85cd64')],
  ['sua_tuoi_duong_den',        U('1558618666-fcd25c85cd64')],
  ['sua_tuoi_duong_den_trung',  U('1558618666-fcd25c85cd64')],
  ['kieu_mach_sua',             U('1558618666-fcd25c85cd64')],
  ['kieu_mach_sua_khoai_mon',   U('1558618666-fcd25c85cd64')],
  ['kieu_mach_sua_bac_ha',      U('1544145945-f90425340c7e')],
  ['kieu_mach_sua_matcha',      U('1541167760496-162955ed8a9f')],

  // ── Matcha ────────────────────────────────────────────────────────────────
  ['matcha_latte',              U('1541167760496-162955ed8a9f')],
  ['matcha_latte_xoai',         U('1541167760496-162955ed8a9f')],
  ['matcha_latte_caramel',      U('1541167760496-162955ed8a9f')],

  // ── Đồ Ăn ─────────────────────────────────────────────────────────────────
  ['xoi_ga_cay',                U('1603133872878-684f208fb84b')],
  ['banh_mi_chao',              U('1509722747041-616f39b57169')],
  ['bo_bit_tet',                U('1546069901-ba9599a7e63c')],
  ['salad_ga',                  U('1512621776951-a57141f2eefd')],
  ['salad_ca_ngu',              U('1512621776951-a57141f2eefd')],

  // ── Đồ Hàn ────────────────────────────────────────────────────────────────
  ['kimbap_thuong',             U('1608711311075-802c6767576a')],
  ['kimbap_chien',              U('1608711311075-802c6767576a')],
  ['banh_gao_chien_lac_pho_mai',U('1711200155252-850f24250269')],
  ['tokbokki_truyen_thong',     U('1711200155252-850f24250269')],
  ['tokbokki_pho_mai',          U('1711200155252-850f24250269')],

  // ── Món Gà ────────────────────────────────────────────────────────────────
  ['dui_canh_ma_chien_gion',    U('1562967914-173699042b08')],
  ['ga_popcorn',                U('1562967914-173699042b08')],

  // ── Pizza ─────────────────────────────────────────────────────────────────
  ['pizza_hawaii',              U('1565299624946-b28f40a0ae38')],
  ['pizza_meat_love',           U('1565299624946-b28f40a0ae38')],
  ['pizza_seafood',             U('1565299624946-b28f40a0ae38')],
  ['pizza_cheese',              U('1604382355076-af4b0eb60143')],
  ['pizza_tuna',                U('1565299624946-b28f40a0ae38')],
  ['pizza_chicken_bbq',         U('1565299624946-b28f40a0ae38')],
  ['pizza_danish_salami',       U('1565299624946-b28f40a0ae38')],

  // ── Spaghetti ─────────────────────────────────────────────────────────────
  ['spaghetti_bolognese',       U('1546549032-9571cd6b27df')],
  ['spaghetti_chicken',         U('1621996659602-c5c5a6896f31')],
  ['spaghetti_carbonara',       U('1612874742237-6526221588e3')],

  // ── Cơm Tấm ───────────────────────────────────────────────────────────────
  ['com_tam_suon_bi',           U('1627443122119-9f796a570494')],
  ['com_tam_suon_trung',        U('1627443122119-9f796a570494')],
  ['com_tam_suon_cha_trung',    U('1627443122119-9f796a570494')],
  ['com_tam_suon_bi_cha',       U('1627443122119-9f796a570494')],
  ['com_tam_dac_biet',          U('1627443122119-9f796a570494')],

  // ── Lasagna ───────────────────────────────────────────────────────────────
  ['lasagna_beef',              U('1574894709920-11b28e7367e3')],
  ['mi_ong_bo_lo_pho_mai',      U('1574894709920-11b28e7367e3')],

  // ── Penne ─────────────────────────────────────────────────────────────────
  ['bolognese_penne',           U('1546549032-9571cd6b27df')],
  ['cream_chicken_mushroom_penne', U('1621996659602-c5c5a6896f31')],
  ['cream_ham_penne',           U('1621996659602-c5c5a6896f31')],

  // ── Gà Bỏ Lò ──────────────────────────────────────────────────────────────
  ['ga_cay_bo_lo_pho_mai',      U('1562967914-173699042b08')],
  ['sun_ga_cay_bo_lo_pho_mai',  U('1562967914-173699042b08')],
];

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) { resolve(); return; } // skip nếu đã có
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      // Nếu redirect (3xx), follow once
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log(`\n📁 Thư mục lưu ảnh: ${OUT_DIR}`);
  console.log(`⬇️  Tải ${items.length} ảnh...\n`);

  let ok = 0, skip = 0, fail = 0;
  for (const [name, url] of items) {
    const dest = path.join(OUT_DIR, `${name}.jpg`);
    try {
      const existed = fs.existsSync(dest);
      await download(url, dest);
      if (existed) { skip++; process.stdout.write('s'); }
      else          { ok++;   process.stdout.write('.'); }
    } catch (e: any) {
      fail++;
      process.stdout.write('x');
    }
  }

  console.log(`\n\n✅ Hoàn tất!`);
  console.log(`  Tải mới  : ${ok} ảnh`);
  console.log(`  Bỏ qua   : ${skip} ảnh (đã có)`);
  if (fail) console.log(`  Lỗi      : ${fail} ảnh`);
  console.log(`\n📂 Mở thư mục: ${OUT_DIR}`);
}

main().catch(console.error);
