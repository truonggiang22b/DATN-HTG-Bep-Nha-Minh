# Tài Liệu Tổng Kết Prototype
## Bếp Nhà Mình — QR Ordering System

> **Phiên bản:** 1.0.0 — Prototype Demo  
> **Ngày hoàn thành:** 16/04/2026  
> **Trạng thái:** ✅ Sẵn sàng demo khách hàng

---

## Mục Lục

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Kiến trúc kỹ thuật](#2-kiến-trúc-kỹ-thuật)
3. [Giai đoạn 1 — Thiết kế UI (Stitch)](#3-giai-đoạn-1--thiết-kế-ui-stitch)
4. [Giai đoạn 2 — Code Prototype React](#4-giai-đoạn-2--code-prototype-react)
5. [Giai đoạn 3 — UAT & Bug Fix](#5-giai-đoạn-3--uat--bug-fix)
6. [Cấu trúc thư mục](#6-cấu-trúc-thư-mục)
7. [Hướng dẫn sử dụng prototype](#7-hướng-dẫn-sử-dụng-prototype)
8. [Giới hạn của prototype](#8-giới-hạn-của-prototype)
9. [Lộ trình phát triển tiếp theo](#9-lộ-trình-phát-triển-tiếp-theo)

---

## 1. Tổng Quan Dự Án

**Bếp Nhà Mình** là hệ thống đặt món tại bàn qua QR code dành cho nhà hàng/quán ăn quy mô vừa và nhỏ. Khách hàng quét mã QR đặt trên bàn, tự gọi món trực tiếp qua điện thoại mà không cần chờ nhân viên. Đơn hàng được gửi tức thì tới màn hình bếp (KDS), chủ quán quản lý toàn bộ qua Admin Panel.

### Mô hình người dùng

| Vai trò | Thiết bị | Chức năng chính |
|---------|----------|-----------------|
| **Khách hàng** | Điện thoại cá nhân | Xem menu, gọi món, theo dõi trạng thái đơn |
| **Nhân viên bếp** | Màn hình KDS (tablet/TV) | Xem đơn mới, cập nhật trạng thái chế biến |
| **Chủ quán / Quản lý** | Laptop/desktop | Quản lý thực đơn, bàn, xem tổng quan |

### Tài liệu tham chiếu

| File | Nội dung |
|------|----------|
| `docs_prototype/02_quy_trinh_nghiep_vu_thong_nhat.md` | Quy trình nghiệp vụ chuẩn |
| `docs_prototype/06_data_model_api_spec.md` | ERD và API specification |
| `docs_prototype/11_prototype_uat_qa_ai_review_checklist.md` | Checklist UAT/QA |
| `docs_ui_vibecode/01_ui_design_brief.md` | Design brief & concept |
| `docs_ui_vibecode/03_screen_inventory_va_user_flow.md` | Danh sách màn hình & user flow |
| `docs_ui_vibecode/05_component_va_design_system_spec.md` | Design system specification |
| `docs_ui_vibecode/06_demo_script_va_acceptance_ui.md` | Script demo & acceptance criteria |

---

## 2. Kiến Trúc Kỹ Thuật

### Stack công nghệ

```
Frontend:     React 18 + TypeScript + Vite
State:        Zustand (với persist middleware)
Styling:      Vanilla CSS (CSS custom properties / design tokens)
Routing:      React Router DOM v6
Fonts:        Be Vietnam Pro (body) + Sora (accent/numbers) — Google Fonts
Build tool:   Vite 8
```

### Mô hình State

```
┌─────────────────────────────────────────────────────────┐
│                     localStorage                         │
│   (Shared across all tabs — cross-tab sync via events)  │
│                                                          │
│   • menuItems[]      — Danh sách món ăn                 │
│   • categories[]     — Danh mục                         │
│   • tables[]         — Bàn ăn                           │
│   • tableSessions[]  — Phiên bàn                        │
│   • orders[]         — Đơn hàng                         │
│   • idempotencyKeys  — Chống tạo đơn trùng              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   sessionStorage                         │
│       (Per-tab — mỗi thiết bị có dữ liệu riêng)        │
│                                                          │
│   • cart[]           — Giỏ hàng riêng của tab           │
│   • clientSessionId  — ID định danh thiết bị            │
│   • pinPassed        — Trạng thái PIN gate               │
│   • bnm-table-id     — Bàn đang phục vụ                 │
│   • bnm-table-display — Tên hiển thị bàn                │
└─────────────────────────────────────────────────────────┘
```

### Giả định về sync (Prototype Assumption)

> ⚠️ **Prototype chỉ sync trong cùng browser profile / multi-tab trên cùng một máy.**  
> Cross-device thực (điện thoại khách + laptop KDS + laptop admin) cần backend WebSocket/SSE thực sự.

### Luồng dữ liệu chính

```
Khách quét QR
    ↓
/qr/:tableCode → MenuPage
    • openSession() nếu chưa có phiên bàn
    • Lưu tableId vào sessionStorage
    ↓
Thêm món → CartPage
    • cart lưu trong sessionStorage (per-tab)
    • Validate item còn ACTIVE
    ↓
handleSubmit → createOrder()
    • Kiểm tra idempotency key
    • Tạo Order với orderCode (format: B05-001)
    • clearCart()
    • navigate('/order/:id/tracking')
    ↓
TrackingPage
    • Poll mỗi 2s qua forceUpdate
    • Detect session CLOSED → hiển thị banner
    ↓
KDSPage (tab khác)
    • Lắng nghe localStorage events
    • Hiển thị đơn mới
    • Cập nhật status: NEW → PREPARING → READY → SERVED
```

---

## 3. Giai Đoạn 1 — Thiết Kế UI (Stitch)

### Design System "Warm Counter, Fast Kitchen"

#### Bảng màu

| Token | Hex | Ý nghĩa |
|-------|-----|---------|
| `--color-rice` | `#FFF8EA` | Nền chính — ấm áp như cơm |
| `--color-paper` | `#F5EDD8` | Nền thứ cấp — giấy cũ |
| `--color-chili` | `#D83A2E` | Accent chính — ớt đỏ |
| `--color-turmeric` | `#E8A020` | Accent phụ — nghệ vàng |
| `--color-leaf` | `#2F7D4E` | Success — lá xanh |
| `--color-soy` | `#8C7355` | Text phụ — màu nước tương |
| `--color-charcoal` | `#25211B` | Text chính — than củi |
| `--color-steam` | `#E8DDCC` | Border / divider |

#### Typography

```css
--font-primary: 'Be Vietnam Pro', sans-serif;  /* Body text */
--font-accent:  'Sora', sans-serif;            /* Số, giá tiền, code */
```

#### Spacing & Radius

```css
--space-xs: 4px   --space-sm: 8px   --space-md: 16px
--space-lg: 24px  --space-xl: 32px  --space-2xl: 48px

--radius-xs: 4px  --radius-sm: 8px   --radius-md: 12px
--radius-lg: 16px --radius-pill: 999px
```

### Danh sách màn hình đã thiết kế (Stitch)

| # | Màn hình | Vai trò | Trạng thái |
|---|----------|---------|-----------|
| 1 | Menu Home | Khách hàng | ✅ Hoàn thành |
| 2 | Item Detail Sheet | Khách hàng | ✅ Hoàn thành |
| 3 | Cart / Giỏ hàng | Khách hàng | ✅ Hoàn thành |
| 4 | Order Tracking | Khách hàng | ✅ Hoàn thành |
| 5 | Invalid QR / Session Ended | Khách hàng | ✅ Hoàn thành |
| 6 | KDS Board | Nhân viên bếp | ✅ Hoàn thành |
| 7 | Admin Dashboard | Chủ quán | ✅ Hoàn thành |
| 8 | Admin Menu Management | Chủ quán | ✅ Hoàn thành |
| 9 | Admin Tables & QR | Chủ quán | ✅ Hoàn thành |
| 10 | PIN Gate | Admin + KDS | ✅ Hoàn thành |

---

## 4. Giai Đoạn 2 — Code Prototype React

### 4.1 Data Model

#### MenuItem

```typescript
interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  shortDescription: string;
  price: number;                    // VND
  imageUrl: string;
  status: 'ACTIVE' | 'SOLD_OUT' | 'HIDDEN';
  tags: string[];                   // 'popular', 'spicy', 'vegetarian', 'new', 'healthy'
  optionGroups: OptionGroup[];
}
```

#### TableSession & Order

```typescript
interface TableSession {
  id: string;
  tableId: string;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  closedAt: string | null;
}

interface Order {
  id: string;
  orderCode: string;                // Format: B05-001
  tableId: string;
  tableSessionId: string;
  clientSessionId: string;
  status: OrderStatus;              // NEW|PREPARING|READY|SERVED|CANCELLED
  items: OrderItem[];
  subtotal: number;
  createdAt: string;
  idempotencyKey: string;
}
```

### 4.2 Seed Data

- **18 món ăn** với ảnh thực tế từ nguồn ảnh F&B
- **5 danh mục**: Món chính, Món nhẹ, Đồ uống, Tráng miệng, Combo
- **5 bàn**: Bàn 01 → Bàn 05 với QR token tương ứng

### 4.3 Routing (React Router v6)

```
/qr/:tableCode              →  MenuPage        (Khách hàng)
/cart                       →  CartPage         (Khách hàng)
/order/:orderId/tracking    →  TrackingPage     (Khách hàng)
/kds                        →  KDSPage          (Nhân viên bếp — PIN: 5678)
/admin                      →  AdminDashboard   (Chủ quán — PIN: 1234)
/admin/menu                 →  AdminMenuPage    (Chủ quán)
/admin/tables               →  AdminTablesPage  (Chủ quán)
/invalid-qr                 →  (inline trong MenuPage)
```

### 4.4 Business Logic Đã Triển Khai

#### Session Lifecycle
- Phiên bàn **tự động mở** khi khách quét QR lần đầu
- Nếu đã có phiên OPEN → dùng lại, không tạo mới
- Admin reset bàn → phiên CLOSED, tạo phiên mới
- Tab khách cũ nhận diện phiên CLOSED → hiển thị "Phiên đã kết thúc"

#### Cart Model (Per-device)
- Mỗi tab/thiết bị có giỏ hàng riêng (sessionStorage)
- Nhiều thiết bị cùng bàn → mỗi thiết bị order riêng nhưng gắn vào cùng tableSession

#### Idempotency
```typescript
const idempotencyKey = `${clientSessionId}_${Date.now()}_${randomSuffix}`;
// Nếu key đã tồn tại → trả về order cũ, không tạo mới
```

#### Order Code Format
```
B[tableNumber]-[sequentialCounter]
Ví dụ: B05-001, B05-002, B03-001
Counter reset khi mở phiên mới
```

#### Status Transitions
```
NEW → PREPARING → READY → SERVED
 └──────────────────────→ CANCELLED
```

### 4.5 Component quan trọng

#### `ItemDetailSheet`
- Bottom sheet animation (slide up)
- Validate required option groups trước khi cho thêm vào giỏ
- Quantity stepper
- Ghi chú riêng cho từng món

#### `PINGate`
- Bảo vệ Admin (/admin/*) và KDS (/kds)
- PIN lưu tạm trong sessionStorage (`pinPassed`)
- PIN cứng trong constants: Admin `1234`, KDS `5678`

#### `MenuPage` — Category Tabs (Navigation Mode)
- Tabs hoạt động như **anchor navigation**, không phải filter
- Bấm tab → scroll mượt đến section tương ứng
- `IntersectionObserver` tự highlight tab khi cuộn tay
- Tất cả danh mục luôn hiển thị đồng thời

#### `TrackingPage`
- Poll mỗi 2 giây (forceUpdate) → phát hiện thay đổi trạng thái từ KDS
- Hiển thị timeline: Tiếp nhận → Đang làm → Sẵn sàng → Đã phục vụ
- Detect session CLOSED → hiện banner "Phiên bàn đã kết thúc"

---

## 5. Giai Đoạn 3 — UAT & Bug Fix

### 5.1 Checklist Review

Đối chiếu toàn bộ theo `11_prototype_uat_qa_ai_review_checklist.md`:

| Nhóm kiểm thử | Kết quả |
|---------------|---------|
| Màn hình & User Flow | ✅ 10/10 màn hình đúng spec |
| Business Rules | ✅ Session lifecycle, cart model, order code |
| PIN Gate | ✅ Admin 1234, KDS 5678 |
| Cross-tab sync | ✅ Hoạt động trong cùng browser profile |
| KDS Flow | ✅ Nhận đơn, cập nhật trạng thái |
| Admin Functions | ✅ Toggle menu, reset bàn |
| Invalid QR | ✅ Hiển thị thông báo lỗi |

### 5.2 Bugs Đã Phát Hiện & Vá

#### Bug #1 (Critical) — Nút "Gửi order" bị che khuất

**Mô tả:** Trên một số viewport mobile, nút "Gửi order cho quán" ở cuối CartPage bị che khuất bởi các element khác, không bấm được.

**Nguyên nhân:** `.cart-footer` có `z-index: 50` — bằng với `.cart-header`, gây xung đột. Padding bottom chưa đủ để phần tử ở dưới không bị che.

**Fix áp dụng** (`src/styles/customer.css`):
```css
/* Trước */
.cart-footer {
  z-index: 50;
  padding: var(--space-sm) var(--space-md) calc(var(--space-sm) + env(safe-area-inset-bottom));
}

/* Sau */
.cart-footer {
  z-index: 100;
  padding: var(--space-md) var(--space-md) calc(var(--space-md) + env(safe-area-inset-bottom, 16px));
}
```

#### Bug #2 (Critical) — CartPage không phát hiện session bị reset

**Mô tả:** Khi Admin reset bàn, tab khách đang ở CartPage không hiển thị thông báo phiên kết thúc mà vẫn cho phép gửi đơn (lúc này không có sessionId hợp lệ → order thất bại thầm lặng).

**Fix áp dụng** (`src/pages/CartPage.tsx`):
```typescript
const sessionEndedButPageOpen = !activeSession && tableSessions.some(
  (s) => s.tableId === tableId && s.status === 'CLOSED'
);

if (sessionEndedButPageOpen) {
  return (
    <div className="app-shell">
      <div className="session-ended-banner">
        <div>🔔</div>
        <div>Phiên bàn đã kết thúc</div>
        <button onClick={() => navigate('/')}>Về trang chủ</button>
      </div>
    </div>
  );
}
```

#### Improvement #1 — Category tabs từ filter sang navigation

**Mô tả:** Khi bấm một danh mục, các danh mục khác bị ẩn, UX không tự nhiên. Người dùng muốn thấy tất cả món nhưng nhảy nhanh đến section mong muốn.

**Fix áp dụng** (`src/pages/MenuPage.tsx`):
- Bỏ filter theo category — luôn hiển thị tất cả section
- Thêm `sectionRefs` (useRef) gắn vào từng section
- `handleCategoryClick()` → `window.scrollTo()` đến đúng section
- Thêm `IntersectionObserver` → tự highlight tab khi cuộn tay

### 5.3 Kết Quả UAT Cuối Cùng

| Scenario | Kết quả | Ghi chú |
|----------|---------|---------|
| **S1: Happy Path** — Vào menu → Chọn món → Gửi đơn → Tracking | ✅ PASS | Redirect tracking hoạt động |
| **S2: Multi-item** — Thêm nhiều món, tùy chọn, ghi chú | ✅ PASS | |
| **S3: Sold-out** — Gửi đơn có món hết → báo lỗi | ✅ PASS | |
| **S4: KDS Flow** — Bếp nhận đơn, cập nhật trạng thái | ✅ PASS | |
| **S5: Admin Reset** — Reset bàn → tab khách hiện "Phiên kết thúc" | ✅ PASS | |
| **S6: Invalid QR** — Vào URL không hợp lệ → thông báo lỗi | ✅ PASS | |
| **S7: Order Again** — Gọi thêm món trong cùng phiên | ✅ PASS | |

**Verdict: ✅ GO — Sẵn sàng demo**

---

## 6. Cấu Trúc Thư Mục

```
All_Food/
├── docs_prototype/
│   ├── 02_quy_trinh_nghiep_vu_thong_nhat.md
│   ├── 06_data_model_api_spec.md
│   ├── 11_prototype_uat_qa_ai_review_checklist.md
│   └── 12_prototype_build_report.md         ← File này
│
├── docs_ui_vibecode/
│   ├── 01_ui_design_brief.md
│   ├── 03_screen_inventory_va_user_flow.md
│   ├── 05_component_va_design_system_spec.md
│   └── 06_demo_script_va_acceptance_ui.md
│
└── web-prototype-react/
    ├── index.html
    ├── vite.config.ts
    ├── package.json
    └── src/
        ├── main.tsx                  ← Entry point, CSS imports
        ├── App.tsx                   ← Route definitions
        ├── constants.ts              ← PIN, status labels, brand config
        │
        ├── types/
        │   └── index.ts              ← TypeScript interfaces
        │
        ├── data/
        │   └── seedData.ts           ← 18 món ăn, 5 danh mục, 5 bàn
        │
        ├── store/
        │   └── useStore.ts           ← Zustand global store
        │
        ├── hooks/
        │   └── useClientSession.ts  ← Cart hook (per-tab sessionStorage)
        │
        ├── components/
        │   ├── Toast.tsx             ← Toast notifications + formatPrice
        │   ├── PINGate.tsx           ← PIN protection wrapper
        │   └── ItemDetailSheet.tsx  ← Bottom sheet chọn option & thêm giỏ
        │
        ├── pages/
        │   ├── MenuPage.tsx          ← Menu + category anchor navigation
        │   ├── CartPage.tsx          ← Giỏ hàng + session check
        │   ├── TrackingPage.tsx      ← Theo dõi đơn hàng
        │   ├── KDSPage.tsx           ← Kitchen Display System
        │   ├── AdminLayout.tsx       ← Admin wrapper + sidebar
        │   ├── AdminDashboardPage.tsx
        │   ├── AdminMenuPage.tsx
        │   └── AdminTablesPage.tsx
        │
        └── styles/
            ├── tokens.css            ← CSS design tokens
            ├── global.css            ← Reset + shared utilities
            ├── customer.css          ← Mobile customer interface
            ├── kds.css               ← Dark-mode KDS board
            └── admin.css             ← Admin desktop layout
```

---

## 7. Hướng Dẫn Sử Dụng Prototype

### Khởi động

```bash
cd web-prototype-react
npm run dev
# Server chạy tại http://localhost:5173
# (Nếu port 5173 đã bận → tự động dùng 5174)
```

### URL truy cập

| Vai trò | URL | Mật khẩu |
|---------|-----|-----------|
| Khách hàng — Bàn 01 | `http://localhost:5173/qr/table-01` | Không cần |
| Khách hàng — Bàn 02 | `http://localhost:5173/qr/table-02` | Không cần |
| Khách hàng — Bàn 03 | `http://localhost:5173/qr/table-03` | Không cần |
| Khách hàng — Bàn 04 | `http://localhost:5173/qr/table-04` | Không cần |
| Khách hàng — Bàn 05 | `http://localhost:5173/qr/table-05` | Không cần |
| Admin (Chủ quán) | `http://localhost:5173/admin` | PIN: **1234** |
| KDS (Nhân viên bếp) | `http://localhost:5173/kds` | PIN: **5678** |

### Kịch bản demo 3 tab (khuyến nghị)

```
Tab 1 — Khách hàng (mobile viewport):
  → http://localhost:5173/qr/table-05
  1. Duyệt menu, bấm vào món để xem chi tiết
  2. Chọn tùy chọn (nếu có), thêm vào giỏ
  3. Bấm thanh giỏ hàng đỏ ở dưới → vào CartPage
  4. Bấm "Gửi order cho quán"
  5. Tự chuyển sang trang tracking

Tab 2 — KDS (màn hình bếp):
  → http://localhost:5173/kds (PIN: 5678)
  1. Thấy đơn mới xuất hiện tức thì
  2. Bấm "Bắt đầu làm" → trạng thái PREPARING
  3. Bấm "Sẵn sàng phục vụ" → trạng thái READY
  (Tab 1 tự cập nhật timeline)

Tab 3 — Admin (quản lý):
  → http://localhost:5173/admin/tables (PIN: 1234)
  1. Xem trạng thái các bàn
  2. Reset bàn khi khách về
  (Tab 1 tự hiện "Phiên đã kết thúc")
```

---

## 8. Giới Hạn Của Prototype

> Các giới hạn dưới đây là **đã chấp nhận cho bản demo**, không phải bug.

| Giới hạn | Mô tả | Giải pháp cho production |
|----------|-------|--------------------------|
| **Sync chỉ trong cùng browser** | localStorage events chỉ hoạt động trong cùng browser profile / multi-tab | Cần WebSocket hoặc SSE từ backend thực |
| **Không có backend** | Dữ liệu mất khi xóa browser data hoặc mở incognito tab khác | PostgreSQL + REST API |
| **PIN cứng trong code** | Admin: 1234, KDS: 5678 — hardcoded | JWT auth + role-based access |
| **Không có thanh toán** | Chưa tích hợp cổng thanh toán | VNPay / Momo / ZaloPay |
| **Admin UI không tối ưu mobile** | Sidebar layout phù hợp tablet/desktop | Responsive admin hoặc app riêng |
| **Ảnh từ nguồn ngoài** | Một số ảnh có thể không load nếu nguồn offline | Self-hosted / CDN |
| **Không có in hoá đơn** | Chưa kết nối máy in nhiệt | Tích hợp printer API |

---

## 9. Lộ Trình Phát Triển Tiếp Theo

### Phase 1 — MVP Production (Ưu tiên cao)

**Mục tiêu:** Triển khai thực tế cho 1 quán pilot

- [ ] **Backend API** — Node.js/FastAPI hoặc Supabase
  - REST endpoints: Menu, Tables, Sessions, Orders
  - WebSocket / SSE cho real-time KDS
  - Database: PostgreSQL theo ERD đã thiết kế
- [ ] **Authentication thực**
  - Admin: JWT + refresh token
  - KDS: Device PIN động, đổi theo ca
- [ ] **QR Code generation**
  - Tạo QR PDF theo từng bàn (có thể in)
  - URL trỏ về domain production
- [ ] **Deployment**
  - Frontend: Vercel hoặc Netlify
  - Backend: Railway / Render / VPS
  - Database: Supabase / PlanetScale / Neon

### Phase 2 — Tính Năng Nâng Cao (Ưu tiên trung)

- [ ] Thanh toán online (VNPay, Momo, ZaloPay)
- [ ] Web Push Notification khi đơn sẵn sàng
- [ ] In hoá đơn tự động (máy in nhiệt)
- [ ] Admin báo cáo doanh thu (ngày/tuần/tháng)
- [ ] Quản lý tồn kho nguyên liệu cơ bản
- [ ] Lịch sử đơn hàng của khách (optional login)

### Phase 3 — Mở Rộng (Tương lai)

- [ ] Multi-restaurant (một tài khoản, nhiều cơ sở)
- [ ] Loyalty Program — tích điểm khách thân thiết
- [ ] App mobile native (React Native) cho KDS và Admin
- [ ] AI upsell — gợi ý món theo lịch sử
- [ ] Review & Rating sau bữa ăn
- [ ] Tích hợp POS hiện có

---

*Tài liệu này được tạo tự động sau khi hoàn thành giai đoạn UAT & Bug Fix.*  
*Cập nhật lần cuối: 16/04/2026*
