# Kế Hoạch Kiểm Thử Toàn Cục — Bếp Nhà Mình

> **Phiên bản:** 1.0 | **Ngày:** 29/04/2026  
> **Phạm vi:** Kiểm thử toàn diện hệ thống quản lý nhà hàng + đặt hàng online

---

## 1. Tổng quan hệ thống

### 1.1 Nghiệp vụ cốt lõi

| Nghiệp vụ | Mô tả |
|---|---|
| **Đặt hàng online** | Khách truy cập landing page → chọn món → thanh toán COD → theo dõi đơn |
| **KDS — Bếp** | Nhân viên bếp nhận đơn, chuyển trạng thái: Mới → Đang nấu → Sẵn sàng |
| **Giao hàng** | Shipper nhận đơn DELIVERING → xác nhận giao → DELIVERED |
| **Admin giám sát** | Theo dõi toàn bộ đơn theo trạng thái, không can thiệp trực tiếp |
| **Quản lý menu** | Admin CRUD món ăn, category, hình ảnh, giá |
| **Quản lý bàn** | Admin CRUD bàn, tạo QR code, theo dõi session |
| **Quản lý nhân viên** | Admin tạo/vô hiệu hóa tài khoản nhân viên theo vai trò |
| **Đặt hàng tại bàn** | Khách quét QR → chọn món → gọi lên bếp |

### 1.2 Luồng trạng thái đơn hàng

```
[Khách đặt]
PENDING → ACCEPTED (Admin/tự động)
        → PREPARING (KDS bấm "Đang nấu")
        → SERVED (KDS bấm "Hoàn thành")
        → DELIVERING (map tự động từ SERVED với đơn online)
        → DELIVERED (Shipper xác nhận)
        → CANCELLED (bất kỳ lúc nào trước DELIVERED)
```

### 1.3 Phân quyền vai trò

| Role | Quyền |
|---|---|
| `ADMIN` | Toàn quyền: menu, bàn, nhân viên, giám sát đơn |
| `MANAGER` | Tương tự ADMIN (không quản lý tài khoản) |
| `KITCHEN` | Chỉ xem và chuyển trạng thái đơn trong KDS |
| `Khách` | Không tài khoản: đặt hàng online, theo dõi qua link |
| `Shipper` | Dùng tài khoản ADMIN/MANAGER: truy cập `/shipper` |

---

## 2. Stack Công Nghệ

### 2.1 Backend
| Layer | Công nghệ |
|---|---|
| Runtime | Node.js 20 + TypeScript |
| Framework | Express.js |
| ORM | Prisma + PostgreSQL (Supabase) |
| Auth | Supabase Auth (JWT HS256, expiry 1h) |
| Validation | Zod |
| File upload | Multer + static serving |
| Hosting | Railway |
| Port | `3001` (local) |

### 2.2 Frontend
| Layer | Công nghệ |
|---|---|
| Framework | React 18 + Vite + TypeScript |
| Routing | React Router v6 |
| State | Zustand (persist localStorage) |
| Server State | TanStack Query (React Query v5) |
| HTTP | Axios |
| Styling | Vanilla CSS + CSS Variables (Design Tokens) |
| Font | Be Vietnam Pro + Sora (Google Fonts) |
| Hosting | Vercel |
| Port | `5176` (local) |

### 2.3 Domains & Endpoints

#### Public API (không cần auth)
| Endpoint | Nghiệp vụ |
|---|---|
| `GET /api/public/menu` | Lấy menu theo storeId |
| `POST /api/public/orders` | Tạo đơn hàng online |
| `GET /api/public/orders/:id` | Theo dõi trạng thái đơn |
| `GET /api/public/qr/:tableId` | Lấy thông tin bàn qua QR |

#### Internal API (cần Bearer JWT)
| Endpoint | Nghiệp vụ |
|---|---|
| `POST /api/auth/login` | Đăng nhập |
| `POST /api/auth/logout` | Đăng xuất |
| `GET /api/auth/me` | Lấy thông tin user hiện tại |
| `GET /api/internal/orders/active` | Đơn đang hoạt động |
| `GET /api/internal/orders/history` | Lịch sử đơn |
| `PATCH /api/internal/orders/:id/status` | Chuyển trạng thái đơn |
| `GET /api/internal/menu-items` | Danh sách món |
| `POST /api/internal/menu-items` | Tạo món mới |
| `PUT /api/internal/menu-items/:id` | Sửa món |
| `DELETE /api/internal/menu-items/:id` | Xóa món |
| `GET /api/internal/tables` | Danh sách bàn |
| `POST /api/internal/tables` | Tạo bàn |
| `GET /api/internal/users` | Danh sách nhân viên |
| `POST /api/internal/users` | Tạo tài khoản nhân viên |
| `PATCH /api/internal/users/:id` | Cập nhật nhân viên |
| `GET /api/internal/sessions` | Sessions bàn đang hoạt động |
| `POST /api/upload/image` | Upload hình ảnh món ăn |

#### Frontend Routes
| URL | Giao diện | Quyền |
|---|---|---|
| `/order-online` | Landing page khách hàng | Public |
| `/order-online/menu` | Menu đặt hàng | Public |
| `/order-online/cart` | Giỏ hàng + checkout | Public |
| `/order-online/track/:orderId` | Theo dõi đơn | Public |
| `/login` | Đăng nhập nhân viên | Public |
| `/admin` | Dashboard tổng quan | ADMIN/MANAGER |
| `/admin/delivery` | Giám sát giao hàng | ADMIN/MANAGER |
| `/admin/menu` | Quản lý menu | ADMIN/MANAGER |
| `/admin/tables` | Quản lý bàn | ADMIN/MANAGER |
| `/admin/staff` | Quản lý nhân viên | ADMIN |
| `/kds` | Màn hình bếp | KITCHEN |
| `/shipper` | Giao diện shipper | ADMIN/MANAGER |
| `/menu/:tableId` | Menu tại bàn (QR) | Public |

---

## 3. Kế Hoạch Kiểm Thử

---

### 3.1 BACKEND — Unit & Integration Test

**Công cụ đề xuất:** `Jest` + `Supertest`  
**Môi trường:** SQLite in-memory hoặc Supabase test project riêng

#### Domain: Authentication
| TC# | Test Case | Input | Expected |
|---|---|---|---|
| AUTH-01 | Login thành công | email + password hợp lệ | 200 + `accessToken` + `refreshToken` |
| AUTH-02 | Login sai password | password sai | 401 `INVALID_CREDENTIALS` |
| AUTH-03 | Login email không tồn tại | email giả | 401 |
| AUTH-04 | Gọi API nội bộ không có token | no Authorization header | 401 |
| AUTH-05 | Gọi API với token hết hạn | expired JWT | 401 `TOKEN_EXPIRED` |
| AUTH-06 | Gọi API với token giả mạo | random JWT string | 401 |
| AUTH-07 | Role KITCHEN truy cập `/users` | KITCHEN token | 403 `FORBIDDEN` |
| AUTH-08 | `GET /api/auth/me` trả đúng user | valid token | 200 + user object |

#### Domain: Orders (Public)
| TC# | Test Case | Input | Expected |
|---|---|---|---|
| ORD-01 | Tạo đơn hàng online hợp lệ | items + deliveryInfo đầy đủ | 201 + orderCode + PENDING |
| ORD-02 | Tạo đơn thiếu items | items = [] | 400 validation error |
| ORD-03 | Tạo đơn thiếu deliveryInfo | no address | 400 |
| ORD-04 | Tạo đơn với menuItemId không tồn tại | fake uuid | 400 hoặc 404 |
| ORD-05 | Theo dõi đơn theo ID | orderId hợp lệ | 200 + deliveryStatus |
| ORD-06 | Theo dõi đơn không tồn tại | random ID | 404 |
| ORD-07 | Theo dõi đơn của store khác | cross-tenant ID | 404 (tenant isolation) |

#### Domain: Orders (Internal — Admin/KDS)
| TC# | Test Case | Input | Expected |
|---|---|---|---|
| ORD-08 | Chuyển PENDING → ACCEPTED | ADMIN token | 200 + status updated |
| ORD-09 | Chuyển ACCEPTED → PREPARING | KITCHEN token | 200 |
| ORD-10 | Chuyển PREPARING → SERVED | KITCHEN token | 200 |
| ORD-11 | SERVED → auto DELIVERING (online order) | system mapping | deliveryStatus = DELIVERING |
| ORD-12 | Chuyển DELIVERING → DELIVERED | ADMIN/MANAGER token | 200 |
| ORD-13 | Chuyển ngược trạng thái (SERVED → PENDING) | invalid transition | 400 |
| ORD-14 | Hủy đơn đã DELIVERED | CANCELLED after DELIVERED | 400 |
| ORD-15 | List đơn active lọc đúng status | GET active | chỉ trả PENDING/ACCEPTED/PREPARING/SERVING |
| ORD-16 | Phân trang history đơn | pageSize=10&page=2 | đúng 10 records, có totalCount |

#### Domain: Menu Items
| TC# | Test Case | Input | Expected |
|---|---|---|---|
| MENU-01 | Tạo món mới với đầy đủ thông tin | POST + valid body | 201 + id |
| MENU-02 | Tạo món thiếu tên | name = "" | 400 |
| MENU-03 | Tạo món giá âm | price = -1 | 400 |
| MENU-04 | Cập nhật giá món | PATCH price | 200 + new price |
| MENU-05 | Xóa món đang có trong đơn active | DELETE | 409 hoặc soft-delete |
| MENU-06 | List menu public đúng storeId | GET /public/menu?storeId=X | chỉ trả món của store X |
| MENU-07 | Toggle isAvailable | PATCH isAvailable=false | 200, không hiện ở public menu |

#### Domain: Multi-tenant Isolation
| TC# | Test Case | Expected |
|---|---|---|
| TENANT-01 | Admin store A không xem được đơn store B | 403 hoặc empty |
| TENANT-02 | Kitchen store A không chuyển trạng thái đơn store B | 403 |
| TENANT-03 | Menu public chỉ trả đúng storeId | không lẫn data |

---

### 3.2 FRONTEND — Component & E2E Test

**Công cụ đề xuất:** `Playwright` (E2E) + `Vitest` (unit)

#### Luồng 1: Đặt hàng online (Happy Path)
| Bước | Hành động | Kiểm tra |
|---|---|---|
| E2E-01 | Mở `/order-online` | Landing page hiển thị đúng brand |
| E2E-02 | Bấm "Đặt hàng ngay" | Chuyển sang `/order-online/menu` |
| E2E-03 | Chọn 2–3 món, thêm vào giỏ | Cart badge cập nhật số lượng |
| E2E-04 | Bấm giỏ hàng → checkout | Form giao hàng hiện ra |
| E2E-05 | Điền thông tin: tên, SĐT, địa chỉ | Validation pass |
| E2E-06 | Bấm "Đặt hàng" | Nhận orderCode, redirect tracking |
| E2E-07 | Trang tracking hiển thị stepper | Bước 1 "Đã đặt" active |
| E2E-08 | Stepper đúng khi DELIVERED | 4/4 bước xanh đặc |

#### Luồng 2: Đăng nhập & phân quyền
| Bước | Hành động | Kiểm tra |
|---|---|---|
| E2E-09 | Mở `/login` | Form đăng nhập hiển thị |
| E2E-10 | Login admin đúng credentials | Redirect `/admin` |
| E2E-11 | Login sai password | Thông báo lỗi hiển thị |
| E2E-12 | Mở tab mới sau khi login | Không hỏi lại mật khẩu (localStorage persist) |
| E2E-13 | KITCHEN login → truy cập `/admin` | Redirect về `/kds` |
| E2E-14 | Không login → truy cập `/admin` | Redirect `/login` |
| E2E-15 | Bấm Đăng xuất | Token xóa, redirect `/login` |

#### Luồng 3: KDS
| Bước | Hành động | Kiểm tra |
|---|---|---|
| E2E-16 | Mở `/kds` với KITCHEN account | Danh sách đơn mới hiển thị |
| E2E-17 | Bấm "Đang nấu" trên đơn | Card chuyển sang PREPARING |
| E2E-18 | Bấm "Hoàn thành" | Card chuyển SERVED, biến khỏi queue active |
| E2E-19 | Polling 15s cập nhật đơn mới | Đơn mới xuất hiện không cần refresh |

#### Luồng 4: Admin Delivery Monitor
| Bước | Hành động | Kiểm tra |
|---|---|---|
| E2E-20 | Mở `/admin/delivery` | Timeline 4 bước hiển thị cho từng đơn |
| E2E-21 | Không có nút chuyển trạng thái | Chỉ read-only |
| E2E-22 | Tab lọc đúng status | Filter "Đang giao" chỉ hiện DELIVERING |
| E2E-23 | Trạng thái đồng bộ sau khi shipper confirm | Đơn chuyển Hoàn thành |

#### Luồng 5: Shipper
| Bước | Hành động | Kiểm tra |
|---|---|---|
| E2E-24 | Mở `/shipper` | Tab "Đang giao" hiển thị đơn DELIVERING |
| E2E-25 | Bấm "Xác nhận đã giao" | Confirm dialog → đơn biến khỏi danh sách |
| E2E-26 | Tab "Đã hoàn thành" | Đơn vừa giao xuất hiện với đúng ngày |
| E2E-27 | Filter ngày khác | Đơn thay đổi theo ngày chọn |
| E2E-28 | Summary strip đúng | Số đơn + tổng tiền khớp |

#### Luồng 6: Admin Menu Management
| Bước | Hành động | Kiểm tra |
|---|---|---|
| E2E-29 | Tạo món mới với hình ảnh | Món xuất hiện trong menu public |
| E2E-30 | Sửa giá món | Giá cập nhật trên menu khách |
| E2E-31 | Ẩn món (isAvailable=false) | Không hiện trên `/order-online/menu` |
| E2E-32 | Upload hình ảnh | Hình hiển thị đúng trong card |

---

### 3.3 KIỂM THỬ TÍCH HỢP (Integration) — Luồng end-to-end

**Kịch bản thực tế — Simulate một đơn hàng từ đầu đến cuối:**

```
[Tab 1] Khách đặt hàng (/order-online)
    ↓ Tạo đơn thành công → PENDING
[Tab 2] KDS nhận đơn (/kds)
    ↓ Bấm Đang nấu → PREPARING  
    ↓ Bấm Hoàn thành → SERVED → auto DELIVERING
[Tab 3] Shipper nhận (/shipper)
    ↓ Bấm Xác nhận đã giao → DELIVERED
[Tab 4] Admin giám sát (/admin/delivery)
    → Stepper "Hoàn thành" màu xanh
[Tab 1] Khách tracking (/order-online/track/:id)
    → 4 bước đều xanh ✓
```

**Assertion cần verify tại mỗi bước:**
- Status trả từ API đúng
- Polling trên tất cả tabs cập nhật trong ≤30s
- Không có tab nào bị stuck ở trạng thái cũ

---

### 3.4 KIỂM THỬ PHI CHỨC NĂNG

#### 3.4.1 Bảo mật (Security)

| TC# | Phương án test | Mục tiêu |
|---|---|---|
| SEC-01 | Gọi `/api/internal/*` không có token | Phải 401, không leak data |
| SEC-02 | Dùng token của store A gọi API store B | Phải 403 hoặc empty |
| SEC-03 | SQL injection vào search/filter params | Zod schema block, Prisma parameterized query |
| SEC-04 | Upload file không phải image | Multer mimetype check → 400 |
| SEC-05 | Token giả tự ký | Supabase verify thất bại → 401 |
| SEC-06 | XSS qua tên món ăn | Frontend escape đúng, không render HTML |
| SEC-07 | Brute force login | Rate limit 10 req/min per IP (app.ts line 68) |
| SEC-08 | CORS sai origin | Không thuộc whitelist → block |

#### 3.4.2 Hiệu năng (Performance)

| TC# | Phương án test | Threshold |
|---|---|---|
| PERF-01 | Load `/order-online/menu` cold start | ≤ 2s TTFB |
| PERF-02 | `GET /api/public/menu` response time | ≤ 500ms |
| PERF-03 | `GET /api/internal/orders/active` với 100 đơn | ≤ 800ms |
| PERF-04 | Đồng thời 20 khách đặt hàng (load test) | Không drop request |
| PERF-05 | KDS polling 15s × 8 giờ | Không memory leak |
| PERF-06 | Admin dashboard load nhiều đơn | ≤ 3s render |
| PERF-07 | Upload hình ảnh 5MB | ≤ 5s, không timeout |

**Công cụ đề xuất:** `k6` hoặc `Artillery` cho load test

#### 3.4.3 Khả dụng & Độ tin cậy (Availability)

| TC# | Phương án test | Expected |
|---|---|---|
| AVAIL-01 | Backend restart → Frontend tự recover | React Query retry 3 lần, báo lỗi graceful |
| AVAIL-02 | Mất mạng trong lúc đặt hàng | Form không mất data, retry on reconnect |
| AVAIL-03 | Supabase Auth downtime | Hiển thị thông báo, không crash app |
| AVAIL-04 | Database connection pool exhausted | 503 với message rõ ràng |

#### 3.4.4 Khả năng sử dụng — Mobile UX (Usability)

| TC# | Phương án test | Tiêu chí |
|---|---|---|
| UX-01 | Shipper page trên iPhone 14 (390px) | Touch target ≥ 44px, không overflow |
| UX-02 | Đặt hàng trên Android (360px) | Form scroll được, submit không bị che |
| UX-03 | Đọc được ngoài nắng | Font ≥ 14px, contrast ratio ≥ 4.5:1 |
| UX-04 | Confirm button bấm 1 tay | Vùng bấm đủ lớn, trong tầm tay cái |
| UX-05 | Stepper tracking dễ hiểu | Không cần đọc text, nhìn màu là biết |

#### 3.4.5 Tương thích (Compatibility)

| TC# | Môi trường | Kiểm tra |
|---|---|---|
| COMPAT-01 | Chrome latest (Win/Mac) | Full features |
| COMPAT-02 | Safari (iOS 16+) | Đặt hàng, tracking |
| COMPAT-03 | Firefox latest | Admin dashboard |
| COMPAT-04 | Samsung Internet | Shipper page |
| COMPAT-05 | Chrome mobile (Android) | Toàn bộ flow khách |

---

### 3.5 KIỂM THỬ DỮ LIỆU & BIÊN (Boundary / Data Validation)

| TC# | Field | Input thử | Expected |
|---|---|---|---|
| VAL-01 | Số điện thoại | `abc123`, `12345`, `+840901234567` | Validation error |
| VAL-02 | Giá món | 0, -1, 999999999 | 0 invalid, âm invalid, lớn OK |
| VAL-03 | Tên món | "" (trống), 500 ký tự | Trống invalid, quá dài truncate/error |
| VAL-04 | Địa chỉ giao hàng | Chỉ có khoảng trắng | Trim → invalid |
| VAL-05 | Số lượng món | 0, -1, 999 | 0/âm invalid, lớn có thể limit |
| VAL-06 | pageSize query | pageSize=0, pageSize=10000 | Default hoặc cap |
| VAL-07 | UUID params | `not-a-uuid` | Zod parse error → 400 |

---

## 4. Ma Trận Ưu Tiên Test

| Mức độ | Nhóm test | Lý do |
|---|---|---|
| 🔴 **Kritical** | AUTH-01→08, ORD-01→07, E2E-01→08 | Core business, security |
| 🟠 **High** | ORD-08→16, E2E-09→28, TENANT-01→03 | Operational workflow |
| 🟡 **Medium** | MENU-01→07, SEC-01→08, PERF-01→05 | Quality & security |
| 🟢 **Low** | VAL-01→07, COMPAT-01→05, UX-01→05 | Polish & coverage |

---

## 5. Môi Trường Test Đề Xuất

```
┌─────────────────────────────────────────────────────────┐
│  LOCAL (Dev)                                            │
│  BE: localhost:3001  FE: localhost:5176                 │
│  DB: Supabase project (dev)                             │
│  Dùng cho: Unit tests, manual smoke test                │
├─────────────────────────────────────────────────────────┤
│  STAGING (Pre-prod)                                     │
│  BE: Railway staging branch                             │
│  FE: Vercel preview URL                                 │
│  DB: Supabase project (staging) — data độc lập          │
│  Dùng cho: Integration tests, E2E Playwright, UAT       │
├─────────────────────────────────────────────────────────┤
│  PRODUCTION                                             │
│  BE: Railway main                                       │
│  FE: Vercel main (bep-nha-minh.vercel.app)             │
│  Dùng cho: Smoke test sau deploy, monitor               │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Tài Khoản Test

| Vai trò | Email | Mật khẩu | Dùng để test |
|---|---|---|---|
| Admin | `admin@bepnhaminh.vn` | `Admin@123456` | AUTH, Admin UI, Shipper |
| Kitchen | `bep@bepnhaminh.vn` | `Kitchen@123456` | KDS flow |
| Khách | Không cần tài khoản | — | Order online flow |

---

## 7. Checklist Trước Khi Deploy

- [ ] Tất cả Critical & High test cases PASS
- [ ] Không có `console.error` unhandled trong FE
- [ ] CORS config đúng domain production
- [ ] ENV variables đầy đủ trên Railway & Vercel
- [ ] Database migrations đã chạy
- [ ] Rate limiting hoạt động (test AUTH brute force)
- [ ] Hình ảnh static server up và accessible
- [ ] localStorage persist hoạt động đúng sau login
