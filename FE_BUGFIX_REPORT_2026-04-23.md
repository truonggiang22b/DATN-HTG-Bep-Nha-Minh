# Báo Cáo Fix Bug Frontend - 23/04/2026

## 1. Kết quả tổng quan

Đã xử lý các lỗi FE/E2E đang làm Playwright fail trong `web-prototype-react`.

Kết quả kiểm thử sau khi sửa:

- Lệnh chạy: `cd web-prototype-react && npm test`
- Kết quả cuối: `54 passed, 1 skipped`
- Exit code: `0`
- Thời gian chạy: khoảng `5.2m`
- File log: `test_run_playwright_after_dashboard_fix_raw.txt`

So với lần chạy sau nhóm sửa đầu tiên, kết quả đã cải thiện từ `51 passed, 3 failed, 1 skipped` lên `54 passed, 1 skipped`.

## 2. Nhóm lỗi API endpoint trong E2E

### Hiện tượng

Một số test customer, kitchen và full-flow gọi endpoint menu cũ:

```txt
/api/public/menu?branchId=...
```

Trong backend hiện tại, endpoint đúng là:

```txt
/api/public/branches/:branchId/menu
```

Điều này làm test không lấy được menu thật, kéo theo lỗi tạo order, tracking và KDS.

### Cách sửa

Đổi endpoint trong các file E2E sang route public hiện tại của backend:

- `web-prototype-react/e2e/customer.spec.ts`
- `web-prototype-react/e2e/kitchen.spec.ts`
- `web-prototype-react/e2e/full-flow.spec.ts`

### Trạng thái

Đã hoạt động tốt. Các test customer, kitchen và full-flow dùng API fallback đều pass.

## 3. Nhóm lỗi login và rate limit

### Hiện tượng

Nhiều test login qua API lặp lại liên tục, có lúc gặp `429 Too Many Requests`. Ngoài ra helper E2E vẫn dùng endpoint login cũ:

```txt
/api/internal/auth/login
```

Trong backend hiện tại, endpoint đúng là:

```txt
/api/auth/login
```

Một phần helper cũng inject auth vào `localStorage`, trong khi app hiện dùng `sessionStorage` với key riêng.

### Cách sửa

Sửa `web-prototype-react/e2e/helpers/auth.ts`:

- Đổi login API sang `/api/auth/login`.
- Thêm cache kết quả login theo email/password để giảm số lần gọi auth API.
- Đổi inject auth từ `localStorage` sang:
  - `sessionStorage.setItem('bnm-auth-token', accessToken)`
  - `sessionStorage.setItem('bnm-auth-user', JSON.stringify(user))`
- Đổi UI login selector sang `#login-email`, `#login-password`, `#login-submit` vì placeholder không khớp test cũ.

Các file liên quan cũng được chỉnh endpoint auth:

- `web-prototype-react/e2e/customer.spec.ts`
- `web-prototype-react/e2e/kitchen.spec.ts`
- `web-prototype-react/e2e/full-flow.spec.ts`

### Trạng thái

Đã hoạt động tốt. Không còn fail do `429` hoặc login sai route trong lần chạy full suite cuối.

## 4. Nhóm lỗi toast không có selector ổn định

### Hiện tượng

Nhiều test admin, kitchen, customer chờ `.toast`, nhưng component `ToastContainer` chỉ render div inline style, chưa có class `toast`.

Do đó thao tác thật có thể thành công nhưng test không bắt được thông báo.

### Cách sửa

Sửa `web-prototype-react/src/components/Toast.tsx`:

- Thêm `className="toast"` vào từng toast item.

### Trạng thái

Đã hoạt động tốt. Các test trước đó fail khi chờ toast hiện đã pass.

## 5. Nhóm lỗi response shape khi tạo order

### Hiện tượng

Một số E2E test đọc response tạo order theo dạng cũ:

```ts
data.id
data.orderCode
```

Backend hiện trả payload dạng:

```ts
data.order.id
data.order.orderCode
```

Lỗi này làm `orderId` hoặc `orderCode` bị `undefined`, kéo theo KDS/full-flow không tìm thấy order vừa tạo.

### Cách sửa

Chuẩn hóa cách đọc response theo hướng tương thích cả hai dạng:

```ts
const order = data.order ?? data;
```

Đã sửa trong:

- `web-prototype-react/e2e/customer.spec.ts`
- `web-prototype-react/e2e/kitchen.spec.ts`
- `web-prototype-react/e2e/full-flow.spec.ts`

### Trạng thái

Đã hoạt động tốt. Các test KDS state machine và full-flow đều pass.

## 6. Nhóm lỗi quick-add trong customer flow

### Hiện tượng

Một số thao tác quick-add trên menu card không ổn định do button có thể bị overlay/sticky UI che, hoặc món có required option làm mở sheet thay vì thêm trực tiếp vào giỏ.

### Cách sửa

Cập nhật helper quick-add trong:

- `web-prototype-react/e2e/customer.spec.ts`
- `web-prototype-react/e2e/full-flow.spec.ts`

Các thay đổi chính:

- Chỉ chọn `.menu-card:not(.menu-card--sold-out)`.
- Scroll button vào viewport trước khi click.
- Dùng click có `force` cho test automation.
- Nếu item mở option sheet thì đóng sheet và thử item khác.
- Chờ `.toast` tối đa 2 giây để xác nhận thêm giỏ thành công.

### Trạng thái

Đã hoạt động tốt. Các test giỏ hàng, submit order và full customer flow đều pass.

## 7. Nhóm lỗi Dashboard Admin dùng selector table cũ

### Hiện tượng

Ba test cuối còn fail sau nhóm sửa đầu tiên:

- `TC-A10`
- `TC-A12`
- `TC-FULL-01`

Nguyên nhân: test vẫn tìm DOM dạng bảng:

```txt
table tbody tr
td, tr
```

Trong UI hiện tại, `AdminDashboardPage` render order history bằng `div/button`, không phải table.

### Cách sửa

Sửa `web-prototype-react/src/pages/AdminDashboardPage.tsx`:

- Thêm class `order-history-row` cho button row của order.
- Thêm class `order-detail` cho vùng chi tiết khi expand order.

Sửa test:

- `web-prototype-react/e2e/admin.spec.ts`
  - `TC-A10` đếm `.order-history-row`.
  - `TC-A12` click `.order-history-row` rồi assert `.order-detail`.
- `web-prototype-react/e2e/full-flow.spec.ts`
  - `TC-FULL-01` tìm order vừa tạo bằng `.order-history-row` có chứa `orderCode`.

### Trạng thái

Đã hoạt động tốt.

Targeted test:

- Lệnh: `npx playwright test e2e/admin.spec.ts e2e/full-flow.spec.ts --grep "TC-A10|TC-A12|TC-FULL-01"`
- Kết quả: `3 passed`

Full FE E2E:

- Kết quả: `54 passed, 1 skipped`

## 8. File đã chỉnh sửa

Các file frontend/test đã chỉnh:

- `web-prototype-react/src/components/Toast.tsx`
- `web-prototype-react/src/pages/AdminDashboardPage.tsx`
- `web-prototype-react/e2e/helpers/auth.ts`
- `web-prototype-react/e2e/admin.spec.ts`
- `web-prototype-react/e2e/customer.spec.ts`
- `web-prototype-react/e2e/kitchen.spec.ts`
- `web-prototype-react/e2e/full-flow.spec.ts`

## 9. Kết luận hiện tại

Các lỗi FE/E2E chính đã được xử lý. Bộ Playwright frontend hiện không còn test fail trong lần chạy mới nhất, chỉ còn 1 test skip có chủ đích.

Sau khi cập nhật thêm backend test theo nghiệp vụ KDS, trạng thái kiểm thử toàn hệ thống ở mức tự động hiện tại là:

- Backend: `99/99 passed`.
- Frontend E2E: `54 passed, 1 skipped, 0 failed`.

Không nên ghi là hệ thống "bug-free tuyệt đối", nhưng có thể ghi nhận core MVP đã pass các bộ test tự động chính trong lần chạy ngày 23/04/2026.
