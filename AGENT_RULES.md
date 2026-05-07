# AGENT_RULES.md — Luật bất biến cho tất cả AI Agent

> **⛔ KHÔNG ĐƯỢC VI PHẠM BẤT KỲ QUY TẮC NÀO DƯỚI ĐÂY.**
> Agent nào vi phạm sẽ bị dừng ngay lập tức và toàn bộ thay đổi sẽ bị revert.

*Cập nhật lần cuối: 2026-05-04*

---

## 📖 MỤC LỤC

1. [Kiến trúc dự án — PHẢI NẮM RÕ](#1-kiến-trúc-dự-án)
2. [Luật Git tuyệt đối cấm](#2-luật-git-tuyệt-đối-cấm)
3. [Quy trình Git đúng](#3-quy-trình-git-đúng)
4. [Luật CSS — CSS Scoping](#4-luật-css--css-scoping)
5. [Phạm vi được phép theo từng agent](#5-phạm-vi-được-phép)
6. [Checklist trước khi commit](#6-checklist-trước-khi-commit)
7. [Lịch sử lỗi — Không được lặp lại](#7-lịch-sử-lỗi)

---

## 1. Kiến trúc dự án

### 🗺️ Sơ đồ nhánh Git

```
main ──────────────────────────────────── PRODUCTION (Vercel + Railway)
  │                                       Chỉ owner mới được merge vào
  │
develop ──────────────────────────────── STAGING
  │                                       Team merge vào đây
  │
feature/phase2-integration-... ─────── Development
  │
feature/[tên-tính-năng] ────────────── Feature branch (tạo từ develop)
```

### 📦 Phân tầng môi trường

| Nhánh | Môi trường | Deploy ở đâu | Ai quyết định merge |
|---|---|---|---|
| `main` | **PRODUCTION** | Vercel (FE) + Railway (BE) | Owner ONLY |
| `develop` | **Staging** | — | Owner sau khi review |
| `feature/*` | **Local** | — | Agent + Owner review |

### 🗂️ Cấu trúc dự án

```
All_Food/
├── backend-api/          ← Node.js + Prisma (cổng 3001)
│   ├── src/modules/
│   │   ├── auth/         ← JWT + Refresh Token
│   │   ├── public/       ← QR menu + Online Orders
│   │   ├── internal/     ← Admin, KDS, Shipper
│   │   └── realtime/     ← SSE events
│   └── prisma/schema.prisma
│
└── web-prototype-react/  ← React + Vite (cổng 5174)
    └── src/
        ├── pages/        ← Tất cả trang (MenuPage, OnlineOrderPage...)
        ├── styles/       ← CSS toàn cục (customer.css)
        ├── services/     ← API clients
        └── store/        ← Zustand stores
```

### 🛣️ Route quan trọng — KHÔNG ĐƯỢC THAY ĐỔI

| Route | Trang | Giai đoạn | Trạng thái |
|---|---|---|---|
| `/qr/:tableId` | MenuPage | Phase 1 | ✅ Production đang dùng |
| `/cart` | CartPage | Phase 1 | ✅ Production đang dùng |
| `/order/:id/tracking` | TrackingPage | Phase 1 | ✅ Production đang dùng |
| `/admin/*` | AdminLayout | Phase 1 | ✅ Production đang dùng |
| `/kds` | KDSPage | Phase 1 | ✅ Production đang dùng |
| `/order-online` | OnlineLandingPage | Phase 2 | 🔧 Staging |
| `/order-online/menu` | OnlineOrderPage | Phase 2 | 🔧 Staging |
| `/shipper` | ShipperPage | Phase 2 | 🔧 Staging |

---

## 2. Luật Git tuyệt đối cấm

### ❌ LUẬT 1 — KHÔNG bao giờ push trực tiếp lên `main`

```bash
git push origin main          ← CẤM TUYỆT ĐỐI
git push new-origin main      ← CẤM TUYỆT ĐỐI
git merge ... main            ← CẤM TUYỆT ĐỐI
```

> `main` là Production. Chỉ owner mới được merge vào `main`, và phải thông báo rõ ràng trước.

### ❌ LUẬT 2 — KHÔNG tự ý deploy lên Vercel hoặc Railway

```bash
vercel deploy                 ← CẤM
npx vercel                    ← CẤM
railway up                    ← CẤM
```

> Mọi thao tác deploy phải được owner phê duyệt trước.

### ❌ LUẬT 3 — KHÔNG sửa `App.tsx` routing mà không có lý do rõ ràng

Đặc biệt hai dòng này là **BẤT KHẢ XÂM PHẠM**:
```tsx
<Route path="/" element={<Navigate to="/qr/qr-bnm-table-01" replace />} />
<Route path="*" element={<Navigate to="/qr/qr-bnm-table-01" replace />} />
```

> Phase 1 QR dine-in là hệ thống production đang hoạt động. Thay đổi redirect = phá vỡ production.

### ❌ LUẬT 4 — KHÔNG merge feature branch thẳng vào `main`

```
feature/* → develop → (review) → main   ← QUY TRÌNH ĐÚNG
feature/* → main                         ← CẤM
```

### ❌ LUẬT 5 — KHÔNG `git push --force` lên `develop` hoặc `main`

```bash
git push --force origin develop     ← CẤM
git push -f new-origin develop      ← CẤM
```

> Force push ghi đè lịch sử của người khác. Chỉ được dùng trên branch cá nhân (`feature/*`) và phải thông báo team.

### ❌ LUẬT 6 — KHÔNG commit trực tiếp lên `develop`

```bash
git checkout develop
git commit -m "..."             ← CẤM — phải làm qua PR
```

> Mọi thay đổi vào `develop` phải qua Pull Request để có review.

---

## 3. Quy trình Git đúng

### 🌿 Tạo feature branch mới

```bash
# Luôn tạo branch từ develop, KHÔNG từ main
git checkout develop
git pull new-origin develop
git checkout -b feature/[tên-tính-năng]-[YYYY-MM-DD]

# Ví dụ:
git checkout -b feature/phase3-loyalty-2026-05-10
```

### 💾 Commit convention

```
<type>(<scope>): <mô tả ngắn gọn>

Types:
  feat      - Thêm tính năng mới
  fix       - Sửa lỗi
  chore     - Dọn dẹp, cập nhật công cụ
  docs      - Cập nhật tài liệu
  style     - Sửa CSS, format (không thay đổi logic)
  refactor  - Cải tổ code không thêm feature, không fix bug
  test      - Thêm/sửa test
  security  - Sửa lỗi bảo mật
  perf      - Tối ưu hiệu suất

Scopes:
  (phase2)  - Tính năng Phase 2
  (css)     - Chỉ thay đổi CSS
  (api)     - Backend API
  (auth)    - Authentication
  (ui)      - Giao diện

Ví dụ hợp lệ:
  feat(phase2): add shipper location tracking
  fix(css): scope OnlineOrderPage classes with oop__ prefix
  chore: remove stale test log files
  docs: update API endpoint in README
```

### 🔄 Quy trình chuẩn từ code đến production

```
1. Tạo branch:     git checkout -b feature/...
2. Code + test:    Làm việc, kiểm tra local
3. Commit rõ:      git commit -m "feat(...): ..."
4. Push:           git push new-origin feature/...
5. Tạo PR:         GitHub → Pull Request → base: develop
6. Owner review:   Xem diff, test, nhận xét
7. Merge PR:       develop ← feature (squash or merge commit)
8. Staging test:   Test trên develop
9. Owner approve:  main ← develop (chỉ owner)
10. Production:    Auto-deploy Vercel + Railway
```

### 🚨 Khi gặp lỗi git push

```
LỖI: git push bị từ chối / xác thực thất bại
→ KHÔNG tự ý thử vercel deploy thay thế
→ KHÔNG hỏi owner đăng nhập GitHub hộ
→ BÁO CÁO lỗi cụ thể, chờ owner xử lý
```

### 🔁 Sync nhánh develop mới nhất trước khi làm việc

```bash
# Làm MỖI NGÀY khi bắt đầu làm việc
git fetch new-origin
git checkout develop
git merge new-origin/develop

# Rồi mới checkout feature branch
git checkout feature/...
git rebase develop   # hoặc git merge develop
```

---

## 4. Luật CSS — CSS Scoping

> **ĐÂY LÀ BÀI HỌC TỪ SỰ CỐ THỰC TẾ** (2026-05-04)

### 🔴 Vấn đề: CSS trong Vite là toàn cục

Vite bundle tất cả CSS từ mọi component vào **một file duy nhất**. Nếu hai trang dùng cùng tên class, file CSS load sau sẽ **ghi đè** file load trước, ảnh hưởng đến toàn bộ ứng dụng.

```
❌ NGUY HIỂM — Dùng cùng tên class ở 2 trang khác nhau:

customer.css (Phase 1):         .menu-card { display: flex; flex-direction: row; }
OnlineOrderPage.css (Phase 2):  .menu-card { flex-direction: column; }
                                             ↑ ghi đè Phase 1 → Phase 1 bị vỡ giao diện
```

### ✅ Quy tắc đặt tên CSS — BẮT BUỘC

**Mỗi trang/module PHẢI có prefix riêng cho tất cả class names:**

| Trang / Module | Prefix bắt buộc | Ví dụ |
|---|---|---|
| `OnlineOrderPage` | `oop__` | `.oop__menu-card`, `.oop__cart-sidebar` |
| `OnlineLandingPage` | `olp__` | `.olp__hero`, `.olp__cta-btn` |
| `OnlineTrackingPage` | `otp__` | `.otp__status-bar` |
| `ShipperPage` | `sp__` | `.sp__order-card` |
| `AdminDeliveryPage` | `adp__` | `.adp__map-view` |
| `KDSPage` | `kds__` | `.kds__ticket` |
| `LoginPage` | `lp__` | `.lp__form-card` |
| Phase 1 (customer.css) | *(không prefix)* | `.menu-card`, `.cart-bar` ← đừng đụng |

### ❌ TUYỆT ĐỐI KHÔNG dùng class name "trần" (không prefix) cho code Phase 2+

```css
/* ❌ SAI — dễ xung đột với Phase 1 */
.menu-card { ... }
.card { ... }
.btn { ... }
.price { ... }

/* ✅ ĐÚNG — có prefix module */
.oop__menu-card { ... }
.oop__btn-checkout { ... }
.oop__price { ... }
```

### ❌ TUYỆT ĐỐI KHÔNG sửa các file CSS của Phase 1

```
web-prototype-react/src/styles/customer.css   ← CẤM SỬA
web-prototype-react/src/styles/cart.css        ← CẤM SỬA (nếu có)
```

### 📋 Checklist CSS trước khi viết style mới

- [ ] Tôi đã kiểm tra `customer.css` chưa có class trùng tên?
- [ ] Tôi đã thêm prefix module (`oop__`, `olp__`...) cho tất cả class mới?
- [ ] Tôi đã kiểm tra trang Phase 1 (`/qr/qr-bnm-table-01`) không bị ảnh hưởng?

---

## 5. Phạm vi được phép

### 🟢 Agent có thể làm tự do (Low risk)

```
✅ Tạo file mới trong web-prototype-react/src/pages/ (phase 2+)
✅ Tạo file mới trong web-prototype-react/src/components/
✅ Sửa file CSS của chính mình (có prefix đúng)
✅ Thêm route MỚI vào App.tsx (không xóa route cũ)
✅ Sửa backend-api/src/modules/public/online-orders/ (Phase 2)
✅ Sửa backend-api/src/modules/realtime/
✅ Sửa backend-api/src/modules/internal/ (Phase 2)
✅ Thêm docs mới vào docs_prototype/
✅ Sửa web-prototype-react/src/pages/OnlineOrderPage.tsx
✅ Sửa web-prototype-react/src/pages/ShipperPage.tsx
✅ Sửa web-prototype-react/src/pages/AdminDeliveryPage.tsx
```

### 🟡 Cần thông báo owner trước khi làm (Medium risk)

```
⚠️ Sửa App.tsx (phải giải thích lý do + không xóa route Phase 1)
⚠️ Sửa vite.config.ts
⚠️ Sửa backend-api/prisma/schema.prisma (cần chạy migration)
⚠️ Sửa web-prototype-react/src/services/apiClient.ts
⚠️ Sửa web-prototype-react/src/store/useAuthStore.ts
⚠️ Thêm dependency mới vào package.json
⚠️ Sửa backend-api/src/modules/auth/
```

### 🔴 TUYỆT ĐỐI CẤM (High risk — Zero tolerance)

```
❌ Sửa web-prototype-react/src/styles/customer.css
❌ Sửa web-prototype-react/src/pages/MenuPage.tsx
❌ Sửa web-prototype-react/src/pages/CartPage.tsx
❌ Sửa web-prototype-react/src/pages/TrackingPage.tsx
❌ Push lên nhánh main
❌ Tự ý deploy (vercel/railway)
❌ Xóa route trong App.tsx
❌ Sửa backend-api/prisma/migrations/ (migration đã chạy)
```

---

## 6. Checklist trước khi commit

Trả lời tất cả câu hỏi này trước khi chạy `git commit`:

```
GIT:
  □ Tôi đang ở đúng nhánh (feature/* hoặc develop)?
  □ git status — không có file ngoài ý muốn?
  □ Commit message đúng format (<type>(<scope>): <mô tả>)?
  □ Tôi có đang cố push lên main không? → Nếu có: DỪNG LẠI

CSS:
  □ Tôi có dùng tên class mới không có prefix không? → Nếu có: DỪNG LẠI
  □ Tôi có sửa customer.css không? → Nếu có: DỪNG LẠI
  □ Tôi đã kiểm tra /qr/qr-bnm-table-01 vẫn hiển thị đúng?

ROUTING:
  □ Tôi có xóa route Phase 1 nào không? → Nếu có: DỪNG LẠI
  □ Tôi có sửa catch-all redirect không? → Nếu có: DỪNG LẠI

DEPLOY:
  □ Tôi không tự ý chạy vercel/railway deploy?
  □ Owner đã được thông báo về thay đổi này?
```

---

## 7. Lịch sử lỗi — Không được lặp lại

| Ngày | Lỗi | Nguyên nhân gốc | Hậu quả | Fix |
|---|---|---|---|---|
| 2026-04-26 | Merge Phase 2 → `main` trái phép | Không đọc rules | Production bị hỏng, phải revert | Thêm rule ❌ LUẬT 1 |
| 2026-04-27 | Design agent sửa `App.tsx` catch-all | Không đọc rules | Phase 1 QR dine-in vô hiệu hóa | Thêm rule ❌ LUẬT 3 |
| 2026-04-27 | Agent đề xuất `vercel deploy` khi push lỗi | Không đọc rules | Vi phạm quy trình deploy | Thêm rule ❌ LUẬT 2 |
| 2026-05-04 | `OnlineOrderPage.css` định nghĩa `.menu-card` ghi đè Phase 1 | Không dùng CSS prefix | Phase 1 QR menu bị đổi layout toàn bộ | Thêm Luật CSS Scoping (mục 4) |

---

## 8. Thông tin kỹ thuật cần biết

### 🔑 Ports local

| Service | Port | Lệnh khởi động |
|---|---|---|
| Backend API | `3001` | `cd backend-api && npm run dev` |
| Frontend Vite | `5174` | `cd web-prototype-react && npm run dev` |

### 🌐 Remote Git

```bash
git remote -v
# new-origin  https://github.com/truonggiang22b/DATN-HTG-Bep-Nha-Minh.git (fetch/push)
```

### 🗄️ Database

```
PostgreSQL (Railway)
DATABASE_URL → trong backend-api/.env (KHÔNG commit lên git)
Migration: cd backend-api && npx prisma migrate dev
```

### 🔐 Biến môi trường — KHÔNG commit lên git

```
backend-api/.env:
  DATABASE_URL=...
  JWT_SECRET=...
  REFRESH_KEY=...
  PORT=3001

web-prototype-react/.env (nếu có):
  VITE_API_URL=...
```

---

*File này được tạo: 2026-04-27. Cập nhật lần cuối: 2026-05-04.*
*Mọi agent khi bắt đầu làm việc PHẢI đọc file này trước tiên.*
