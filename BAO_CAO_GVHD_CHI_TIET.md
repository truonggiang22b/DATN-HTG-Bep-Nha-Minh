# BÁO CÁO DỰ ÁN: BẾP NHÀ MÌNH — QR ORDERING SYSTEM

> **Ngày cập nhật:** 25/04/2026  
> **Đối tượng nhận:** Giáo viên hướng dẫn  
> **Sinh viên:** Trương Giang (truonggiang22b)  
> **Phạm vi:** Nghiệp vụ, kiến trúc kỹ thuật, tiến độ, kiểm thử, deployment production  
> **Lưu ý bảo mật:** Báo cáo này không công khai giá trị credentials, chỉ mô tả cấu hình ở mức tổng quan.

---

## MỤC LỤC

1. [Thông tin chung](#1-thông-tin-chung)
2. [Bối cảnh và hướng đi sản phẩm](#2-bối-cảnh-và-hướng-đi-sản-phẩm)
3. [Quy trình nghiệp vụ](#3-quy-trình-nghiệp-vụ)
4. [Giải pháp kỹ thuật](#4-giải-pháp-kỹ-thuật)
5. [Tiến độ thực hiện](#5-tiến-độ-thực-hiện)
6. [Deployment Production](#6-deployment-production)
7. [Kiểm thử và đánh giá](#7-kiểm-thử-và-đánh-giá)
8. [Kết quả demo trực tiếp](#8-kết-quả-demo-trực-tiếp)
9. [Rủi ro và hướng phát triển](#9-rủi-ro-và-hướng-phát-triển)
10. [Kết luận](#10-kết-luận)
11. [Phụ lục](#11-phụ-lục)

---

## 1. THÔNG TIN CHUNG

**Tên dự án:** Bếp Nhà Mình - QR Ordering System

**Mô tả ngắn:** Hệ thống đặt món tại bàn cho cơ sở F&B. Khách hàng dùng điện thoại quét mã QR tại bàn để mở menu số, chọn món và gửi order trực tiếp vào hệ thống. Bếp/quầy nhận order trên màn hình KDS, cập nhật trạng thái chế biến. Khách có thể theo dõi tiến độ đơn hàng trên điện thoại theo thời gian thực.

**Trạng thái dự án (24/04/2026):** ✅ **MVP hoàn chỉnh, đã deploy production**

| Hạng mục | Trạng thái |
|---|---|
| Backend API | ✅ Live — Railway `asia-southeast1` |
| Frontend Web | ✅ Live — Vercel CDN |
| Database | ✅ Supabase PostgreSQL |
| Kiểm thử tự động | ✅ 99/99 backend + 54/55 E2E |
| Dữ liệu demo production | ✅ Đã seed |

**Đối tượng sử dụng:**

| Actor | Vai trò | Giá trị nhận được |
|---|---|---|
| Khách hàng | Quét QR, xem menu, đặt món, theo dõi trạng thái | Gọi món nhanh, không cần cài app, biết đơn đang xử lý đến đâu |
| Nhân viên bếp | Nhận order trên KDS, cập nhật trạng thái chế biến | Giảm bỏ sót order, xử lý theo cột trạng thái rõ ràng |
| Quản lý ca | Theo dõi bàn, reset phiên bàn khi khách rời đi | Kiểm soát vận hành từng ca |
| Admin/chủ quán | Quản lý menu, bàn, QR, xem lịch sử order | Chủ động điều chỉnh menu và giám sát vận hành |

---

## 2. BỐI CẢNH VÀ HƯỚNG ĐI SẢN PHẨM

### 2.1 Vấn đề thực tế

Trong mô hình phục vụ truyền thống, khách hàng phải chờ nhân viên đưa menu, ghi order và truyền thông tin về bếp. Quy trình này dễ phát sinh các vấn đề:

- **Thời gian chờ dài:** Khách phải chờ khi quán đông, nhân viên bận.
- **Sai sót khi ghi order:** Nhân viên có thể ghi sai món, sai số lượng, thiếu option hoặc thiếu ghi chú.
- **Bếp nhận thông tin không chuẩn:** Order truyền qua lời nói/giấy, dễ bị bỏ sót hoặc khó sắp xếp ưu tiên.
- **Menu giấy lỗi thời:** Món tạm hết vẫn hiện trên menu, khách đặt nhầm gây phiền phức.
- **Thiếu số liệu vận hành:** Order không được số hóa, quản lý khó theo dõi lịch sử và hiệu suất.

### 2.2 Định hướng MVP

MVP tập trung vào việc chứng minh một vòng đời order tại bàn hoàn chỉnh:

```
QR → Menu → Cart → Order → KDS → Tracking → Reset table session
```

**Chiến lược sản phẩm:** Web-first, mobile-first, zero friction cho khách hàng:

- Khách không cần cài app, chỉ cần mở link QR trên trình duyệt di động.
- QR cố định theo bàn vật lý; phiên bàn được quản lý bằng table session.
- Khách không cần tạo tài khoản hay đăng nhập trong luồng MVP.
- Admin/KDS có đăng nhập và phân quyền theo role.
- Payment, POS sync, quản lý kho, loyalty và AI nâng cao được để lại cho phase sau.

### 2.3 Phạm vi MVP

| Nhóm tính năng | Trạng thái |
|---|---|
| QR theo bàn, menu số, giỏ hàng, gửi order | ✅ Đã có |
| KDS xử lý order, tracking trạng thái cho khách | ✅ Đã có |
| Admin quản lý menu, danh mục, bàn, QR, reset phiên | ✅ Đã có |
| Auth/RBAC cho staff (ADMIN, MANAGER, KITCHEN) | ✅ Đã có |
| Upload ảnh menu | ✅ Đã có (Supabase Storage) |
| Soft-delete/restore món và danh mục | ✅ Đã có |
| Payment online | ❌ Ngoài phạm vi MVP |
| POS sync | ❌ Ngoài phạm vi MVP |
| Quản lý kho nguyên liệu | ❌ Ngoài phạm vi MVP |
| AI gợi ý món | ❌ Phase sau |
| Realtime push WebSocket/SSE | ❌ Hiện dùng polling cho MVP |

---

## 3. QUY TRÌNH NGHIỆP VỤ

### 3.1 Luồng Khách Hàng

```
┌─────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Quét QR    │ → │  Xem menu   │ → │  Giỏ hàng   │ → │  Đặt món    │
│  tại bàn   │   │  theo danh   │   │  + Options  │   │  (Submit)   │
└─────────────┘   │  mục/tìm    │   └──────────────┘   └──────┬───────┘
                  └──────────────┘                            │
┌─────────────────────────────────────────────────────────────▼───────────┐
│  Tracking Page: xem mã đơn, danh sách món, trạng thái cập nhật           │
│  (polling 3 giây)                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Chi tiết các bước:**

1. Khách ngồi vào bàn, quét QR → hệ thống resolve token nhận diện bàn, chi nhánh và phiên bàn đang mở.
2. Khách xem menu theo danh mục, tìm kiếm món, xem chi tiết và option.
3. Khách thêm món vào giỏ hàng (chọn option, số lượng, ghi chú nếu cần).
4. Khách vào giỏ hàng xem tổng tiền tạm tính và xác nhận gửi order.
5. Backend validate: QR hợp lệ, giỏ không rỗng, món còn bán, option hợp lệ, idempotency key chưa tồn tại.
6. Order được tạo trong DB, tự động xuất hiện trên KDS bếp.
7. Khách được điều hướng sang màn hình tracking — xem mã đơn, món đã gọi và trạng thái cập nhật mỗi 3 giây.

### 3.2 Luồng Bếp/KDS

Order trên KDS đi theo state machine có kiểm soát:

```
NEW → PREPARING → READY → SERVED
NEW/PREPARING → CANCELLED
```

| Trạng thái | Ý nghĩa cho bếp | Ý nghĩa cho khách |
|---|---|---|
| `NEW` | Đơn mới, cần xác nhận bắt đầu làm | Đơn đã được tiếp nhận |
| `PREPARING` | Đang chuẩn bị trong bếp | Đang chuẩn bị |
| `READY` | Sẵn sàng mang ra bàn | Sắp được phục vụ |
| `SERVED` | Đã phục vụ xong | Đã phục vụ xong |
| `CANCELLED` | Đơn hủy | Đơn đã bị hủy |

**Quy tắc KDS board:**
- Hiển thị tất cả đơn `NEW`, `PREPARING`, `READY` (không giới hạn thời gian).
- Hiển thị đơn `SERVED` **trong ngày hiện tại** để đối soát cuối ca.
- Không hiển thị `CANCELLED` và `SERVED` từ ngày cũ.

### 3.3 Luồng Admin/Quản Lý

| Nhóm tác vụ | Chức năng chi tiết |
|---|---|
| Quản lý danh mục | Tạo/sửa/xóa mềm (soft-delete) danh mục, khôi phục |
| Quản lý món ăn | Tạo/sửa món, upload ảnh, đặt trạng thái `ACTIVE`/`SOLD_OUT`/`HIDDEN`, soft-delete/restore |
| Quản lý bàn & QR | Tạo bàn, xem/in QR trực tiếp từ modal trong giao diện admin, theo dõi trạng thái bàn |
| Reset phiên | Đóng phiên bàn cũ sau khi khách rời — bắt buộc để QR phục vụ lượt khách tiếp theo |
| Dashboard | Xem lịch sử order, thống kê theo trạng thái |
| Quản lý staff | Xem, tạo mới, đổi vai trò (role), khóa/mở tài khoản nhân viên |

### 3.4 Business Rules Quan Trọng

| Rule | Nội dung |
|---|---|
| QR cố định theo bàn | Mỗi QR token đại diện cho một bàn vật lý, không thay đổi |
| Order gắn với table session | Các order trong cùng lượt khách được gom theo session |
| Khách không cần login | Customer flow chỉ cần QR token và client session ID |
| Không sửa order sau khi gửi | Gọi thêm món → tạo order mới trong cùng phiên |
| Chỉ đặt được món `ACTIVE` | `SOLD_OUT` và `HIDDEN` bị chặn ở server |
| Snapshot order item | Lưu tên, giá, option tại thời điểm đặt — tránh sai lệch khi admin sửa menu sau |
| Chống trùng order | Idempotency key ngăn tạo đơn trùng khi người dùng bấm submit nhiều lần |
| Admin/KDS bắt buộc auth | Mọi API nội bộ cần JWT hợp lệ và role phù hợp |

---

## 4. GIẢI PHÁP KỸ THUẬT

### 4.1 Kiến Trúc Tổng Quan

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│                                                          │
│  📱 Customer      👨‍🍳 KDS (Bếp)     🖥️ Admin Dashboard  │
│  (Mobile web)    (Desktop web)    (Desktop web)          │
│                                                          │
│           React 19 + Vite + TypeScript                   │
│           TanStack Query (data fetching + cache)         │
│           Zustand (auth store + toast)                   │
│           React Router v6                               │
│                   VERCEL CDN                             │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTPS / REST API
┌────────────────────────▼─────────────────────────────────┐
│                    API LAYER                             │
│                                                          │
│           Express 5 + TypeScript + Node.js 20           │
│           Zod validation                                 │
│           Helmet + CORS + Rate Limit                     │
│           Pino logger                                    │
│                  RAILWAY (asia-southeast1)               │
└────────────────────────┬─────────────────────────────────┘
                         │ Prisma ORM
┌────────────────────────▼─────────────────────────────────┐
│                  DATA LAYER                              │
│                                                          │
│           PostgreSQL (Supabase)                          │
│           Supabase Auth (JWT)                            │
│           Supabase Storage (menu images)                 │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Frontend

**Thư mục:** `web-prototype-react/`

**Stack:**

| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 6.x | Build tool |
| React Router | v6 | Routing |
| TanStack React Query | v5 | Data fetching, cache, polling |
| Zustand | v4 | Auth store + toast store |
| Axios | v1 | HTTP client |
| Playwright | v1.x | E2E testing |

**Routes và phân quyền:**

| Route | URL Production | Đối tượng | Mục đích |
|---|---|---|---|
| `/qr/:qrToken` | `https://datn-htg-bep-nha-minh.vercel.app/qr/qr-bnm-table-01` | Khách | Mở menu theo QR bàn |
| `/cart` | `https://datn-htg-bep-nha-minh.vercel.app/cart` | Khách | Giỏ hàng và submit order |
| `/order/:orderId/tracking` | `https://datn-htg-bep-nha-minh.vercel.app/order/.../tracking` | Khách | Theo dõi trạng thái đơn |
| `/login` | `https://datn-htg-bep-nha-minh.vercel.app/login` | Staff | Đăng nhập admin/kitchen |
| `/kds` | `https://datn-htg-bep-nha-minh.vercel.app/kds` | KITCHEN, MANAGER | Màn hình bếp xử lý order |
| `/admin` | `https://datn-htg-bep-nha-minh.vercel.app/admin` | ADMIN | Dashboard thống kê |
| `/admin/menu` | `https://datn-htg-bep-nha-minh.vercel.app/admin/menu` | ADMIN | Quản lý menu và danh mục |
| `/admin/tables` | `https://datn-htg-bep-nha-minh.vercel.app/admin/tables` | ADMIN | Quản lý bàn, QR, reset phiên |
| `/admin/staff` | `https://datn-htg-bep-nha-minh.vercel.app/admin/staff` | ADMIN | Quản lý tài khoản nhân viên |

**Service layer:**

```
src/services/
├── apiClient.ts      # Axios instance, auth interceptor, error normalize
├── publicApi.ts      # QR resolve, menu, submit order, tracking
└── internalApi.ts    # Auth login/logout, KDS, Admin CRUD
```

### 4.3 Backend

**Thư mục:** `backend-api/`

**Stack:**

| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| Node.js | >= 20 | Runtime |
| Express | 5.x | HTTP framework |
| TypeScript | 5.x | Type safety |
| Prisma | 6.x | ORM + migration |
| Zod | v3 | Schema validation |
| Helmet | v8 | Security headers |
| cors | v2 | CORS policy |
| express-rate-limit | v7 | Rate limiting |
| pino | v9 | JSON structured logging |
| Vitest + Supertest | latest | Unit + Integration testing |

**API routes:**

| Nhóm | Prefix | Giới hạn | Mục đích |
|---|---|---|---|
| Health | `GET /health` | — | Kiểm tra server alive |
| Public | `/api/public` | 100 req/min | QR, menu, order, tracking |
| Auth | `/api/auth` | 10 req/min | Login, logout, me |
| Internal | `/api/internal` | 200 req/min | KDS, Admin CRUD |

**Security đã triển khai:**

- Helmet security headers (XSS, frame, content-type protection).
- CORS whitelist theo `FRONTEND_URL` env var (chỉ cho localhost trong dev).
- Rate limiting riêng cho từng nhóm route.
- JWT authentication middleware cho internal API.
- Role-based access control (ADMIN, MANAGER, KITCHEN).
- Server-side validation toàn bộ input bằng Zod.
- Env validation bắt buộc khi khởi động — app crash fast nếu thiếu config.

### 4.4 Database & Data Model

**Database:** PostgreSQL 15 trên Supabase (Singapore region).  
**ORM:** Prisma 6 với migration tự động.

**Entities chính:**

| Entity | Vai trò |
|---|---|
| `Store` | Thực thể kinh doanh (quán/chuỗi) |
| `Branch` | Chi nhánh của Store |
| `User` + `UserRole_Rel` | Tài khoản staff và phân quyền |
| `DiningTable` | Bàn vật lý, có QR token cố định |
| `TableSession` | Phiên phục vụ của một bàn (mở/đóng) |
| `Category` | Danh mục menu, hỗ trợ soft-delete |
| `MenuItem` | Món ăn, có trạng thái ACTIVE/SOLD_OUT/HIDDEN, soft-delete |
| `MenuOptionGroup` + `MenuOption` | Option/topping cho món |
| `Order` | Đơn hàng, gắn với session và QR token |
| `OrderItem` | Chi tiết món trong đơn, **có snapshot** tên/giá/option |
| `OrderStatusHistory` | Lịch sử chuyển trạng thái đơn |

**Thiết kế điểm mạnh:**

- Multi-store/multi-branch ready ở tầng data model.
- Snapshot order item — giá và option được lưu tại thời điểm đặt, không bị ảnh hưởng khi admin sửa menu sau.
- Soft-delete cho Category và MenuItem — admin có thể khôi phục dữ liệu đã ẩn.
- OrderStatusHistory — audit trail đầy đủ cho mỗi lần chuyển trạng thái.

---

## 5. TIẾN ĐỘ THỰC HIỆN

### 5.1 Giai Đoạn 1 — Phân Tích & Tài Liệu

**Thời gian:** Trước Sprint 1  
**Kết quả:** Bộ tài liệu hoàn chỉnh trong `docs_prototype/`

| Tài liệu | Nội dung |
|---|---|
| `01_phan_tich_du_an` | Phân tích bài toán, định hướng sản phẩm |
| `02_quy_trinh_nghiep_vu` | Flow nghiệp vụ thống nhất |
| `03_prd_mvp_va_backlog` | PRD và product backlog |
| `05_kien_truc_ky_thuat` | Architecture decision records |
| `06_data_model_api_spec` | Schema Prisma và API specification |
| `13_tong_ket_du_an` | Báo cáo tổng kết PM/PO/BA |
| `15_final_testing_report` | Báo cáo kiểm thử |

### 5.2 Giai Đoạn 2 — Prototype UI (Sprint 1-2)

**Kết quả:** Toàn bộ màn hình chính đã có

- Menu mobile cho khách (theo danh mục, item detail sheet).
- Cart page.
- Tracking page.
- Login page.
- KDS page (4 cột trạng thái).
- Admin layout, Dashboard, Menu management, Table management, Staff management.

### 5.3 Giai Đoạn 3 — Backend API (Sprint 3)

**Kết quả:** Backend MVP production-ready

- Prisma schema và migration đầy đủ.
- Seed data (2 store, 5 bàn, 5 danh mục, 13 món, 3 tài khoản).
- Auth login/logout/me (qua Supabase JWT).
- Public routes: QR resolve, menu, submit order, tracking.
- Internal routes: KDS active orders + status update, Admin CRUD.
- Reset table session.
- Upload ảnh menu (Supabase Storage).
- Test suite Vitest/Supertest.

### 5.4 Giai Đoạn 4 — Tích Hợp API Thật (Sprint 4)

**Kết quả:** Frontend chuyển hoàn toàn từ mock sang API thật

| Bước | Hạng mục | Trạng thái |
|---|---|---|
| 1 | Install axios, @tanstack/react-query | ✅ |
| 2 | API service layer (apiClient, publicApi, internalApi) | ✅ |
| 3 | Auth store (useAuthStore + sessionStorage) | ✅ |
| 4 | Type definitions cho API response | ✅ |
| 5 | App shell + LoginPage + ProtectedRoute | ✅ |
| 6 | MenuPage dùng useQuery + API thật | ✅ |
| 7 | CartPage dùng useMutation + submit thật | ✅ |
| 8 | TrackingPage polling 3 giây | ✅ |
| 9 | KDSPage polling 5 giây + mutation thật | ✅ |
| 10 | AdminMenuPage CRUD thật | ✅ |
| 11 | AdminTablesPage CRUD + reset thật | ✅ |
| 12 | AdminDashboardPage stats từ API | ✅ |
| 13 | Kiểm thử toàn bộ flow | ✅ |

**Các cải tiến kèm theo Sprint 4:**

- Thêm soft-delete/restore cho MenuItem và Category.
- Sửa lỗi RBAC: bổ sung role MANAGER cho route `/kds`.
- Sửa lỗi `addToast` → `showToast` trong AdminStaffPage.
- Chuẩn hóa rule KDS board (SERVED trong ngày, không lấy CANCELLED).
- Cập nhật 28 test E2E bị lệch implementation sau khi chuyển sang API thật.

### 5.5 Giai Đoạn 5 — Production Deployment (24/04/2026)

**Kết quả:** Hệ thống live trên internet

Chi tiết ở [Mục 6 — Deployment Production](#6-deployment-production).

---

## 6. DEPLOYMENT PRODUCTION

### 6.1 Tổng Quan Hạ Tầng

```
GitHub Repo (truonggiang22b/DATN-HTG-Bep-Nha-Minh)
      │
      ├──────────────────────────────────┐
      │ Auto-deploy on push to main      │ Auto-deploy on push to main
      ▼                                  ▼
  RAILWAY                           VERCEL
  (backend-api/)                    (web-prototype-react/)
  Node.js + Express                 Vite + React
  Region: asia-southeast1          CDN global
  Builder: Nixpacks                Builder: Vite
      │
      │
      ▼
  SUPABASE
  PostgreSQL (Singapore)
  Auth (JWT)
  Storage (menu images)
```

### 6.2 URLs Production

| Service | URL |
|---|---|
| **Backend API** | `https://datn-htg-bep-nha-minh-production.up.railway.app` |
| **Health check** | `https://datn-htg-bep-nha-minh-production.up.railway.app/health` |
| **Frontend** | `https://datn-htg-bep-nha-minh.vercel.app` |

### 6.3 Cấu Hình Railway (Backend)

| Item | Giá trị |
|---|---|
| Platform | Railway Hobby |
| Region | asia-southeast1 (Singapore) |
| Builder | Nixpacks (auto-detect Node.js) |
| Build command | `npx prisma generate && npm run build` |
| Start command | `npx prisma migrate deploy && node dist/server.js` |
| Root directory | `backend-api/` |
| Auto-deploy | ✅ Khi push commit lên nhánh `main` |

**Environment Variables cấu hình trên Railway (11 biến):**

| Biến | Mô tả |
|---|---|
| `PORT` | Port server (Railway tự inject) |
| `NODE_ENV` | `production` |
| `APP_BASE_URL` | URL backend production |
| `FRONTEND_URL` | URL frontend (whitelist CORS) |
| `DATABASE_URL` | Supabase connection string (pooler) |
| `DIRECT_URL` | Supabase direct connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `SUPABASE_JWT_SECRET` | JWT secret để verify token |
| `SUPABASE_STORAGE_BUCKET` | Tên bucket lưu ảnh món |

### 6.4 Cấu Hình Vercel (Frontend)

| Item | Giá trị |
|---|---|
| Platform | Vercel Hobby |
| Framework | Vite |
| Root directory | `web-prototype-react/` |
| Build command | `npm run build` (Vite tự detect) |
| Output directory | `dist/` |
| Auto-deploy | ✅ Khi push commit lên nhánh `main` |

**Environment Variables:**

| Biến | Giá trị |
|---|---|
| `VITE_API_URL` | `https://datn-htg-bep-nha-minh-production.up.railway.app/api` |

### 6.5 Quy Trình CI/CD

```
Developer sửa code
       │
       ▼
git commit + git push new-origin main
       │
       ├─────────────────────────────┐
       │                             │
       ▼                             ▼
  Railway trigger              Vercel trigger
  (detect commit)              (detect commit)
       │                             │
       ▼                             ▼
  Nixpacks build               Vite build
  (prisma gen + tsc)           (bundle + optimize)
       │                             │
       ▼                             ▼
  Deploy container             Deploy to CDN
  (prisma migrate              (~2 min)
   + node server.js)
  (~2-3 min)
```

### 6.6 Các Vấn Đề Đã Giải Quyết Trong Quá Trình Deploy

| Vấn đề | Nguyên nhân | Giải pháp |
|---|---|---|
| "Railpack could not determine how to build" | Railway scan root thấy monorepo, không biết build gì | Tạo `Dockerfile` + `railway.json` ở root |
| `tsc` build lỗi — thiếu Prisma types | `npm run build` chạy trước `prisma generate` | Đảo thứ tự: `prisma generate` → `tsc` |
| Container crash — env vars không inject | Railway Dockerfile builder bug với cached registry image | Chuyển sang Nixpacks builder — inject đúng cách |
| Frontend `/qr/qr-bnm-table-01` báo lỗi | `VITE_API_URL` thiếu `/api` suffix | Cập nhật env var + redeploy fresh (không dùng cache) |

---

## 7. KIỂM THỬ VÀ ĐÁNH GIÁ

### 7.1 Tổng Kết Kiểm Thử

| Lớp test | Framework | Tổng | Pass | Fail | Skip |
|---|---|---:|---:|---:|---:|
| Backend unit + integration | Vitest + Supertest | 99 | **99** | 0 | 0 |
| Frontend E2E | Playwright Chromium | 55 | **54** | 0 | 1 |

> ✅ **Backend:** 99/99 — không có fail  
> ✅ **Frontend E2E:** 54 pass, 0 fail, 1 skip có chủ đích

### 7.2 Backend Testing (Vitest + Supertest)

**6 nhóm test file:**

| File | Nội dung |
|---|---|
| `auth.test.ts` | Login, logout, me, token expire, role check |
| `public.test.ts` | QR resolve, menu API, submit order, idempotency |
| `orders.test.ts` | State machine, invalid transitions, cancel |
| `admin_crud.test.ts` | CRUD categories, menu items, tables |
| `sessions.test.ts` | Tạo order với session, reset session |
| `e2e.test.ts` | End-to-end flow: QR → order → KDS → SERVED |

**Kết quả lần chạy mới nhất (23/04/2026):**
```
Test Files  6 passed (6)
Tests      99 passed (99)
```

**Các điểm chuẩn hóa quan trọng:**

- `KDS-02`: Cập nhật expectation từ "chỉ lấy NEW/PREPARING/READY" → "lấy cả SERVED trong ngày" theo rule nghiệp vụ đã chốt.
- `SESSION-06`: Sửa dữ liệu test dùng món ACTIVE không có required option, tránh nhận lỗi `400 INVALID_OPTION`.

### 7.3 Frontend E2E Testing (Playwright)

**Tổ chức test:**

```
tests/
├── admin.spec.ts       # Admin login, dashboard, menu CRUD, table management
├── customer.spec.ts    # QR load, menu, cart, submit, tracking, additional order
├── kitchen.spec.ts     # KDS login, board 4 cột, state machine, cancel
└── fullflow.spec.ts    # Customer đặt → KDS cập nhật → Admin xem
```

**Kết quả:**

| Nhóm | Trạng thái |
|---|---|
| Customer | ✅ Menu, cart, submit, tracking, gọi thêm, cancelled/served state |
| KDS | ✅ Login, 4 cột board, polling, NEW→PREPARING→READY→SERVED, cancel |
| Admin | ✅ Login/RBAC, dashboard, menu CRUD/status, table/reset session |
| Full-flow | ✅ Customer đặt món → KDS xử lý → Admin xem dashboard |

**Các fix E2E quan trọng:**

- Auth helper dùng đúng `/api/auth/login`, cache session để tránh rate limit, inject `sessionStorage` đúng cách.
- API menu dùng đúng `/api/public/branches/:branchId/menu`.
- Toast có class `.toast` để Playwright detect thông báo.
- Quick-add flow chọn đúng món ACTIVE, tránh món SOLD_OUT hoặc có required option.
- Dashboard có selector ổn định `.order-history-row` và `.order-detail`.

### 7.4 Manual Testing — Production Smoke Test

Sau khi deploy lên Railway + Vercel (24/04/2026):

| Test | URL | Kết quả |
|---|---|---|
| Backend health | `/health` | ✅ `{"status":"ok"}` |
| QR resolve API | `/api/public/qr/qr-bnm-table-01` | ✅ Trả bàn + session + store data |
| Frontend load | Vercel URL | ✅ React app load |
| QR menu page | `/qr/qr-bnm-table-01` | ✅ Hiện menu Bàn 01 |
| Admin login | `/login` | ✅ Redirect về `/admin` |
| KDS login | `/login` (bep@bepnhaminh.vn) | ✅ Redirect về `/kds` |

---

## 8. KẾT QUẢ DEMO TRỰC TIẾP

### 8.1 Tài Khoản Demo

| Vai trò | Email | Password | Trang sau khi đăng nhập |
|---|---|---|---|
| Admin | `admin@bepnhaminh.vn` | `Admin@123456` | `/admin` |
| Giáo Viên Demo | `giaovien@bepnhaminh.vn` | `GiaoVien@2026` | `/admin` |
| Bếp/KDS | `bep@bepnhaminh.vn` | `Kitchen@123456` | `/kds` |

### 8.2 QR Token Demo

| Bàn | URL trực tiếp |
|---|---|
| Bàn 01 | `https://datn-htg-bep-nha-minh.vercel.app/qr/qr-bnm-table-01` |
| Bàn 02 | `https://datn-htg-bep-nha-minh.vercel.app/qr/qr-bnm-table-02` |
| Bàn 03 | `https://datn-htg-bep-nha-minh.vercel.app/qr/qr-bnm-table-03` |
| Bàn 04 | `https://datn-htg-bep-nha-minh.vercel.app/qr/qr-bnm-table-04` |
| Bàn 05 | `https://datn-htg-bep-nha-minh.vercel.app/qr/qr-bnm-table-05` |

### 8.3 Script Demo Ngắn (Cho Giáo Viên)

**Kịch bản demo 7 phút:**

```
[Trên điện thoại — vai Khách]
1. Quét QR hoặc mở: datn-htg-bep-nha-minh.vercel.app/qr/qr-bnm-table-01
2. Xem menu → chọn 1-2 món (có thể chọn option/topping) → giỏ hàng → Đặt món
3. Màn hình tracking hiện mã đơn, danh sách món và trạng thái "Đã tiếp nhận"

[Trên máy tính — vai Bếp/KDS]
4. Vào /login → đăng nhập bep@bepnhaminh.vn / Kitchen@123456
5. KDS board hiện đơn vừa tạo ở cột "Mới nhận"
6. Nhấn "Bắt đầu chuẩn bị" → đơn chuyển sang cột "Đang chuẩn bị"

[Trên điện thoại — kiểm tra tracking realtime]
7. Sau ~3 giây polling, tracking tự cập nhật → "Đang chuẩn bị"

[Trên máy tính — KDS hoàn tất]
8. Nhấn "Sẵn sàng" → "Đã phục vụ"

[Trên điện thoại — đặt thêm món]
9. Tracking hiện "Đã phục vụ xong!" + nút "Gọi thêm món" (nổi bật)
10. Nhấn → về lại menu → chọn thêm món → đặt → KDS nhận Order mới ngay

[Trên máy tính — vai Admin]
11. Vào /login → đăng nhập admin@bepnhaminh.vn / Admin@123456
12. Dashboard hiện đơn đã hoàn tất trong lịch sử
13. Vào Bàn & QR → click "Xem QR" → modal hiện QR + nút In trực tiếp
```

### 8.4 Dữ Liệu Seed Production

| Loại | Số lượng |
|---|---|
| Store | 2 |
| Chi nhánh | 2 |
| Bàn (Store 1) | 5 bàn (Bàn 01–05) |
| Danh mục (Store 1) | 5 danh mục |
| Món ăn (Store 1) | 13 món |
| Tài khoản | 3 (1 admin Store 1, 1 bếp Store 1, 1 admin Store 2) |

---

## 9. RỦI RO VÀ HƯỚNG PHÁT TRIỂN

### 9.1 Rủi Ro Hiện Tại

| Rủi ro | Mức độ | Hướng giảm thiểu |
|---|---|---|
| Supabase credentials hết hạn/revoke | Cao | Quy trình rotation, không commit `.env`, dùng Railway/Vercel dashboard để quản lý |
| E2E lệch implementation khi UI/API thay đổi | Trung bình | Duy trì selector ổn định, cập nhật helper test cùng lúc với code |
| Polling không tối ưu bằng realtime push | Thấp | Chấp nhận cho MVP; upgrade SSE/WebSocket ở phase sau |
| Railway Free tier giới hạn uptime | Trung bình | Upgrade plan hoặc migration sang platform khác khi có user thật |
| Image upload mất khi container restart | Thấp | Đã dùng Supabase Storage (cloud) thay vì local filesystem |

### 9.2 Hướng Phát Triển

**Ngắn hạn (trong phạm vi đồ án):**

- Chuẩn hóa README — hướng dẫn chạy local đầy đủ cho người mới.
- ✅ ~~Export QR thành ảnh/PDF để in dán lên bàn thật~~ — **Đã hoàn thành:** Admin có thể xem và in QR ngay trong giao diện `/admin/tables`.
- Thêm thông báo âm thanh khi có order mới trên KDS.

**Trung hạn:**

- Báo cáo doanh thu: top món bán chạy, thời gian xử lý trung bình, thống kê theo ca.
- Cải thiện tốc độ cập nhật: chuyển từ polling sang Server-Sent Events (SSE).
- QR multi-language support (khách nước ngoài).

**Dài hạn:**

- Tích hợp thanh toán online (VNPay, MoMo).
- Tích hợp POS phần cứng.
- Quản lý kho nguyên liệu và cảnh báo hết hàng.
- Multi-branch đầy đủ (phân quyền theo chi nhánh).
- AI gợi ý món/upsell dựa trên lịch sử order.

---

## 10. KẾT LUẬN

Dự án **Bếp Nhà Mình** đã hoàn thành giai đoạn MVP với đầy đủ các thành phần:

**Về nghiệp vụ:** Hệ thống giải quyết đúng bài toán thực tế trong F&B — số hóa quy trình gọi món tại bàn, truyền đơn trực tiếp về bếp và cho phép khách theo dõi trạng thái. Ba vùng trải nghiệm (Customer, KDS, Admin) đều được triển khai với logic nghiệp vụ rõ ràng, có state machine kiểm soát và business rules đầy đủ.

**Về kỹ thuật:** Dự án vượt qua mức prototype UI:
- Backend Express/TypeScript/Prisma/PostgreSQL được xây dựng và test đầy đủ.
- Frontend React tích hợp API thật, auth/RBAC, polling realtime.
- Có 99 backend test pass và 54 E2E test pass.
- **Đã deploy production** trên Railway (backend) và Vercel (frontend) với CI/CD tự động.

**Về chất lượng:** Bộ test tự động (Vitest + Playwright) là bằng chứng cụ thể về độ ổn định của hệ thống ở thời điểm bảo vệ. CI/CD pipeline đảm bảo mỗi commit mới được deploy tự động mà không cần can thiệp thủ công.

**Hướng đi tiếp theo** nên tiếp tục chuẩn hóa cho buổi bảo vệ: demo script, README rõ ràng và thu thập phản hồi để định hướng phase tiếp theo.

---

## 11. PHỤ LỤC

### 11.1 Cấu Trúc Thư Mục Dự Án

```
DATN-HTG-Bep-Nha-Minh/
├── backend-api/              # Express API
│   ├── src/
│   │   ├── config/env.ts     # Zod env validation
│   │   ├── lib/              # Prisma, logger
│   │   ├── middlewares/      # Auth, error handler
│   │   └── modules/
│   │       ├── auth/         # Login/logout/me
│   │       ├── public/       # QR, menu, order, tracking
│   │       └── internal/     # KDS, admin CRUD
│   ├── prisma/
│   │   ├── schema.prisma     # Data model
│   │   ├── migrations/       # Migration files
│   │   └── seed.ts           # Seed data
│   ├── tests/                # Vitest test files
│   └── nixpacks.toml         # Railway build config
├── web-prototype-react/      # React frontend
│   ├── src/
│   │   ├── pages/            # Route pages
│   │   ├── components/       # Shared components
│   │   ├── services/         # API client layer
│   │   ├── store/            # Zustand stores
│   │   └── types/            # TypeScript types
│   └── tests/                # Playwright E2E tests
└── docs_prototype/           # Tài liệu nghiệp vụ/kỹ thuật
```

### 11.2 Công Nghệ Sử Dụng

| Layer | Công nghệ |
|---|---|
| Frontend hosting | Vercel |
| Backend hosting | Railway |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth + JWT |
| Storage | Supabase Storage |
| Version control | GitHub |
| CI/CD | GitHub → Railway/Vercel auto-deploy |

### 11.3 Nguồn Đối Chiếu

- `docs_prototype/` — toàn bộ tài liệu nghiệp vụ và kỹ thuật
- `SPRINT4_PROGRESS.md` — tiến độ tích hợp API
- `backend-api/prisma/schema.prisma` — data model chính xác
- `backend-api/src/app.ts` — route và middleware configuration
- `web-prototype-react/src/services/` — API integration
- `test_run_backend_after_kds_session_fix_raw.txt` — evidence backend test
- Railway deployment log — evidence production build

---

*Tài liệu này được cập nhật lần cuối: 25/04/2026 — cập nhật tài khoản demo, QR in ấn, quản lý nhân viên đầy đủ, kịch bản demo "Gọi thêm món".*
