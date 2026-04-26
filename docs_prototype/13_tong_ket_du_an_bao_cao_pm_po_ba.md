# BÁO CÁO TỔNG KẾT DỰ ÁN
## Bếp Nhà Mình — QR Ordering System

> **Phiên bản báo cáo:** 2.0  
> **Ngày:** 18/04/2026  
> **Người lập:** Nhóm phát triển prototype  
> **Đối tượng:** PM · PO · BA  
> **Trạng thái:** ✅ Prototype ổn định — Sẵn sàng bàn giao / pitch khách hàng

---

## TÓM TẮT ĐIỀU HÀNH (Executive Summary)

Prototype **Bếp Nhà Mình** đã hoàn thành **toàn bộ core user flow** từ đầu đến cuối (end-to-end): khách quét QR → gọi món → giỏ hàng → gửi đơn → bếp nhận và xử lý → khách theo dõi trạng thái. Hệ thống gồm **3 giao diện riêng biệt** (Customer, KDS, Admin) hoạt động đồng bộ trong cùng browser profile.

**Đánh giá nhanh:**

| Hạng mục | Tiến độ |
|---|---|
| Nghiệp vụ core flow | ✅ 100% |
| Màn hình Customer (mobile) | ✅ 100% |
| KDS (bếp) | ✅ 100% |
| Admin Dashboard & Menu | ✅ 90% |
| Backend thực (API + DB) | ❌ 0% — chưa bắt đầu |
| Authentication thực | ❌ 0% — đang dùng PIN cứng |
| Cross-device realtime | ❌ 0% — chỉ hoạt động trong cùng browser |

> **Kết luận:** Prototype đủ để **demo toàn bộ nghiệp vụ** cho khách hàng/stakeholder. Để đưa vào production cần Phase 1 backend (ước tính 6–8 tuần).

---

## 1. VỀ MẶT NGHIỆP VỤ — ĐÃ LÀM ĐẾN ĐÂU

### 1.1 Trạng thái hoàn thành theo Epic (đối chiếu PRD `03_prd_mvp_va_backlog_po.md`)

#### Epic E1: QR và Phiên Bàn
| User Story | Yêu cầu | Trạng thái | Ghi chú |
|---|---|---|---|
| US-01 | Quét QR → vào đúng bàn | ✅ DONE | URL `/qr/:token` — token sai hiển thị lỗi thân thiện |
| US-02 | Gắn order với table session | ✅ DONE | Order lưu `tableId` + `tableSessionId` + `clientSessionId` |
| US-03 | Reset bàn sau khi khách đi | ✅ DONE | Admin reset → phiên CLOSED → tab khách tự hiển thị banner |

#### Epic E2: Menu Số
| User Story | Yêu cầu | Trạng thái | Ghi chú |
|---|---|---|---|
| US-04 | Xem menu theo danh mục | ✅ DONE | Anchor navigation (cuộn mượt đến section), IntersectionObserver highlight tab |
| US-05 | Xem chi tiết món | ✅ DONE | Bottom sheet: ảnh, giá, mô tả, option, ghi chú, stepper |
| US-06 | Biết món tạm hết | ✅ DONE | Badge "Tạm hết", nút thêm bị disable |
| US-07 | Tìm kiếm / lọc món | ✅ DONE | Search theo tên real-time với SVG icon |

#### Epic E3: Giỏ Hàng & Chốt Đơn
| User Story | Yêu cầu | Trạng thái | Ghi chú |
|---|---|---|---|
| US-08 | Thêm món, tăng/giảm số lượng | ✅ DONE | Cart per-device, stepper, xóa món |
| US-09 | Ghi chú riêng cho từng món | ✅ DONE | Hiển thị nổi bật trên KDS |
| US-10 | Chọn option cơ bản (bắt buộc) | ✅ DONE | Validate required options trước khi thêm giỏ |
| US-11 | Chốt đơn chống trùng | ✅ DONE | Idempotency key, nút disabled khi đang gửi |
| US-12 | Gọi thêm món sau đơn đầu | ✅ DONE | Tạo order mới cùng session — CTA trong TrackingPage |

#### Epic E4: KDS Xử Lý Đơn
| User Story | Yêu cầu | Trạng thái | Ghi chú |
|---|---|---|---|
| US-13 | Thấy order mới ngay | ✅ DONE | Poll qua Zustand + localStorage events |
| US-14 | Đổi trạng thái order | ✅ DONE | NEW → PREPARING → READY → SERVED |
| US-15 | Huỷ order | ✅ DONE | Nút huỷ với xác nhận, trạng thái CANCELLED |
| US-16 | Ghi chú món nổi bật | ✅ DONE | Styled block nổi bật, không chiếm diện tích nếu trống |

**Cải tiến thêm (ngoài PRD gốc):**
- **FIFO Sorting:** Đơn nào vào trước hiển thị trước trong mỗi cột — đảm bảo bếp ưu tiên đúng thứ tự
- **Bộ đếm thời gian thông minh:** Timer đếm từ lúc tạo đơn; khi đơn SERVED thì đóng băng (hiển thị tổng thời gian thực hiện)
- **Hệ màu chuẩn hóa:** Mỗi trạng thái đơn có màu riêng nhất quán toàn app (Blue/Amber/Green/Teal/Red)

#### Epic E5: Tracking Cho Khách
| User Story | Yêu cầu | Trạng thái | Ghi chú |
|---|---|---|---|
| US-17 | Thấy đơn đã tiếp nhận | ✅ DONE | Redirect tự động sau khi submit, hiển thị orderCode + bàn + món |
| US-18 | Trạng thái tự cập nhật | ✅ DONE | Polling 2s + nút làm mới thủ công |
| US-19 | Gọi thêm món từ tracking | ✅ DONE | CTA "Gọi thêm món" → về MenuPage giữ nguyên session |

#### Epic E6: Admin Quản Trị
| User Story | Yêu cầu | Trạng thái | Ghi chú |
|---|---|---|---|
| US-20 | CRUD món ăn | ✅ DONE | Tạo/sửa/xoá/đổi trạng thái món |
| US-21 | Đánh dấu món tạm hết | ✅ DONE | Toggle trạng thái, phản ánh ngay trên menu khách |
| US-22 | Quản lý danh mục | ✅ DONE | Tạo/sửa/ẩn danh mục, sort order |
| US-23 | Quản lý bàn và QR | ✅ DONE | Tạo bàn, xem URL QR, copy token |
| US-24 | Lịch sử đơn theo bàn/ngày | ✅ DONE | Bộ lọc ngày (preset + custom range), nhóm theo ngày, chi tiết đơn expandable |

### 1.2 Acceptance Criteria Sản Phẩm

| ID | Tiêu chí | Kết quả |
|---|---|---|
| AC-P01 | Demo end-to-end trên ít nhất 1 bàn + 1 màn KDS | ✅ PASS |
| AC-P02 | Không chốt đơn với giỏ rỗng / món tạm hết | ✅ PASS |
| AC-P03 | Order trên KDS đủ món, số lượng, option, ghi chú, tổng tiền | ✅ PASS |
| AC-P04 | Đổi trạng thái KDS → phản ánh ở khách | ✅ PASS |
| AC-P05 | Admin đánh dấu tạm hết → khách thấy ngay | ✅ PASS |
| AC-P06 | Gọi thêm tạo order mới, không sửa order cũ | ✅ PASS |
| AC-P07 | Reset bàn → đóng session, tab khách hiển thị banner | ✅ PASS |

**=> Kết quả: 7/7 AC cấp sản phẩm PASS ✅**

---

## 2. VỀ CODE FE — ĐÃ HOÀN THÀNH ĐẾN ĐÂU

### 2.1 Stack & Kiến Trúc

```
Frontend:   React 18 + TypeScript + Vite
State:      Zustand (localStorage persist — cross-tab sync)
Styling:    Vanilla CSS với Design Token system
Routing:    React Router DOM v6
Fonts:      Be Vietnam Pro (body) + Sora (số/giá)
Icons:      Inline SVG (không dùng emoji, không phụ thuộc thư viện icon)
```

### 2.2 Màn Hình Đã Hoàn Thành

| # | Màn hình | Route | Đối tượng | Trạng thái |
|---|---|---|---|---|
| 1 | **Menu** (danh mục + tìm kiếm) | `/qr/:tableCode` | Khách | ✅ Hoàn chỉnh |
| 2 | **Item Detail Sheet** (bottom sheet) | (overlay) | Khách | ✅ Hoàn chỉnh |
| 3 | **Giỏ hàng** | `/cart` | Khách | ✅ Hoàn chỉnh |
| 4 | **Theo dõi đơn hàng** | `/order/:id/tracking` | Khách | ✅ Hoàn chỉnh |
| 5 | **QR không hợp lệ** | (inline) | Khách | ✅ Hoàn chỉnh |
| 6 | **Phiên bàn kết thúc** | (inline) | Khách | ✅ Hoàn chỉnh |
| 7 | **KDS Board** | `/kds` | Bếp (PIN: 5678) | ✅ Hoàn chỉnh |
| 8 | **Admin Dashboard** | `/admin` | Chủ quán (PIN: 1234) | ✅ Hoàn chỉnh |
| 9 | **Admin Quản lý Menu** | `/admin/menu` | Chủ quán | ✅ Hoàn chỉnh |
| 10 | **Admin Quản lý Bàn/QR** | `/admin/tables` | Chủ quán | ✅ Hoàn chỉnh |

### 2.3 Component Library Đã Build

| Component | Chức năng |
|---|---|
| `ItemDetailSheet` | Bottom sheet animation, option validator, stepper, note input |
| `PINGate` | Bảo vệ route admin/KDS, PIN per-session |
| `ToastContainer` | Thông báo nổi, auto-dismiss |
| `KDSCard` | Card đơn hàng trên KDS, inline timer, CTA chuyển trạng thái |
| `AdminLayout` | Sidebar navigation với SVG icons |

### 2.4 Business Logic Đã Triển Khai

```
✅ Session lifecycle    — auto-open/close, detect stale session
✅ Cart (per-device)    — sessionStorage, mỗi tab độc lập
✅ Idempotency          — chống submit đơn 2 lần
✅ Order code           — format B[bàn]-[seq], reset theo session
✅ Status machine       — NEW→PREPARING→READY→SERVED / CANCELLED
✅ FIFO sorting         — đơn cũ nhất lên đầu mỗi cột KDS
✅ Timer freeze         — bộ đếm dừng khi đơn SERVED
✅ Date-range filter    — lọc đơn theo ngày/tuần/tháng hoặc custom
✅ Option snapshot      — lưu option tại thời điểm order, không bị thay đổi sau
✅ Color system         — ORDER_STATUS_STYLE tập trung, dùng chung toàn app
```

### 2.5 Design System

```css
/* 5 màu thương hiệu độc đáo */
--color-rice:      #FFF8EA   /* Nền chính — ấm */
--color-chili:     #D83A2E   /* Accent đỏ — CTA chính */
--color-turmeric:  #E8A020   /* Accent vàng */
--color-leaf:      #2F7D4E   /* Xanh lá — success */
--color-charcoal:  #25211B   /* Text chính */

/* 5 màu trạng thái đơn (ORDER_STATUS_STYLE) */
NEW:       #3b82f6  (Blue)
PREPARING: #f59e0b  (Amber)
READY:     #22c55e  (Green)
SERVED:    #0d9488  (Teal)
CANCELLED: #ef4444  (Red)
```

### 2.6 Lịch Sử Cải Tiến (Chronological)

| # | Vấn đề phát hiện | Fix thực hiện |
|---|---|---|
| 1 | 🐛 Món có option bắt buộc không thêm được vào giỏ | Fix validate + re-render CartBar sau khi addToCart |
| 2 | 🐛 Nút xem giỏ hàng không hiện sau khi thêm (race condition) | Sync CartBar với Zustand store thay vì chỉ dùng local state |
| 3 | 🐛 Nút làm mới TrackingPage không load lại dữ liệu | Gọi `forceUpdate()` để trigger re-read từ store |
| 4 | ✨ Timer KDS đếm mãi dù đơn đã SERVED | Thêm `endAt` param vào `useElapsedTime`, freeze tại `order.updatedAt` |
| 5 | ✨ Đơn trên KDS không đúng thứ tự | Sort theo `createdAt` ASC trong mỗi cột (FIFO) |
| 6 | ✨ Admin Dashboard thiếu lịch sử đơn theo ngày | Viết lại hoàn toàn: group by date, collapse/expand, custom filter, expandable detail |
| 7 | ✨ Màu trạng thái đơn không đồng bộ | Tạo `ORDER_STATUS_STYLE` tập trung trong `constants.ts`, apply toàn app |
| 8 | ✨ Icon emoji (🔍🛒🍽) không consistent cross-platform | Thay bằng inline SVG chuẩn |

### 2.7 Dữ Liệu Seed (Demo Ready)

- **18 món ăn** với ảnh thực tế, giá VND, mô tả, tag (popular/spicy/vegetarian...)
- **5 danh mục**: Món chính, Món nhẹ, Đồ uống, Tráng miệng, Combo
- **5 bàn**: Bàn 01 → Bàn 05 với QR token
- Một số món có **option group**: size, topping, mức đường...

---

## 3. PHƯƠNG ÁN ĐỀ XUẤT ĐỂ HOÀN THÀNH SẢN PHẨM

### 3.1 Gap Analysis — Cái Gì Còn Thiếu Để Ra Production

| Hạng mục | Mô tả gap | Mức độ |
|---|---|---|
| **Backend API** | Toàn bộ state đang lưu localStorage — mất khi xoá cache | 🔴 Critical |
| **Cross-device sync** | Điện thoại khách ≠ đồng bộ với laptop KDS thật | 🔴 Critical |
| **Authentication thực** | PIN cứng trong code, không có JWT/role-based | 🔴 Critical |
| **QR in được** | URL hiện chỉ là text, chưa xuất QR image/PDF | 🟡 High |
| **Thanh toán** | Chưa tích hợp cổng thanh toán | 🟡 High |
| **Báo cáo doanh thu** | Admin Dashboard có lịch sử nhưng chưa có biểu đồ | 🟡 Medium |
| **Thông báo push** | Bếp/server không nhận alert khi có đơn mới | 🟡 Medium |
| **Admin mobile** | Layout admin tối ưu desktop, tablet; chưa tốt trên mobile | 🟠 Low |
| **In hoá đơn** | Chưa có kết nối máy in nhiệt | 🟠 Low |

### 3.2 Lộ Trình 3 Giai Đoạn

---

#### 🏁 Phase 1 — MVP Production (6–8 tuần)
**Mục tiêu:** Triển khai thực tế cho 1 quán pilot, thay thế hoàn toàn prototype

**Backend:**
```
□ Chọn stack backend: Node.js (Express/Fastify) hoặc Supabase (BaaS nhanh)
□ Database: PostgreSQL theo ERD đã có trong docs_prototype/06_data_model_api_spec.md
□ REST API: /menus, /tables, /sessions, /orders, /admin
□ WebSocket hoặc SSE: Thay polling bằng realtime push
□ Upload ảnh: Cloudinary hoặc Supabase Storage
```

**Auth:**
```
□ Admin: Email/password + JWT (accessToken + refreshToken)
□ KDS: Mã PIN động, quản lý qua Admin, đổi được theo ca
□ Khách: Không cần login, định danh qua tableSessionId
```

**FE Integration:**
```
□ Thay Zustand localStorage bằng API calls
□ Giữ nguyên toàn bộ UI đã build — chỉ swap data layer
□ Xử lý loading/error states
□ WebSocket client cho KDS và TrackingPage
```

**Deploy:**
```
□ Frontend: Vercel / Netlify (CI/CD tự động từ Git)
□ Backend: Railway / Render / VPS (Hetzner ~5$/tháng)
□ Database: Supabase Free tier hoặc Neon Postgres
□ Domain: bnm.vn hoặc subdomain
```

**Ước tính team & timeline:**

| Vai trò | Công việc | Thời gian |
|---|---|---|
| 1 Backend developer | API + DB schema + WebSocket | 4–5 tuần |
| 1 Frontend developer | API integration, error handling | 2–3 tuần |
| 1 QA | UAT end-to-end trên thiết bị thật | 1 tuần |
| PM/PO | Coordinate, UAT sign-off | Song song |

---

#### 🚀 Phase 2 — Tính Năng Nâng Cao (4–6 tuần tiếp)
**Mục tiêu:** Cải thiện trải nghiệm và mở rộng doanh thu

```
□ Thanh toán online: VNPay / Momo / ZaloPay
□ In hoá đơn: Kết nối máy in nhiệt qua ESC/POS protocol
□ QR Export: Xuất QR image/PDF cho từng bàn (in dán lên bàn)
□ Web Push Notification: Alert bếp/server khi có đơn mới
□ Báo cáo doanh thu: Biểu đồ ngày/tuần/tháng, top món bán chạy
□ Lịch sử khách: Optional login để xem lại đơn cũ (loyalty prep)
□ Admin: Thêm section quản lý Option Groups trong AdminMenuPage
    (thêm/sửa/xoá lựa chọn món — size, topping, mức đường...)
□ Online Order - Nâng cấp tính khoảng cách giao hàng:
    Hiện tại: Haversine (đường chim bay, thuần toán học, miễn phí)
    Phương án A: Google Maps Distance Matrix API
               → Khoảng cách đường thực tế, chính xác hơn ~20–30%
               → Miễn phí đến ~1.000 request/tháng, có phí sau
    Phương án B: OSRM (Open Source Routing Machine)
               → Mã nguồn mở, miễn phí hoàn toàn, tự host
               → Cần tải map data & dựng server riêng
```

---

#### 🌐 Phase 3 — Mở Rộng Quy Mô (Tương lai)

```
□ Multi-cơ sở: Một admin quản lý nhiều quán
□ App KDS native (React Native) — tối ưu tablet bếp
□ AI gợi ý món: Upsell dựa trên lịch sử order + thời tiết/giờ
□ Loyalty Program: Tích điểm, voucher, birthday offer
□ POS Integration: Sync với KiotViet, MISA hoặc Square
□ Review & Rating: Đánh giá sau bữa ăn
```

---

### 3.3 Đề Xuất Stack Production (Khuyến Nghị)

```
Option A — Nhanh (dùng BaaS):
├── Frontend:  React (giữ nguyên) → Vercel
├── Backend:   Supabase (PostgreSQL + Auth + Realtime + Storage)
├── Realtime:  Supabase Realtime (built-in)
└── Ưu điểm:  Tiết kiệm 60% thời gian backend, free tier rộng

Option B — Linh hoạt (custom):
├── Frontend:  React → Vercel
├── Backend:   Node.js/Fastify → Railway
├── Database:  PostgreSQL (Neon hoặc self-hosted)
├── Realtime:  Socket.io hoặc native WebSocket
└── Ưu điểm:  Toàn quyền kiểm soát, dễ scale dài hạn

=> Khuyến nghị: Option A cho MVP nhanh, chuyển Option B khi cần scale.
```

---

### 3.4 Rủi Ro & Giảm Thiểu

| Rủi ro | Khả năng | Tác động | Giảm thiểu |
|---|---|---|---|
| Backend delay ảnh hưởng deadline | Trung bình | Cao | Dùng Supabase để giảm thời gian setup |
| Realtime không ổn định khi nhiều bàn | Thấp | Cao | Fallback về polling 5s nếu WS mất kết nối |
| Ảnh món tải chậm | Cao | Trung bình | CDN + lazy loading + skeleton screen |
| Khách hàng quen nhân viên gọi món | Trung bình | Cao | UX onboarding đơn giản + QR sticker có hướng dẫn |
| Pin/thiết bị KDS hết pin giữa ca | Thấp | Cao | Màn hình KDS cắm điện, không phụ thuộc pin |

---

## 4. HƯỚNG DẪN DEMO CHO PM/PO/BA

### Kịch bản demo 3 tab chuẩn (8 phút)

```
Chuẩn bị:
  npm run dev  →  http://localhost:5173

[Tab 1] Khách hàng — Viewport mobile (375px):
  1. Mở http://localhost:5173/qr/table-05
  2. Duyệt menu → bấm vào "Bún bò đặc biệt" → chọn option "Size L"
  3. Thêm vào giỏ → thêm thêm 1-2 món nữa
  4. Bấm cart bar đỏ → vào giỏ hàng
  5. Gửi order → sang trang tracking

[Tab 2] KDS — Fullscreen:
  6. http://localhost:5173/kds (PIN: 5678)
  7. Thấy đơn B05-001 xuất hiện ngay lập tức
  8. Bấm "Bắt đầu làm" → sang PREPARING
     (Tab 1 tự cập nhật timeline)
  9. Bấm "Sẵn sàng phục vụ" → sang READY
     (Tab 1 hiển thị "Sẵn sàng!")
  10. Bấm "Đã phục vụ" → sang SERVED
      (Timer đóng băng — hiển thị tổng thời gian làm)

[Tab 3] Admin:
  11. http://localhost:5173/admin (PIN: 1234)
  12. Xem Dashboard → Orders tab → lọc theo ngày → thấy đơn vừa xong
  13. Vào "Quản lý bàn" → Reset Bàn 05
      (Tab 1 tự hiện banner "Phiên đã kết thúc")
  14. Vào "Quản lý menu" → Toggle 1 món thành "Tạm hết"
      (Tab 1 tự hiển thị badge tạm hết)
```

---

## 5. THÔNG TIN KỸ THUẬT ĐỂ BÀN GIAO

### Khởi động prototype

```bash
cd All_Food/web-prototype-react
npm install      # Lần đầu
npm run dev      # http://localhost:5173
```

### URL truy cập

| Vai trò | URL | PIN |
|---|---|---|
| Khách — Bàn 01 | `/qr/table-01` | Không cần |
| Khách — Bàn 02 đến 05 | `/qr/table-02` → `/qr/table-05` | Không cần |
| Admin | `/admin` | **1234** |
| KDS | `/kds` | **5678** |

### Cấu trúc code chính

```
src/
├── constants.ts          ← ORDER_STATUS_STYLE, PIN, labels
├── types/index.ts        ← TypeScript interfaces (MenuItem, Order...)
├── data/seedData.ts      ← 18 món, 5 danh mục, 5 bàn
├── store/useStore.ts     ← Zustand — toàn bộ state & actions
├── hooks/useClientSession.ts  ← Cart per-tab, elapsed timer
├── pages/
│   ├── MenuPage.tsx      ← Mobile menu (anchor nav, search, cart)
│   ├── CartPage.tsx      ← Giỏ hàng + session guard
│   ├── TrackingPage.tsx  ← Tracking + timeline
│   ├── KDSPage.tsx       ← KDS board với FIFO + timer
│   ├── AdminDashboardPage.tsx  ← Dashboard + lịch sử + bộ lọc ngày
│   ├── AdminMenuPage.tsx       ← CRUD menu items
│   └── AdminTablesPage.tsx     ← Quản lý bàn + QR
└── styles/
    ├── tokens.css        ← Design tokens (màu, font, spacing)
    ├── global.css        ← Reset + shared utilities
    ├── customer.css      ← Mobile UI
    ├── kds.css           ← Dark KDS board
    └── admin.css         ← Admin desktop layout
```

---

## 6. ĐIỂM ĐÃ CỐ Ý ĐỂ LẠI CHO PRODUCTION

Các điểm sau **được bỏ qua có chủ ý** trong prototype, cần implement đầy đủ ở production:

| Hạng mục | Lý do bỏ qua | Cần làm ở phase nào |
|---|---|---|
| Cross-device realtime | Cần backend WebSocket | Phase 1 |
| JWT Auth | Over-engineering cho prototype | Phase 1 |
| Upload ảnh thực | Cần storage service | Phase 1 |
| Thanh toán | Tích hợp phức tạp, pháp lý | Phase 2 |
| In hoá đơn | HW dependency | Phase 2 |
| Admin: Quản lý Option Groups | Cần thêm UI section trong AdminMenuPage | Phase 2 |
| Khoảng cách ship thực tế | Dùng Haversine (đường chim bay); nâng lên Google Maps API hoặc OSRM để có đường đi thực tế chính xác hơn | Phase 2 |
| Multi-cơ sở | Cần thiết kế DB phức tạp hơn | Phase 3 |
| AI gợi ý | Cần dữ liệu order history | Phase 3 |

---

*Tài liệu tổng kết này được lập sau khi hoàn thành toàn bộ prototype và các round cải tiến UX/nghiệp vụ.*  
*Phase tiếp theo phụ thuộc vào quyết định của PM/PO về timeline và budget.*  
*Cập nhật cuối: 18/04/2026*
