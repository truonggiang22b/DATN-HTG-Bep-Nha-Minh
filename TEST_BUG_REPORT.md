# Báo Cáo Kiểm Thử Và Bugfix - Bếp Nhà Mình

> Ngày cập nhật: 23/04/2026  
> Phạm vi: Backend API, Frontend E2E, các lỗi test harness/implementation đã xử lý.  
> Lưu ý: file này thay thế snapshot cũ từng ghi Frontend E2E 7/55 pass, 47 fail.

## 1. Kết Quả Mới Nhất

| Test Suite | Framework | Tổng | Pass | Fail | Skip | Log kiểm chứng |
|---|---|---:|---:|---:|---:|---|
| Backend | Vitest + Supertest | 99 | 99 | 0 | 0 | `test_run_backend_after_kds_session_fix_raw.txt` |
| Frontend E2E | Playwright Chromium | 55 | 54 | 0 | 1 | `test_run_playwright_after_dashboard_fix_raw.txt` |

Kết luận: core MVP hiện không còn test fail tự động trong lần chạy mới nhất. Không ghi nhận "bug-free tuyệt đối", nhưng có thể dùng số liệu này làm bằng chứng ổn định cho demo/báo cáo GVHD.

## 2. Backend

Lệnh kiểm thử:

```bash
cd backend-api
npm test
```

Kết quả:

```text
Test files: 6 passed, total 6
Tests: 99 passed, total 99
```

Các điểm đã chuẩn hóa:

- `KDS-02`: cập nhật expectation theo nghiệp vụ KDS board. KDS hiển thị `NEW`, `PREPARING`, `READY` và `SERVED` trong ngày hiện tại; không hiển thị `CANCELLED`.
- `SESSION-06`: sửa dữ liệu test để chọn món `ACTIVE` không có required option, tránh fail giả `400 INVALID_OPTION` khi test tạo order mới sau reset session.

## 3. Frontend E2E

Lệnh kiểm thử:

```bash
cd web-prototype-react
npm test
```

Kết quả:

```text
54 passed
1 skipped
0 failed
```

Các nhóm lỗi đã sửa:

- Auth helper gọi sai endpoint `/api/internal/auth/login`; đã đổi sang `/api/auth/login`.
- Login bị rate limit khi chạy nhiều test; đã cache token theo email/password.
- E2E inject auth sai storage; đã dùng `sessionStorage` với key thật của app.
- Test gọi menu bằng endpoint cũ `/api/public/menu?branchId=...`; đã đổi sang `/api/public/branches/:branchId/menu`.
- Toast component thiếu class `.toast`; đã thêm selector ổn định cho Playwright.
- Test đọc sai response shape tạo order; đã hỗ trợ `data.order ?? data`.
- Quick-add customer flow không ổn định; đã scroll/click ổn định hơn và bỏ qua món sold out/required option.
- Dashboard Admin dùng selector table cũ; đã thêm `.order-history-row`, `.order-detail` và cập nhật test theo DOM thật.

## 4. Trạng Thái Còn Lại

- Còn 1 Playwright test skip có điều kiện, không phải fail.
- Cần giữ dữ liệu seed/demo ổn định trước buổi báo cáo.
- Cần tránh sửa UI/API mà không cập nhật E2E helper tương ứng.
- Cần bảo mật `.env` thật, chỉ dùng `.env.example` và `.env.production.example` trong tài liệu.
