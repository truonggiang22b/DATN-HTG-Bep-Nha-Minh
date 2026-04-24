# Phân Tích Gap: Quản Lý Tài Khoản & Mở Rộng Multi-Tenant

> **Ngày:** 24/04/2026  
> **Phạm vi:** Phân tích điểm chưa hoàn thiện trong quản lý tài khoản và định hướng nâng cấp  
> **Liên quan đến:** `BAO_CAO_GVHD_CHI_TIET.md` — Mục 9.2 Hướng Phát Triển

---

## 1. Vấn Đề Đặt Ra

Hiện tại, hệ thống **Bếp Nhà Mình** hỗ trợ multi-store ở tầng dữ liệu (DB schema có `Store`, `Branch`, `User`, `UserRole_Rel`) nhưng **chưa có luồng tự phục vụ** cho chủ quán mới đăng ký hoặc admin mời nhân viên vào hệ thống.

**Câu hỏi thực tế:** Nếu dự án muốn phục vụ nhiều chủ quán khác nhau, cách tạo tài khoản hiện tại có phù hợp không?

---

## 2. Hiện Trạng MVP

| Tác vụ | Cách làm hiện tại | Mức độ phù hợp |
|---|---|---|
| Tạo quán mới | Dev seed SQL thủ công | ❌ Không phù hợp cho sản phẩm thật |
| Tạo tài khoản admin | Supabase Dashboard + SQL Insert | ❌ Chỉ phù hợp cho demo/pilot |
| Mời nhân viên (KITCHEN/MANAGER) | Supabase Dashboard + SQL Insert | ❌ Quá phức tạp cho người dùng |
| Đặt lại mật khẩu | Supabase Auth có sẵn | ✅ Supabase tự xử lý |
| Phân quyền theo Store/Branch | Đã có trong DB schema | ✅ Nền tảng sẵn sàng |

**Kết luận:** MVP đang ở mức "internal tooling" — phù hợp để demo, không phù hợp để scale thành SaaS thực sự mà không có thêm phát triển.

---

## 3. Gap Cần Bổ Sung Để Trở Thành SaaS

### Gap 1 — Chưa có luồng Onboarding cho chủ quán mới

**Luồng cần có:**
```
Chủ quán vào /register
  → Điền: Tên quán, Email, Password
  → Backend tự động tạo:
      - Supabase Auth user
      - Bản ghi Store (tên quán)
      - Bản ghi Branch (chi nhánh mặc định)
      - Bản ghi User (liên kết với Supabase)
      - UserRole_Rel (gán role ADMIN)
  → Chuyển hướng về /admin
```

**Độ phức tạp:** Trung bình — cần 1 endpoint `POST /api/register` và 1 trang `/register` trên frontend.

---

### Gap 2 — Chưa có luồng Admin mời nhân viên

**Luồng cần có:**
```
Admin vào /admin/staff → Nhấn "+ Mời nhân viên"
  → Điền: Email, Tên hiển thị, Role (KITCHEN / MANAGER)
  → Backend:
      - Tạo Supabase Auth user (gửi email đặt mật khẩu)
      - Tạo bản ghi User + UserRole_Rel
      - Gắn với đúng Store/Branch của admin hiện tại
  → Nhân viên nhận email → đặt mật khẩu → đăng nhập được ngay
```

**Độ phức tạp:** Thấp-Trung — cần endpoint `POST /api/internal/staff` và form UI.

---

### Gap 3 — Chưa có Super Admin quản lý toàn hệ thống

Nếu là mô hình SaaS phục vụ nhiều quán, cần thêm role `SUPER_ADMIN` với dashboard riêng:
- Xem danh sách tất cả Store đang hoạt động.
- Suspend/activate Store.
- Xem metrics toàn hệ thống.

**Độ phức tạp:** Cao — cần phase riêng.

---

### Gap 4 — Chưa có Billing/Subscription

Mô hình SaaS cần tích hợp thanh toán subscription (ví dụ: gói Basic/Pro/Enterprise theo số bàn, số nhân viên). Nằm ngoài phạm vi đồ án.

---

## 4. So Sánh: MVP Demo vs. SaaS Thực Tế

| Tiêu chí | MVP Hiện Tại | SaaS Đầy Đủ |
|---|---|---|
| Tạo quán mới | Dev can thiệp thủ công | Self-service /register |
| Tạo nhân viên | Supabase Dashboard + SQL | Admin mời qua giao diện |
| Super admin | Không có | Dashboard quản lý toàn hệ thống |
| Multi-tenant isolation | Đã có ở DB (Store/Branch scope) | Cần kiểm tra RBAC ở mọi API |
| Billing | Không có | Stripe/VNPay subscription |
| Email giao tiếp | Supabase default | Tích hợp SMTP/SendGrid branded |

---

## 5. Đề Xuất Ưu Tiên Cho Phase Tiếp Theo

Nếu muốn nâng cấp dần, ưu tiên theo thứ tự:

| Thứ tự | Tính năng | Lý do ưu tiên |
|---|---|---|
| 1 | `POST /api/internal/staff` — Admin mời nhân viên | Giá trị cao, độ phức tạp thấp, có thể demo ngay |
| 2 | `POST /api/register` + `/register` page | Cho phép chủ quán tự onboard, không cần dev |
| 3 | Super Admin dashboard | Cần thiết khi scale, phức tạp hơn |
| 4 | Billing integration | Chỉ cần khi có kế hoạch kinh doanh |

---

## 6. Nhận Xét Cho Báo Cáo Giáo Viên

Phần này có thể được trình bày trong buổi bảo vệ như một **nhận thức rõ về giới hạn của MVP và hướng phát triển có cơ sở**:

> *"Hệ thống đã xây dựng nền tảng multi-tenant ở tầng dữ liệu. Tuy nhiên, để trở thành sản phẩm SaaS thực sự phục vụ nhiều chủ quán, cần bổ sung hai luồng quan trọng: tự đăng ký cho chủ quán mới và tính năng admin mời nhân viên từ giao diện. Đây là bước phát triển tự nhiên sau khi chốt MVP, không làm ảnh hưởng đến giá trị cốt lõi đã được chứng minh trong đồ án."*

Việc nhận ra gap này — thay vì bỏ qua — cho thấy sinh viên hiểu rõ ranh giới giữa **proof-of-concept** và **production-ready SaaS**, đây là điểm cộng trong đánh giá của hội đồng.

---

*File này bổ sung cho `BAO_CAO_GVHD_CHI_TIET.md` — Mục 9.2 Hướng Phát Triển.*
