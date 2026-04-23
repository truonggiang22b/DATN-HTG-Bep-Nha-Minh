# 🐛 Báo Cáo Lỗi Kiểm Thử — Bếp Nhà Mình
> Ngày chạy: 2026-04-23  
> Người thực hiện: Antigravity AI Agent  
> Phạm vi: Backend (Vitest) + Frontend E2E (Playwright)

---

## 📊 Tổng quan kết quả

| Lớp Test | Framework | Files | Tests | Pass | Fail | Skip | Trạng thái |
|---|---|---|---|---|---|---|---|
| Backend Unit/Integration | Vitest + Supertest | 6 | 99 | 0 | 0 | 99 | ❌ Toàn bộ skip |
| Backend E2E (cũ — 2026-04-18) | Vitest | 1 | 10 | 2 | 8 | 0 | ❌ 8 fail |
| Frontend E2E Customer | Playwright | 1 | 15 | 2 | 13 | 0 | ❌ 13 fail |

> **Root cause chính:** Database credentials Supabase đã hết hạn/bị thay đổi sau quá trình rotate secrets. Mọi test cần kết nối DB đều không thể thực thi.

---

## 🔴 BLOCKER #1 — Database Credentials Hết Hạn (Crit)

### Mô tả
File `backend-api/.env` sử dụng `DATABASE_URL` trỏ đến Supabase project `umufftukrejijatimotz` với mật khẩu `doantotnghiep`. Credentials này đã bị reject bởi Supabase:

```
PrismaClientInitializationError: Authentication failed against database server.
Error Code: P1000
```

### Ảnh hưởng
- **Backend server:** Không khởi động được (`npm run dev` crash ngay khi connect DB)
- **Tất cả 6 test files:** Bị skip/fail hoàn toàn tại bước `beforeAll` (setup)
- **Playwright E2E:** Fail vì backend không phục vụ được dữ liệu thực

### File liên quan
- `backend-api/.env` — dòng 8: `DATABASE_URL`
- `backend-api/.env` — dòng 9: `DIRECT_URL`
- `backend-api/.env` — dòng 13: `SUPABASE_ANON_KEY`
- `backend-api/.env` — dòng 14: `SUPABASE_SERVICE_ROLE_KEY`

### Hành động cần thực hiện
1. Vào [Supabase Dashboard](https://app.supabase.com) → Project `umufftukrejijatimotz`
2. **Settings → Database → Reset database password** → Lấy mật khẩu mới
3. **Settings → API → Service Role Key** → Copy key mới
4. Cập nhật `backend-api/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:[NEW_PASSWORD]@db.umufftukrejijatimotz.supabase.co:5432/postgres?schema=public"
   DIRECT_URL="postgresql://postgres:[NEW_PASSWORD]@db.umufftukrejijatimotz.supabase.co:5432/postgres"
   SUPABASE_SERVICE_ROLE_KEY="[NEW_SERVICE_ROLE_KEY]"
   ```

---

## 🔴 BLOCKER #2 — Backend E2E: Order Creation Fail (từ test-results.txt cũ 2026-04-18)

> Ghi chú: Kết quả này lấy từ lần chạy cuối cùng khi DB còn hoạt động (2026-04-18). Đây là lỗi logic thực sự, độc lập với vấn đề credentials.

### Test: `e2e.test.ts` — 8/10 fail

#### ❌ TC3: "Should create a new order" 
- **Expected:** HTTP 201  
- **Actual:** HTTP 400  
- **Nguyên nhân khả năng:** `tableSessionId` hoặc `clientSessionId` không hợp lệ khi gửi POST `/api/public/orders`. Có thể test đang dùng session cũ đã bị đóng.

#### ❌ TC4: "Should handle idempotent order creation identically"
- **Expected:** HTTP 200  
- **Actual:** HTTP 400  
- **Phụ thuộc:** TC3 fail → không có `orderId` để test idempotency → cascade fail

#### ❌ TC5: "Should allow Kitchen to fetch active orders and see the new order"
- **Expected:** `orderId` defined  
- **Actual:** `undefined`  
- **Phụ thuộc:** TC3 fail → không có order nào được tạo

#### ❌ TC6: "Should allow Kitchen to transition status: NEW → PREPARING"
- **Expected:** HTTP 200  
- **Actual:** HTTP 400  
- **Phụ thuộc:** Cascade từ TC3/TC5

#### ❌ TC7: "Should block invalid status transitions (PREPARING → NEW)"
- **Expected:** error message chứa `'Không thể chuyển trạng thái'`  
- **Actual:** `'Dữ liệu không hợp lệ'`  
- **Nguyên nhân thực sự:** API trả về message validation chung thay vì message nghiệp vụ cụ thể. **Đây là bug độc lập** không do cascade.
- **File cần sửa:** Controller xử lý PATCH status transition → nên check transition rule trước validation zod

#### ❌ TC8: "Should allow Kitchen to transition status: PREPARING → READY → SERVED"
- **Expected:** HTTP 200  
- **Actual:** HTTP 400  
- **Phụ thuộc:** Cascade từ TC6

#### ❌ TC9: "Should prevent resetting table session if active orders exist"
- **Expected:** HTTP 409 (conflict — có order đang active)  
- **Actual:** HTTP 200  
- **Nguyên nhân thực sự:** **Bug nghiệp vụ quan trọng** — API cho phép reset table session ngay cả khi còn order đang `NEW` hoặc `PREPARING`. Vi phạm business rule BF-11.
- **File cần sửa:** `src/modules/tables/tables.controller.ts` → hàm `resetSession` → cần check `order.status IN ('NEW', 'PREPARING', 'READY')` trước khi cho phép reset

#### ❌ TC10: "Should allow Admin to reset session when all orders are SERVED/CANCELLED"
- **Expected:** `session.status` accessible  
- **Actual:** `Cannot read properties of undefined (reading 'status')`  
- **Phụ thuộc:** Cascade từ TC9

---

## 🟡 BLOCKER #3 — Frontend Playwright: 13/15 Customer Tests Fail

> Nguyên nhân gốc: Backend không có DB → toàn bộ API call từ frontend trả về lỗi hoặc timeout.

### Các test PASS (2/15):
- ✅ `TC-C02`: Truy cập QR token không hợp lệ → hiện thông báo lỗi
- ✅ `TC-C07`: Validation giỏ hàng — không chọn option bắt buộc → hiện lỗi

> Hai test này pass vì chúng kiểm tra **client-side validation** (frontend logic thuần), không cần gọi API.

### Các test FAIL (13/15):

#### Nhóm "Xem Menu" — 4 fail
| Test ID | Tên | Lỗi |
|---|---|---|
| TC-C01 | Truy cập menu qua QR token hợp lệ | `locator('.menu-section').first()` không tìm thấy — menu không load |
| TC-C03 | Lọc theo danh mục tab | Phụ thuộc TC-C01 |
| TC-C04 | Tìm kiếm món theo tên | Phụ thuộc TC-C01 |
| TC-C05 | Món SOLD_OUT — nút "+" bị disabled | Phụ thuộc TC-C01 |

**Root cause:** API `/api/public/qr/{token}` và `/api/public/menu` trả về lỗi do DB không hoạt động → frontend không render được `.menu-section`.

#### Nhóm "Giỏ Hàng" — 3 fail
| Test ID | Tên | Lỗi |
|---|---|---|
| TC-C06 | Item detail sheet mở khi bấm vào card món | Phụ thuộc TC-C01 (không có menu item để click) |
| TC-C08 | Thêm món vào giỏ qua quick-add button | Phụ thuộc TC-C01 |
| TC-C09 | Xem giỏ hàng có items | Phụ thuộc TC-C08 |

#### Nhóm "Điều chỉnh Giỏ Hàng" — 2 fail
| Test ID | Tên | Lỗi |
|---|---|---|
| TC-C10 | Tăng/giảm số lượng trong giỏ | Phụ thuộc TC-C08 |
| TC-C11 | Xóa item khỏi giỏ | Phụ thuộc TC-C08 |

#### Nhóm "Đặt Hàng & Tracking" — 4 fail
| Test ID | Tên | Lỗi |
|---|---|---|
| TC-C12 | Gửi đơn hàng → redirect tracking page | Phụ thuộc TC-C08 |
| TC-C13 | Tracking page — SERVED → ẩn nút Gọi thêm | `TypeError: Cannot read properties of undefined (reading 'branch')` |
| TC-C14 | Nút "Gọi thêm món" → quay lại menu | `locator('.menu-section').first()` không tìm thấy |
| TC-C15 | Tracking page — đơn CANCELLED hiện trạng thái hủy | `TypeError: Cannot read properties of undefined (reading 'branch')` |

**Bug riêng trong TC-C13 & TC-C15:** API `/api/public/qr/{token}` response không trả về field `data.branch` → test code bị crash tại `qrData.branch.id`. Cần kiểm tra:
- Backend controller có trả về `branch` object không?
- Test giả định response shape đúng không?

---

## 🟠 LỖI LOGIC ĐỘC LẬP (không phụ thuộc DB credentials)

### Bug L1 — Error message không đúng khi transition trạng thái sai (TC7)
- **Severity:** Medium  
- **File:** `src/modules/orders/orders.controller.ts` (hoặc service tương ứng)  
- **Mô tả:** Khi gửi transition không hợp lệ (ví dụ `PREPARING → NEW`), API trả về `"Dữ liệu không hợp lệ"` (validation error) thay vì `"Không thể chuyển trạng thái"` (business error).  
- **Fix:** Kiểm tra transition rule TRƯỚC khi validate input. Nếu transition invalid, trả về HTTP 422 với message nghiệp vụ cụ thể.

### Bug L2 — Cho phép reset table khi còn active orders (TC9) 🔴 Critical
- **Severity:** Critical  
- **File:** Likely `src/modules/tables/tables.controller.ts` hoặc `tables.service.ts`  
- **Mô tả:** API `POST /api/internal/tables/{tableId}/reset-session` trả về HTTP 200 ngay cả khi còn order ở trạng thái `NEW`, `PREPARING`, `READY`. Vi phạm nghiệp vụ — nhân viên có thể vô tình "reset bàn" khi khách vẫn đang chờ đồ.  
- **Fix cần thêm:**
  ```typescript
  const activeOrders = await prisma.order.count({
    where: { 
      tableSessionId: currentSession.id,
      status: { in: ['NEW', 'PREPARING', 'READY'] }
    }
  });
  if (activeOrders > 0) {
    return res.status(409).json({ 
      error: 'Không thể reset bàn khi còn đơn hàng đang xử lý' 
    });
  }
  ```

### Bug L3 — Response API thiếu field `branch` trong QR data (TC-C13, TC-C15)
- **Severity:** High  
- **File:** `src/modules/public/qr.controller.ts`  
- **Mô tả:** Test Playwright TC-C13 và TC-C15 giả định `qrData.branch.id` tồn tại trong response của `/api/public/qr/{token}`. Nếu field này thiếu, toàn bộ test flow cho order tracking bị crash.  
- **Cần kiểm tra:** Response schema của `GET /api/public/qr/:token` có trả về `{ data: { ..., branch: { id, name } } }` không. Đối chiếu với spec `docs_prototype/06_data_model_api_spec.md`.

---

## ✅ Kết Quả Các Test Pass (lần chạy cũ 2026-04-18)

| Test | Mô tả |
|---|---|
| ✅ E2E TC1 | Resolve QR code hợp lệ → 200 |
| ✅ E2E TC2 | Fetch menu theo branchId → 200 với dữ liệu đầy đủ |
| ✅ Frontend TC-C02 | QR token không hợp lệ → hiện thông báo lỗi phù hợp |
| ✅ Frontend TC-C07 | Validation không chọn option bắt buộc → hiện lỗi |

---

## 📋 Checklist Hành Động Ưu Tiên

### 🔴 Làm ngay (Blocking toàn bộ test)
- [ ] **[DB-1]** Vào Supabase Dashboard → Reset database password → Cập nhật `backend-api/.env`
- [ ] **[DB-2]** Lấy Service Role Key mới → Cập nhật `SUPABASE_SERVICE_ROLE_KEY` trong `.env`
- [ ] **[DB-3]** Chạy lại `npm run dev` để xác nhận backend khởi động thành công
- [ ] **[DB-4]** Chạy `npx prisma db push` hoặc `prisma migrate deploy` nếu schema chưa sync

### 🟠 Sau khi DB hoạt động
- [ ] **[L2]** Fix `POST /tables/{id}/reset-session` → check active orders trước khi reset (Bug L2 — Critical)
- [ ] **[L1]** Fix error message khi transition trạng thái không hợp lệ (Bug L1 — Medium)
- [ ] **[L3]** Kiểm tra response schema `/api/public/qr/:token` có đủ field `branch` không (Bug L3 — High)

### 🟡 Chạy lại CI khi xong
- [ ] **[TEST-1]** `cd backend-api && npm test` → Mục tiêu: 99 tests pass
- [ ] **[TEST-2]** `cd web-prototype-react && npm test` → Mục tiêu: 15 customer tests pass
- [ ] **[TEST-3]** Chạy full E2E: `npm run test:full`

---

## 📁 Artifacts Đã Generate

| File | Mô tả |
|---|---|
| `backend-api/test-results.txt` | Output raw từ lần chạy Vitest cuối (2026-04-18) |
| `web-prototype-react/test-results/` | Screenshots + videos của các test Playwright fail |
| `web-prototype-react/playwright-report/` | HTML report Playwright chi tiết |

---

*Report được tạo tự động bởi Antigravity AI Agent — 2026-04-23 06:41 (GMT+7)*
