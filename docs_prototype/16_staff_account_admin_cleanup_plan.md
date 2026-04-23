# Plan Nghiệp Vụ - Quản Lý Tài Khoản Staff Và Dọn Dữ Liệu Admin

> Ngày tạo: 23/04/2026  
> Mục tiêu: chuẩn bị nghiệp vụ trước khi code phần tạo tài khoản cho chủ quán/nhân viên và bổ sung thao tác xóa/ẩn dữ liệu không còn dùng trong Admin.

## 1. Bối Cảnh

Hiện tại hệ thống đã có:

- Đăng nhập staff bằng Supabase Auth.
- Bảng `User`, `UserRole_Rel`.
- Role `ADMIN`, `MANAGER`, `KITCHEN`.
- `isActive` trên user.
- Admin quản lý menu, danh mục, bàn.
- Menu item có trạng thái `ACTIVE`, `SOLD_OUT`, `HIDDEN`.
- Category có trạng thái `ACTIVE`, `HIDDEN`.
- Dining table có trạng thái `ACTIVE`, `INACTIVE`.

Phần còn thiếu:

- Admin chưa có màn hình quản lý nhân viên.
- Chủ quán/nhân viên chưa có flow tự tạo tài khoản.
- Chưa có quy trình mời nhân viên, gán role, khóa/mở tài khoản.
- Admin menu chưa có nút "xóa" rõ ràng cho món/danh mục không còn dùng.
- Admin tables đã có tạo bàn, copy/mở QR và bật/tắt bàn, nhưng chưa có nghiệp vụ "xóa khỏi danh sách" rõ ràng cho bàn/QR không còn dùng.

## 2. Phạm Vi Đề Xuất

### 2.1 Làm trước

Ưu tiên code trong giai đoạn tiếp theo:

1. Admin tạo tài khoản nhân viên cho store/branch hiện tại.
2. Admin gán role cho nhân viên.
3. Admin khóa/mở tài khoản nhân viên.
4. Admin xem danh sách nhân viên.
5. Admin xóa mềm món không còn bán.
6. Admin xóa mềm danh mục không còn dùng.
7. Admin thêm bàn mới và xóa mềm/khóa bàn không còn dùng.
8. Admin quản lý QR URL của bàn ở mức copy/mở/regen có kiểm soát.

### 2.2 Làm sau

Để phase sau vì cần thiết kế onboarding tenant đầy đủ:

1. Chủ quán tự đăng ký quán mới.
2. Tạo store/branch tự động khi đăng ký.
3. Xác thực email, thanh toán gói dịch vụ, giới hạn số nhân viên.
4. Platform admin duyệt/tạm khóa store.

Lý do tách phase: hệ thống hiện đã multi-store ở mức data model, nhưng chưa có lớp "platform owner/onboarding". Nếu mở self-service signup quá sớm sẽ kéo thêm nhiều nghiệp vụ bảo mật và vận hành.

## 3. Actor Và Quyền

| Actor | Mô tả | Quyền chính |
|---|---|---|
| Chủ quán/Admin | Người quản trị cao nhất trong store | Quản lý menu, bàn, nhân viên, role, reset session |
| Manager | Quản lý ca/chi nhánh | Xem dashboard, xem lịch sử đơn, thao tác KDS, reset bàn, đổi trạng thái món |
| Kitchen | Bếp/quầy | Xem KDS, cập nhật trạng thái order |
| Platform Admin | Người vận hành SaaS | Phase sau, quản lý store/subscription |

## 4. Nghiệp Vụ Quản Lý Tài Khoản Staff

### 4.1 Luồng Admin tạo nhân viên

```text
Admin login
-> Admin / Nhân viên
-> Bấm "Thêm nhân viên"
-> Nhập tên, email, vai trò, chi nhánh mặc định
-> Hệ thống tạo Supabase Auth user
-> Hệ thống tạo User nội bộ
-> Hệ thống tạo UserRole_Rel
-> Nhân viên nhận mật khẩu tạm hoặc link đổi mật khẩu
-> Nhân viên login vào /login
```

### 4.2 Luồng khóa/mở tài khoản

```text
Admin vào danh sách nhân viên
-> Chọn nhân viên
-> Bấm "Khóa tài khoản"
-> Hệ thống set User.isActive = false
-> Auth middleware chặn login/session tiếp theo
```

Mở lại tài khoản:

```text
Admin chọn tài khoản đã khóa
-> Bấm "Mở lại"
-> Hệ thống set User.isActive = true
```

### 4.3 Luồng đổi role

```text
Admin chọn nhân viên
-> Sửa role
-> Lưu
-> Hệ thống cập nhật UserRole_Rel
-> Lần request tiếp theo token được map lại quyền từ DB
```

Rule quan trọng:

- Không cho admin tự hạ quyền chính mình nếu store chỉ còn 1 admin active.
- Không cho khóa admin cuối cùng của store.
- Email phải unique trong cùng store.
- Một user có thể có nhiều role, nhưng UI MVP nên chọn 1 role chính để đơn giản.
- Manager/Kitchen không được tạo hoặc khóa tài khoản.

## 5. Role Matrix Đề Xuất

| Chức năng | ADMIN | MANAGER | KITCHEN |
|---|---:|---:|---:|
| Login staff | Có | Có | Có |
| Xem KDS | Có | Có | Có |
| Cập nhật trạng thái order | Có | Có | Có |
| Xem dashboard/order history | Có | Có | Không |
| Reset phiên bàn | Có | Có | Không |
| Quản lý món/danh mục | Có | Có, giới hạn status | Không |
| Tạo/sửa/xóa mềm món | Có | Không hoặc giới hạn tùy quyết định |
| Đổi SOLD_OUT/ACTIVE | Có | Có |
| Quản lý bàn/QR | Có | Có, nếu cần | Không |
| Quản lý nhân viên | Có | Không | Không |

Khuyến nghị MVP: chỉ `ADMIN` được tạo/sửa/khóa nhân viên.

## 6. API Đề Xuất Cho Staff Management

Prefix: `/api/internal/users`

| Method | Endpoint | Role | Mục đích |
|---|---|---|---|
| GET | `/users` | ADMIN | Danh sách nhân viên trong store |
| POST | `/users` | ADMIN | Tạo nhân viên mới |
| PATCH | `/users/:id` | ADMIN | Sửa tên, branch, role |
| PATCH | `/users/:id/status` | ADMIN | Khóa/mở tài khoản |
| POST | `/users/:id/reset-password` | ADMIN | Gửi link reset hoặc set mật khẩu tạm |

Payload tạo nhân viên:

```json
{
  "displayName": "Nguyễn Văn Bếp",
  "email": "bep@example.com",
  "role": "KITCHEN",
  "defaultBranchId": "branch-id",
  "temporaryPassword": "Temp@123456"
}
```

Response:

```json
{
  "data": {
    "user": {
      "id": "user-id",
      "email": "bep@example.com",
      "displayName": "Nguyễn Văn Bếp",
      "isActive": true,
      "roles": ["KITCHEN"],
      "defaultBranchId": "branch-id"
    }
  }
}
```

## 7. UI Đề Xuất Cho Admin Staff

Route mới:

```text
/admin/staff
```

Màn hình gồm:

- Bảng danh sách nhân viên.
- Bộ lọc role: Tất cả / Admin / Manager / Kitchen.
- Bộ lọc trạng thái: Đang hoạt động / Đã khóa.
- Nút "Thêm nhân viên".
- Menu hành động từng dòng:
  - Sửa
  - Đổi role
  - Khóa/Mở lại
  - Reset mật khẩu

Không nên dùng chữ "Xóa tài khoản" ở MVP, vì tài khoản có liên quan lịch sử thao tác order/status. Dùng "Khóa tài khoản" sẽ an toàn hơn.

## 8. Nghiệp Vụ Xóa Mềm Món Và Danh Mục

### 8.1 Nguyên tắc

Không hard delete dữ liệu menu trong MVP nếu dữ liệu có thể liên quan đến order cũ.

Lý do:

- `OrderItem` đang tham chiếu `MenuItem`.
- Order đã lưu snapshot tên/giá, nhưng quan hệ vẫn tồn tại.
- Xóa cứng có thể gây lỗi báo cáo hoặc mất dấu lịch sử vận hành.

Vì vậy "Xóa" trên UI nên được hiểu là **xóa khỏi menu đang dùng**, thực hiện bằng soft delete:

- Menu item: set `status = HIDDEN`.
- Category: set `status = HIDDEN`.

### 8.2 Món ăn

Trạng thái:

| Trạng thái | Ý nghĩa | Khách thấy không | Admin thấy không |
|---|---|---:|---:|
| `ACTIVE` | Đang bán | Có | Có |
| `SOLD_OUT` | Tạm hết | Có nhưng disabled | Có |
| `HIDDEN` | Đã ẩn/xóa khỏi menu | Không | Có nếu bật filter "Đã ẩn" |

Luồng xóa món:

```text
Admin / Menu
-> Chọn món không còn bán
-> Bấm "Xóa khỏi menu"
-> Confirm
-> Backend set status = HIDDEN
-> Món biến mất khỏi menu khách
-> Admin có thể xem lại bằng filter "Đã ẩn"
```

Luồng khôi phục:

```text
Admin bật filter "Đã ẩn"
-> Chọn món
-> Bấm "Khôi phục"
-> Backend set status = ACTIVE
```

Tên nút khuyến nghị:

- Với món `ACTIVE`: "Tạm hết", "Ẩn", "Xóa khỏi menu".
- Với món `SOLD_OUT`: "Bán lại", "Xóa khỏi menu".
- Với món `HIDDEN`: "Khôi phục".

### 8.3 Danh mục

Danh mục nên xóa mềm bằng `status = HIDDEN`.

Quy tắc đề xuất:

1. Nếu danh mục còn món `ACTIVE` hoặc `SOLD_OUT`, khi admin bấm xóa cần hiển thị confirm rõ:

```text
Danh mục này còn món đang hiển thị. Bạn muốn ẩn cả danh mục và toàn bộ món bên trong không?
```

2. Nếu admin xác nhận:

- Category set `HIDDEN`.
- Tất cả menu items thuộc category set `HIDDEN`.

3. Nếu danh mục không còn món hiển thị:

- Chỉ set category `HIDDEN`.

4. Không hard delete category trong MVP.

Luồng khôi phục category:

```text
Admin bật filter "Danh mục đã ẩn"
-> Chọn danh mục
-> Bấm "Khôi phục"
-> Category set ACTIVE
-> Món bên trong vẫn giữ trạng thái hiện tại
```

Không tự động khôi phục toàn bộ món con để tránh bật nhầm món cũ.

## 9. API Đề Xuất Cho Xóa Mềm Menu

Có thể dùng API hiện tại trước:

```text
PATCH /api/internal/menu-items/:id/status
body: { "status": "HIDDEN" }

PATCH /api/internal/categories/:id
body: { "status": "HIDDEN" }
```

Để UI rõ nghiệp vụ hơn, có thể bổ sung endpoint alias:

| Method | Endpoint | Role | Mục đích |
|---|---|---|---|
| DELETE | `/menu-items/:id` | ADMIN | Xóa mềm món, thực chất set `HIDDEN` |
| PATCH | `/menu-items/:id/restore` | ADMIN | Khôi phục món về `ACTIVE` |
| DELETE | `/categories/:id` | ADMIN | Xóa mềm danh mục |
| PATCH | `/categories/:id/restore` | ADMIN | Khôi phục danh mục |

Khuyến nghị khi code nhanh: dùng API status hiện tại, chỉ đổi UI nút "Xóa khỏi menu" gọi status `HIDDEN`. Endpoint DELETE có thể làm sau để REST rõ hơn.

## 10. Thay Đổi UI Admin Menu Đề Xuất

Trong `/admin/menu`:

- Thêm filter rõ:
  - Đang bán
  - Tạm hết
  - Đã ẩn / đã xóa khỏi menu
- Thêm nút "Xóa khỏi menu" cho món `ACTIVE` và `SOLD_OUT`.
- Thêm nút "Khôi phục" cho món `HIDDEN`.
- Thêm confirm modal trước khi xóa mềm.
- Với category panel:
  - Thêm "Ẩn/Xóa danh mục".
  - Thêm "Khôi phục danh mục".
  - Nếu category còn món hiển thị, confirm ẩn cả món con.

Thông điệp UI nên tránh gây hiểu nhầm:

- Không dùng "Xóa vĩnh viễn" trong MVP.
- Dùng "Xóa khỏi menu" hoặc "Ẩn khỏi menu".
- Tooltip/confirm nói rõ: "Dữ liệu lịch sử order không bị xóa".

## 11. Nghiệp Vụ Quản Lý Bàn Và QR

### 11.1 Nguyên tắc

Bàn là dữ liệu vận hành có liên quan đến:

- QR token khách quét.
- Table session.
- Order history.
- Báo cáo theo bàn.

Vì vậy không hard delete bàn trong MVP. Thao tác "Xóa bàn" trên UI nên được hiểu là **xóa khỏi danh sách bàn đang sử dụng**, thực hiện bằng soft delete:

```text
DiningTable.status = INACTIVE
```

Bàn `INACTIVE`:

- Không resolve QR cho khách.
- Không cho tạo order mới.
- Vẫn giữ order history cũ.
- Vẫn có thể xem trong admin nếu bật filter "Ngừng sử dụng".
- Có thể khôi phục lại `ACTIVE`.

### 11.2 Luồng thêm bàn mới

Hiện hệ thống đã có API/UI tạo bàn. Nghiệp vụ cần chuẩn hóa lại như sau:

```text
Admin / Bàn & QR
-> Bấm "Thêm bàn"
-> Nhập mã bàn và tên hiển thị
-> Backend tạo DiningTable
-> Backend sinh qrToken duy nhất
-> UI hiển thị bàn mới trong danh sách
-> Admin copy/mở QR để in/dán lên bàn
```

Rule:

- `tableCode` unique trong cùng branch.
- `qrToken` unique toàn hệ thống.
- `displayName` có thể sửa sau.
- Bàn mới mặc định `ACTIVE`.

### 11.3 Luồng xóa mềm/khóa bàn

Tên nút UI khuyến nghị:

- "Xóa khỏi sơ đồ" hoặc "Ngừng sử dụng".
- Tránh dùng "Xóa vĩnh viễn".

Luồng:

```text
Admin chọn bàn
-> Bấm "Ngừng sử dụng"
-> Hệ thống kiểm tra bàn có active session/order đang xử lý không
-> Nếu không có: set status = INACTIVE
-> Nếu có: chặn và yêu cầu reset/hoàn tất order trước
```

Điều kiện chặn:

- Bàn có `TableSession.status = OPEN`.
- Bàn có order `NEW`, `PREPARING`, `READY`.

Thông báo gợi ý:

```text
Không thể ngừng sử dụng bàn này vì bàn còn phiên hoặc đơn đang xử lý. Hãy hoàn tất/hủy đơn và reset phiên trước.
```

### 11.4 Luồng khôi phục bàn

```text
Admin bật filter "Ngừng sử dụng"
-> Chọn bàn
-> Bấm "Bật lại"
-> Backend set status = ACTIVE
-> QR cũ hoạt động trở lại
```

Khuyến nghị: khôi phục dùng lại QR cũ để tránh phải in lại mã QR nếu không cần.

### 11.5 Quản lý QR

Trong MVP, QR nên có các thao tác:

- Copy QR URL.
- Mở QR URL để kiểm tra.
- Hiển thị token rút gọn.
- Export/in QR có thể để phase sau.

Không nên cho regenerate QR mặc định, vì nếu đã in QR dán trên bàn thì đổi token sẽ làm QR cũ chết. Nếu bổ sung regenerate QR, cần confirm mạnh:

```text
Đổi mã QR sẽ làm mã QR đã in trước đó không còn dùng được. Bạn chắc chắn muốn đổi?
```

Regenerate QR chỉ nên cho `ADMIN`.

## 12. API Đề Xuất Cho Bàn Và QR

API hiện tại có thể dùng ngay:

```text
GET /api/internal/tables
POST /api/internal/tables
PATCH /api/internal/tables/:id
POST /api/internal/tables/:id/reset-session
```

Bổ sung hoặc chuẩn hóa thêm:

| Method | Endpoint | Role | Mục đích |
|---|---|---|---|
| PATCH | `/tables/:id` | ADMIN | Sửa tên bàn hoặc set `ACTIVE/INACTIVE` |
| DELETE | `/tables/:id` | ADMIN | Alias xóa mềm, thực chất set `INACTIVE` |
| PATCH | `/tables/:id/restore` | ADMIN | Khôi phục bàn về `ACTIVE` |
| POST | `/tables/:id/regenerate-qr` | ADMIN | Phase sau, đổi QR token |

Khuyến nghị khi code nhanh: dùng `PATCH /tables/:id` với `status = INACTIVE`, đổi UI nút thành "Ngừng sử dụng" hoặc "Xóa khỏi danh sách".

## 13. Thay Đổi UI Admin Tables Đề Xuất

Trong `/admin/tables`:

- Giữ nút "Thêm bàn mới".
- Đổi nhãn "Tắt bàn" thành "Ngừng sử dụng" hoặc "Xóa khỏi danh sách".
- Giữ "Bật bàn" thành "Khôi phục".
- Thêm confirm trước khi ngừng sử dụng bàn.
- Thêm filter trạng thái:
  - Tất cả
  - Đang sử dụng
  - Ngừng sử dụng
- Với bàn `INACTIVE`, vẫn hiển thị QR token nhưng cảnh báo "QR không nhận order khi bàn ngừng sử dụng".
- Nếu có active session, disable nút ngừng sử dụng hoặc hiển thị confirm/chặn từ backend.

## 14. Acceptance Criteria

### Staff Management

| ID | Tiêu chí |
|---|---|
| STAFF-01 | Admin xem được danh sách nhân viên cùng store |
| STAFF-02 | Admin tạo được nhân viên mới với email, tên, role, branch |
| STAFF-03 | Nhân viên mới login được bằng tài khoản được tạo |
| STAFF-04 | Kitchen chỉ vào được KDS, không vào được Admin |
| STAFF-05 | Manager vào được KDS/dashboard/reset bàn theo quyền |
| STAFF-06 | Admin khóa tài khoản thì user không gọi được internal API |
| STAFF-07 | Không thể khóa admin cuối cùng của store |
| STAFF-08 | Không thể tạo email trùng trong cùng store |

### Admin Cleanup

| ID | Tiêu chí |
|---|---|
| CLEAN-01 | Admin bấm "Xóa khỏi menu" thì món chuyển `HIDDEN` |
| CLEAN-02 | Món `HIDDEN` không hiển thị ở menu khách |
| CLEAN-03 | Món `HIDDEN` vẫn xem được trong admin khi bật filter |
| CLEAN-04 | Admin khôi phục món `HIDDEN` về `ACTIVE` |
| CLEAN-05 | Xóa mềm category không làm mất order history |
| CLEAN-06 | Category còn món hiển thị phải có confirm trước khi ẩn cả nhóm |
| CLEAN-07 | Không hard delete menu item/category trong MVP |

### Table & QR Cleanup

| ID | Tiêu chí |
|---|---|
| TABLE-01 | Admin tạo được bàn mới với `tableCode`, `displayName`, QR token tự sinh |
| TABLE-02 | `tableCode` không được trùng trong cùng branch |
| TABLE-03 | Admin copy/mở được QR URL của từng bàn |
| TABLE-04 | Admin ngừng sử dụng bàn bằng cách set `INACTIVE`, không hard delete |
| TABLE-05 | QR của bàn `INACTIVE` không cho khách order |
| TABLE-06 | Bàn có phiên/đơn đang xử lý không được ngừng sử dụng |
| TABLE-07 | Admin khôi phục bàn `INACTIVE` về `ACTIVE` |
| TABLE-08 | Order history cũ của bàn không bị mất sau khi bàn bị ngừng sử dụng |

## 15. Thứ Tự Code Đề Xuất

### Sprint A - Admin Cleanup

Làm trước vì ít đụng auth và có giá trị ngay:

1. Cập nhật UI AdminMenuPage:
   - thêm nút "Xóa khỏi menu".
   - thêm confirm.
   - dùng status `HIDDEN`.
2. Bổ sung xử lý category hide/restore.
3. Cập nhật UI AdminTablesPage:
   - giữ thêm bàn.
   - đổi "Tắt bàn" thành "Ngừng sử dụng/Xóa khỏi danh sách".
   - thêm confirm và filter trạng thái.
   - dùng status `INACTIVE`.
4. Viết/điều chỉnh Playwright test cho menu/table cleanup.

### Sprint B - Staff Management API

1. Tạo module backend `internal/users`.
2. Dùng Supabase Admin API để tạo user auth.
3. Tạo record `User` và `UserRole_Rel`.
4. API list/update/status/reset password.
5. Backend tests cho RBAC và active/inactive user.

### Sprint C - Staff Management UI

1. Thêm route `/admin/staff`.
2. Thêm menu item trong sidebar Admin.
3. Bảng nhân viên + form tạo/sửa.
4. Test E2E:
   - admin tạo kitchen.
   - kitchen login vào KDS.
   - kitchen không vào được admin.
   - admin khóa user.

### Sprint D - Owner Self-Service Signup

Làm sau:

1. Public signup owner.
2. Tạo store/branch mặc định.
3. Tạo admin đầu tiên.
4. Email verification/payment nếu cần.

## 16. Rủi Ro Cần Chú Ý

| Rủi ro | Tác động | Giảm thiểu |
|---|---|---|
| Tạo user ở Supabase thành công nhưng DB nội bộ fail | Lệch auth/user profile | Dùng transaction DB và cleanup Supabase khi fail |
| Xóa cứng menu item làm hỏng order history | Mất dữ liệu báo cáo | MVP chỉ soft delete bằng `HIDDEN` |
| Xóa cứng bàn làm hỏng order/session history | Mất dữ liệu vận hành | MVP chỉ soft delete bằng `INACTIVE` |
| Regenerate QR làm QR đã in bị hỏng | Khách quét QR cũ không vào được | Chỉ cho ADMIN đổi QR, có confirm mạnh |
| Khóa admin cuối cùng | Store mất quyền quản trị | Chặn bằng rule backend |
| Role thay đổi nhưng token cũ còn sống | User giữ quyền cũ tạm thời | Middleware luôn load role từ DB theo Supabase user id |
| Email invite chưa cấu hình SMTP | Nhân viên không nhận mail | MVP dùng temporary password, phase sau dùng invite email |

## 17. Test Plan Tạm Thời

Phần này dùng để chuẩn bị trước khi viết test thật. Không tạo test executable ngay khi code chưa xong để tránh lệch selector, route, response shape. Sau khi code hoàn tất, dùng checklist này để viết Vitest backend và Playwright frontend.

### 17.1 Nguyên tắc viết test

- Backend test kiểm tra rule nghiệp vụ và response API.
- Frontend E2E test kiểm tra thao tác người dùng trên admin UI và ảnh hưởng sang customer/KDS.
- Không hard delete trong test; mọi thao tác xóa phải assert bằng trạng thái `HIDDEN` hoặc `INACTIVE`.
- Test phải tự tạo dữ liệu riêng nếu có thể, tránh phụ thuộc vào tên món/bàn seed cố định.
- Nếu cần dùng dữ liệu seed, phải chọn bằng API theo trạng thái phù hợp.

### 17.2 Backend test đề xuất

File dự kiến:

```text
backend-api/__tests__/admin_cleanup.test.ts
backend-api/__tests__/staff_users.test.ts
```

#### Admin Cleanup API

| Test ID | Mục tiêu | API chính | Expected |
|---|---|---|---|
| API-CLEAN-01 | Ẩn món bằng status `HIDDEN` | `PATCH /api/internal/menu-items/:id/status` | 200, item status `HIDDEN` |
| API-CLEAN-02 | Món `HIDDEN` không xuất hiện ở public menu | `GET /api/public/branches/:branchId/menu` | Không có item id đã ẩn |
| API-CLEAN-03 | Khôi phục món về `ACTIVE` | `PATCH /api/internal/menu-items/:id/status` | 200, item status `ACTIVE` |
| API-CLEAN-04 | Ẩn category | `PATCH /api/internal/categories/:id` | 200, category status `HIDDEN` |
| API-CLEAN-05 | Category `HIDDEN` không xuất hiện ở public menu | `GET /api/public/branches/:branchId/menu` | Không có category id đã ẩn |
| API-CLEAN-06 | Không cho KITCHEN ẩn món/category | internal menu/category APIs | 403 |
| API-CLEAN-07 | Không hard delete menu item/category | Prisma query sau hide | record vẫn tồn tại |

#### Table & QR API

| Test ID | Mục tiêu | API chính | Expected |
|---|---|---|---|
| API-TABLE-01 | Tạo bàn mới | `POST /api/internal/tables` | 201, có `qrToken`, status `ACTIVE` |
| API-TABLE-02 | Không cho trùng `tableCode` trong branch | `POST /api/internal/tables` | 400 hoặc conflict tùy implementation |
| API-TABLE-03 | Ngừng sử dụng bàn trống | `PATCH /api/internal/tables/:id` | 200, status `INACTIVE` |
| API-TABLE-04 | QR bàn `INACTIVE` không resolve cho customer | `GET /api/public/qr/:qrToken` | 404 hoặc error business phù hợp |
| API-TABLE-05 | Khôi phục bàn | `PATCH /api/internal/tables/:id` | 200, status `ACTIVE` |
| API-TABLE-06 | Không ngừng sử dụng bàn còn session/order active | `PATCH /api/internal/tables/:id` | 409 nếu backend bổ sung rule chặn |
| API-TABLE-07 | Order history không mất sau khi bàn `INACTIVE` | order history API | vẫn thấy order cũ |

#### Staff Management API

| Test ID | Mục tiêu | API chính | Expected |
|---|---|---|---|
| API-STAFF-01 | Admin list staff cùng store | `GET /api/internal/users` | 200, chỉ user trong store |
| API-STAFF-02 | Admin tạo kitchen user | `POST /api/internal/users` | 201, tạo Supabase auth user + User + role |
| API-STAFF-03 | Email trùng trong store bị chặn | `POST /api/internal/users` | 409 hoặc validation error |
| API-STAFF-04 | Kitchen không tạo được staff | `POST /api/internal/users` | 403 |
| API-STAFF-05 | Admin khóa staff | `PATCH /api/internal/users/:id/status` | 200, `isActive=false` |
| API-STAFF-06 | User bị khóa không gọi được internal API | bất kỳ internal API | 401/403 |
| API-STAFF-07 | Không khóa admin cuối cùng | status API | 409 |
| API-STAFF-08 | Đổi role staff | `PATCH /api/internal/users/:id` | role mới có hiệu lực |

### 17.3 Frontend E2E đề xuất

File dự kiến:

```text
web-prototype-react/e2e/admin-cleanup.spec.ts
web-prototype-react/e2e/admin-staff.spec.ts
```

#### Admin Cleanup UI

| Test ID | Luồng UI | Expected |
|---|---|---|
| E2E-CLEAN-01 | Admin vào `/admin/menu`, bấm "Xóa khỏi menu" trên một món active | Toast thành công, món chuyển vào filter "Đã ẩn" |
| E2E-CLEAN-02 | Khách mở QR/menu sau khi món bị ẩn | Món không còn hiển thị |
| E2E-CLEAN-03 | Admin filter "Đã ẩn", bấm "Khôi phục" | Món quay lại trạng thái `ACTIVE` |
| E2E-CLEAN-04 | Admin ẩn category có confirm | Category biến khỏi menu khách |
| E2E-CLEAN-05 | Admin khôi phục category | Category xuất hiện lại trong admin/public nếu có món active |

#### Table & QR UI

| Test ID | Luồng UI | Expected |
|---|---|---|
| E2E-TABLE-01 | Admin vào `/admin/tables`, bấm "Thêm bàn" | Bàn mới xuất hiện, có QR token |
| E2E-TABLE-02 | Admin copy QR URL | Toast/copy state hiển thị thành công |
| E2E-TABLE-03 | Admin ngừng sử dụng bàn trống | Bàn chuyển trạng thái `INACTIVE`/Ngừng sử dụng |
| E2E-TABLE-04 | Customer mở QR của bàn inactive | Hiện lỗi QR/bàn không khả dụng |
| E2E-TABLE-05 | Admin khôi phục bàn | QR hoạt động lại |
| E2E-TABLE-06 | Admin cố ngừng bàn còn phiên/order active | UI/backend chặn và hiển thị lỗi |

#### Staff UI

| Test ID | Luồng UI | Expected |
|---|---|---|
| E2E-STAFF-01 | Admin vào `/admin/staff` | Danh sách nhân viên hiển thị |
| E2E-STAFF-02 | Admin tạo kitchen user | User mới xuất hiện trong bảng |
| E2E-STAFF-03 | User kitchen mới login `/login` | Redirect vào `/kds` hoặc vào được `/kds` |
| E2E-STAFF-04 | Kitchen mới truy cập `/admin` | Bị redirect/chặn |
| E2E-STAFF-05 | Admin khóa kitchen user | User không gọi được KDS/internal API |
| E2E-STAFF-06 | Admin đổi role kitchen -> manager | User có quyền manager theo rule mới |

### 17.4 Smoke test thủ công sau khi code

Sau khi code xong và trước khi chạy full suite:

1. Mở `http://localhost:5173/login`.
2. Login admin.
3. Vào `/admin/menu`, ẩn một món, mở QR customer kiểm tra món biến mất.
4. Khôi phục món.
5. Vào `/admin/tables`, tạo bàn test, copy QR, mở QR.
6. Ngừng sử dụng bàn test, mở QR để kiểm tra lỗi.
7. Khôi phục bàn test.
8. Nếu staff management đã code, tạo kitchen test và login thử.

### 17.5 Điều kiện bắt đầu viết test thật

Chỉ viết test thật khi các thông tin sau đã ổn định:

- Text nút/action cuối cùng trên UI.
- Route frontend mới nếu có, ví dụ `/admin/staff`.
- API endpoint chính thức.
- Response shape backend.
- Selector/class ổn định cho table row, modal, toast.
- Rule chặn bàn active session/order đã được backend implement hay chỉ xử lý UI.

Khi agent code xong, bước tiếp theo là đọc diff, map lại test plan này với implementation thực tế, rồi viết test executable.

## 18. Kết Luận

Phần nên code trước là **Admin Cleanup cho menu/category/table** và **Staff Management cho store đã có**. Đây là phần sát nhu cầu triển khai thật nhưng vẫn nằm trong phạm vi kiểm soát.

Không nên mở ngay self-service signup cho chủ quán mới nếu chưa chuẩn bị onboarding store/branch, policy gói dịch vụ, email verification và quản trị tenant ở cấp platform.
