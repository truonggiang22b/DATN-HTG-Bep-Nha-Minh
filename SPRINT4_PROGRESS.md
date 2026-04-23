# Sprint 4 — Frontend Integration: Tracking File
> File này được cập nhật **trước mỗi bước thực thi**. Đây là nguồn sự thật duy nhất để theo dõi tiến độ.
> 
> Cập nhật lần cuối: 2026-04-18 21:13

---

## 🎯 Mục tiêu Sprint
Thay thế toàn bộ mock data (Zustand/localStorage) bằng real API calls đến Backend MVP.  
Sau sprint: Flow **QR → Menu → Cart → Order → KDS → Tracking** chạy với database thật.

---

## 📋 Tổng quan tiến độ

| # | Bước | Mô tả | Trạng thái |
|---|------|--------|-----------|
| 1 | **Install deps** | Cài `axios`, `@tanstack/react-query` | ✅ Hoàn thành |
| 2 | **API Layer** | `apiClient.ts`, `publicApi.ts`, `internalApi.ts` | ✅ Hoàn thành |
| 3 | **Stores** | `useAuthStore.ts` mới, strip `useStore.ts` | ✅ Hoàn thành |
| 4 | **Types** | Thêm API response types vào `types/index.ts` | ✅ Hoàn thành |
| 5 | **App Shell** | `App.tsx` + `LoginPage.tsx` + `ProtectedRoute.tsx` | ✅ Hoàn thành |
| 6 | **MenuPage** | Dùng `useQuery` thay mock data | ✅ Hoàn thành |
| 7 | **CartPage** | Dùng `useMutation` để submit order thật | ✅ Hoàn thành |
| 8 | **TrackingPage** | Polling real order status | ✅ Hoàn thành |
| 9 | **KDSPage** | Polling + mutation thật, bỏ PIN gate | ✅ Hoàn thành |
| 10 | **AdminMenuPage** | CRUD thật qua API | ✅ Hoàn thành |
| 11 | **AdminTablesPage** | CRUD thật qua API | ✅ Hoàn thành |
| 12 | **AdminDashboardPage** | Order summary từ API | ✅ Hoàn thành |
| 13 | **Verify** | Test toàn bộ flow thủ công | 🔄 Đang chạy dev server |

**Ký hiệu:** ⬜ Chưa bắt đầu | 🔄 Đang thực hiện | ✅ Hoàn thành | ❌ Lỗi cần fix

---

## 📝 Chi tiết từng bước

---

### ✅ BƯỚC 1 — Install Dependencies
**Trạng thái:** ⬜ Chưa bắt đầu

**Sẽ làm:**
- Chạy `npm install axios @tanstack/react-query` trong `web-prototype-react/`

**Files bị ảnh hưởng:**
- `package.json` (thêm 2 dependencies)
- `package-lock.json` (tự cập nhật)

**Kết quả mong đợi:** Install thành công, không có peer dep conflict

---

### ✅ BƯỚC 2 — API Service Layer
**Trạng thái:** ⬜ Chưa bắt đầu

**Sẽ làm:**

**2a. `src/services/apiClient.ts`** *(file mới)*
- Tạo Axios instance với `baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'`
- Request interceptor: đính token từ sessionStorage → header `Authorization: Bearer ...`
- Response interceptor: bắt lỗi 401/403 → return structured error

**2b. `src/services/publicApi.ts`** *(file mới)*
- `resolveQR(qrToken)` → `GET /public/qr/:qrToken`
- `getMenu(branchId)` → `GET /public/branches/:branchId/menu`
- `submitOrder(payload)` → `POST /public/orders`
- `trackOrder(orderId, qrToken)` → `GET /public/orders/:orderId?qrToken=`

**2c. `src/services/internalApi.ts`** *(file mới)*
- Auth: `login()`, `logout()`, `getMe()`
- KDS: `getActiveOrders()`, `updateOrderStatus()`, `cancelOrder()`
- Admin: CRUD cho categories, menu items, tables, session reset

**Files tạo mới:**
- `src/services/apiClient.ts`
- `src/services/publicApi.ts`
- `src/services/internalApi.ts`

---

### ✅ BƯỚC 3 — Stores Refactor
**Trạng thái:** ⬜ Chưa bắt đầu

**Sẽ làm:**

**3a. `src/store/useAuthStore.ts`** *(file mới)*
```
State: { token, user: { id, email, role, branchId, storeId } }
Actions: login(email, pw) → gọi API → lưu token sessionStorage
         logout() → xóa token
         isAuthenticated → boolean
         hasRole(role) → boolean
```

**3b. `src/store/useStore.ts`** *(sửa – strip nặng)*
- XÓA: categories, menuItems, tables, tableSessions, orders, idempotencyKeys + toàn bộ CRUD actions
- GIỮ: toasts[], showToast(), dismissToast()
- Từ ~311 dòng →  ~50 dòng

**Files chỉnh sửa:**
- `src/store/useStore.ts` (strip xuống chỉ còn toast)
- `src/store/useAuthStore.ts` (tạo mới)

---

### ✅ BƯỚC 4 — Type Updates
**Trạng thái:** ⬜ Chưa bắt đầu

**Sẽ làm:**
- Thêm API response types vào `src/types/index.ts`
- Giữ nguyên tất cả types cũ (CartItem, SelectedOption, Toast, v.v.)
- Thêm: `QRResolveData`, `ApiCategory`, `ApiMenuItem`, `ApiOrder`, `TrackOrderData`, `AuthUser`

---

### ✅ BƯỚC 5 — App Shell & Auth
**Trạng thái:** ⬜ Chưa bắt đầu

**Sẽ làm:**

**5a. `src/App.tsx`** *(sửa)*
- Wrap toàn bộ với `QueryClientProvider`
- Đổi route `/qr/:tableCode` → `/qr/:qrToken`
- Thêm route `/login`
- Thêm `ProtectedRoute` cho `/kds` và `/admin`

**5b. `src/pages/LoginPage.tsx`** *(tạo mới)*
- Form email + password
- Gọi `useAuthStore.login()`
- Submit thành công → redirect về `/kds` hoặc `/admin` tùy role

**5c. `src/components/ProtectedRoute.tsx`** *(tạo mới)*
- Đọc token từ `useAuthStore`
- Nếu chưa login → `<Navigate to="/login" />`
- Nếu sai role → `<Navigate to="/login" />`

---

### ✅ BƯỚC 6 — MenuPage
**Trạng thái:** ⬜ Chưa bắt đầu

**Sẽ làm:**
- Nhận `qrToken` từ URL (không còn nhận `tableCode` prop)
- `useQuery` để resolve QR → lấy branchId, tableId, tableDisplay
- `useQuery` để fetch menu từ API
- Lưu context vào sessionStorage để CartPage dùng
- Loading state: skeleton cards
- Error state: "QR không hợp lệ" với UI đẹp
- XÓA: toàn bộ tham chiếu `useStore()` cho menu/table/session data

---

### ✅ BƯỚC 7 — CartPage
**Trạng thái:** ⬜ Chưa bắt đầu

**Sẽ làm:**
- `useMutation` → `publicApi.submitOrder()` thay vì `createOrder()` local
- Payload: `{ qrToken, clientSessionId, idempotencyKey, items }`
- Xử lý error responses từ server (409 SOLD_OUT, 400 validation)
- Xóa validate local (server đã check)
- `onSuccess` → `clearCart()` → navigate tracking

---

### ✅ BƯỚC 8 — TrackingPage
**Trạng thái:** ⬜ Chưa bắt đầu

**Sẽ làm:**
- `useQuery` với `refetchInterval: 3000` thay vì `forceUpdate` interval thủ công
- Lấy `qrToken` từ sessionStorage
- Xóa tham chiếu `useStore()` (tables, tableSessions, getOrderById)
- `lastUpdated` lấy từ `dataUpdatedAt` của React Query

---

### ✅ BƯỚC 9 — KDSPage
**Trạng thái:** ⬜ Chưa bắt đầu

**Sẽ làm:**
- XÓA `<PINGate>` wrapper (auth xử lý ở ProtectedRoute)
- `useQuery` active orders với `refetchInterval: 5000`
- `useMutation` updateStatus → `onSuccess: invalidate(['activeOrders'])`
- `useMutation` cancelOrder với confirm dialog
- Hiển thị tên bàn từ API response (không cần tra bảng tables local)

---

### ✅ BƯỚC 10 — AdminMenuPage
**Trạng thái:** ⬜ Chưa bắt đầu

**Sẽ làm:**
- `useQuery` categories + menu items từ API
- `useMutation` cho create/update category
- `useMutation` cho create/update/status menu item
- Xóa toàn bộ `useStore()` calls

---

### ✅ BƯỚC 11 — AdminTablesPage
**Trạng thái:** ⬜ Chưa bắt đầu

**Sẽ làm:**
- `useQuery` tables từ API (bao gồm `hasActiveSession`, `qrToken`)
- `useMutation` createTable, updateTable
- `useMutation` resetTableSession với confirm dialog + 409 handler

---

### ✅ BƯỚC 12 — AdminDashboardPage
**Trạng thái:** ⬜ Chưa bắt đầu

**Sẽ làm:**
- `useQuery` order history để tính stats (count by status)
- Hiển thị metrics thực tế từ DB

---

### ✅ BƯỚC 13 — Verification
**Trạng thái:** ⬜ Chưa bắt đầu

**Checklist verify:**
- [ ] `/qr/qr-bnm-table-01` load menu từ API
- [ ] Thêm món → submit → order xuất hiện trong DB
- [ ] KDS nhận đơn, chuyển trạng thái
- [ ] Tracking page cập nhật real-time (polling 3s)
- [ ] Admin login, tạo category mới → menu hiển thị ngay
- [ ] QR của bàn inactive → show lỗi
- [ ] Logout → không vào được /kds, /admin

---

## 🚨 Ghi chú kỹ thuật

| Mục | Quyết định |
|-----|-----------|
| Cart | Giữ nguyên `useCart` + sessionStorage — KHÔNG thay đổi |
| Token storage | `sessionStorage` (clear khi đóng tab, an toàn hơn localStorage) |
| API base URL | `VITE_API_URL` env var, fallback `http://localhost:3001/api` |
| QR URL format | Đổi từ `tableCode` (`table-05`) → `qrToken` (`qr-bnm-table-01`) |
| Polling KDS | Mỗi 5 giây (không dùng WebSocket trong sprint này) |
| Polling Tracking | Mỗi 3 giây |
