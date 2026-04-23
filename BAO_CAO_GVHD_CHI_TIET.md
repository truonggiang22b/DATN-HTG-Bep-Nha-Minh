# Báo cáo chi tiết dự án "Bếp Nhà Mình" - QR Ordering System

> Ngày cập nhật: 23/04/2026  
> Đối tượng nhận: Giáo viên hướng dẫn  
> Phạm vi: Hướng đi sản phẩm, nghiệp vụ, kiến trúc kỹ thuật, tiến độ và kết quả kiểm thử  
> Lưu ý bảo mật: Báo cáo này không công khai giá trị trong file `.env`, chỉ mô tả cấu hình và trạng thái ở mức tổng quan.

## 1. Thông tin chung

**Tên dự án:** Bếp Nhà Mình - QR Ordering System.

**Mô tả ngắn:** Dự án xây dựng hệ thống đặt món tại bàn cho cửa hàng F&B. Khách hàng dùng điện thoại quét QR tại bàn để mở menu số, chọn món, gửi order trực tiếp vào hệ thống. Bếp/quầy nhận order trên màn hình KDS, cập nhật trạng thái chế biến, và khách có thể theo dõi tiến độ đơn trên điện thoại.

**Mục tiêu chính:**

- Giảm thời gian khách chờ nhân viên đưa menu và ghi order.
- Giảm sai sót do ghi nhầm món, thiếu option, thiếu ghi chú.
- Giúp bếp/quầy nhận thông tin rõ ràng và có thứ tự xử lý.
- Giúp admin/chủ quán cập nhật menu, trạng thái món, bàn và QR linh hoạt.
- Chứng minh flow vận hành end-to-end bằng MVP trước khi mở rộng sang payment, POS, AI hoặc quản lý kho.

**Đối tượng sử dụng:**

| Actor | Vai trò trong hệ thống | Giá trị nhận được |
|---|---|---|
| Khách hàng | Quét QR, xem menu, đặt món, theo dõi trạng thái | Gọi món nhanh, không cần tải app, biết đơn đang xử lý đến đâu |
| Bếp/quầy | Nhận order, xem ghi chú/option, cập nhật trạng thái | Giảm bỏ sót order, xử lý theo cột trạng thái |
| Quản lý ca | Theo dõi bàn, order, reset phiên bàn | Kiểm soát vận hành từng ca |
| Admin/chủ quán | Quản lý menu, danh mục, bàn, QR, trạng thái món | Chủ động điều chỉnh menu số và dữ liệu demo/vận hành |

## 2. Bối cảnh và hướng đi sản phẩm

### 2.1 Vấn đề thực tế

Trong mô hình phục vụ truyền thống, khách hàng phải chờ nhân viên đưa menu, ghi order và truyền thông tin cho bếp. Quy trình này dễ phát sinh các vấn đề:

- Khách phải chờ khi quán đông.
- Nhân viên có thể ghi sai món, sai số lượng, thiếu option hoặc thiếu ghi chú.
- Bếp nhận thông tin qua lời nói/giấy, dễ bị bỏ sót hoặc khó sắp xếp ưu tiên.
- Menu giấy chậm cập nhật, món tạm hết vẫn có thể bị gọi nhầm.
- Quản lý khó theo dõi dữ liệu order lịch sử nếu order không được số hóa.

### 2.2 Định hướng MVP

MVP của dự án tập trung vào việc chứng minh một vòng đời order tại bàn hoàn chỉnh:

```text
QR -> Menu -> Cart -> Order -> KDS -> Tracking -> Reset table session
```

Định hướng sản phẩm hiện tại là **web-first, mobile-first**:

- Khách hàng không cần cài app, chỉ cần mở link QR trên trình duyệt.
- QR cố định theo bàn; phiên bàn được quản lý bằng table session.
- Khách không cần đăng nhập trong flow MVP.
- Admin/KDS có đăng nhập và phân quyền theo role.
- Payment, POS sync, quản lý kho, loyalty và AI nâng cao chưa đưa vào critical path.

### 2.3 Phạm vi hiện tại và ngoài phạm vi

| Nhóm | Trạng thái |
|---|---|
| QR theo bàn, menu số, giỏ hàng, gửi order | Đã có trong MVP |
| KDS xử lý order, tracking trạng thái cho khách | Đã có trong MVP |
| Admin quản lý menu, danh mục, bàn, QR, reset phiên | Đã có trong MVP |
| Auth/RBAC cho staff | Đã có ở backend/frontend tích hợp |
| Payment online | Chưa nằm trong MVP |
| POS sync | Chưa nằm trong MVP |
| Quản lý kho nguyên liệu | Chưa nằm trong MVP |
| AI gợi ý món nâng cao | Để dành cho phase sau |
| Realtime push WebSocket/SSE | Chưa bắt buộc; hiện đang dùng polling |

## 3. Quy trình nghiệp vụ

### 3.1 Luồng khách hàng

1. Khách ngồi vào bàn và quét QR.
2. Hệ thống resolve QR token để nhận diện bàn, chi nhánh và phiên bàn.
3. Khách xem menu theo danh mục, tìm kiếm món, xem chi tiết món.
4. Khách chọn món, option, số lượng và ghi chú nếu có.
5. Khách vào giỏ hàng, kiểm tra tổng tiền tạm tính và gửi order.
6. Backend validate lại dữ liệu: QR hợp lệ, giỏ không rỗng, món còn bán, option hợp lệ, idempotency key không tạo trùng order.
7. Order được tạo và hiển thị cho KDS.
8. Khách được điều hướng sang màn hình tracking để xem mã đơn, món đã gọi và trạng thái.

### 3.2 Luồng bếp/KDS

Order trên KDS đi theo state machine:

```text
NEW -> PREPARING -> READY -> SERVED
NEW/PREPARING -> CANCELLED
```

Ý nghĩa nghiệp vụ:

| Trạng thái | Ý nghĩa cho bếp/quầy | Ý nghĩa cho khách |
|---|---|---|
| `NEW` | Đơn mới nhận | Đơn đã được tiếp nhận |
| `PREPARING` | Đang chuẩn bị | Đang chuẩn bị |
| `READY` | Sẵn sàng mang ra | Đang mang ra / sẵn sàng |
| `SERVED` | Đã phục vụ | Đã phục vụ xong |
| `CANCELLED` | Đã hủy | Đơn đã bị hủy |

### 3.3 Luồng admin/quản lý

Admin và quản lý ca có các nhóm tác vụ:

- Quản lý danh mục món.
- Quản lý món ăn: tên, giá, mô tả, ảnh, trạng thái `ACTIVE`, `SOLD_OUT`, `HIDDEN`.
- Quản lý bàn và QR token.
- Xem dashboard/order history.
- Reset phiên bàn sau khi khách thanh toán/dọn bàn.

Reset phiên bàn là nghiệp vụ quan trọng vì QR là cố định theo bàn. Nếu không đóng phiên cũ, khách mới có thể bị gán order vào phiên của khách trước.

### 3.4 Business rules quan trọng

| Rule | Nội dung |
|---|---|
| QR cố định theo bàn | Mỗi QR token đại diện cho một bàn vật lý |
| Order gắn với table session | Các order bổ sung trong cùng lượt khách được gom theo session |
| Khách không cần login | Customer flow chỉ cần QR token và client session |
| Không sửa order sau khi gửi | Gọi thêm tạo order mới trong cùng phiên |
| Chỉ đặt món `ACTIVE` | `SOLD_OUT` và `HIDDEN` không được submit thành order |
| Snapshot dữ liệu order | Order item lưu tên, giá, option tại thời điểm đặt |
| Chống trùng order | Dùng idempotency key khi submit |
| Admin/KDS được bảo vệ | API nội bộ cần auth và role phù hợp |

## 4. Giải pháp kỹ thuật

### 4.1 Tổng quan kiến trúc

Hệ thống hiện được tách thành frontend và backend:

```text
Customer Web App / KDS / Admin
        |
        v
Backend API Express
        |
        v
PostgreSQL/Supabase + Prisma
```

### 4.2 Frontend

Frontend nằm trong thư mục `web-prototype-react`.

**Stack chính:**

- React 19.
- TypeScript.
- Vite.
- React Router.
- TanStack React Query.
- Zustand.
- Playwright E2E.

**Các route chính:**

| Route | Đối tượng | Mục đích |
|---|---|---|
| `/qr/:qrToken` | Khách | Mở menu theo QR bàn |
| `/cart` | Khách | Xem giỏ hàng và submit order |
| `/order/:orderId/tracking` | Khách | Theo dõi trạng thái order |
| `/login` | Staff | Đăng nhập admin/kitchen |
| `/kds` | Kitchen/Admin | Màn hình bếp xử lý order |
| `/admin` | Admin | Dashboard |
| `/admin/menu` | Admin | Quản lý menu/danh mục |
| `/admin/tables` | Admin | Quản lý bàn/QR/reset phiên |

**Trạng thái tích hợp hiện tại:**

- Frontend đã có service layer gồm `apiClient`, `publicApi`, `internalApi`.
- Customer flow đã gọi API thật cho QR/menu/order/tracking.
- KDS/Admin đã chuyển sang auth thật và API nội bộ.
- Polling đang được dùng cho tracking/KDS thay vì WebSocket.

### 4.3 Backend

Backend nằm trong thư mục `backend-api`.

**Stack chính:**

- Node.js >= 20.
- Express 5.
- TypeScript.
- Prisma ORM.
- PostgreSQL/Supabase.
- JWT/Auth qua Supabase.
- Zod validation.
- Vitest + Supertest.
- Helmet, CORS, rate limit, pino logger.

**Route chính:**

| Nhóm route | Prefix | Mục đích |
|---|---|---|
| Health | `/health` | Kiểm tra server |
| Public customer | `/api/public` | QR resolve, menu, submit order, tracking |
| Auth | `/api/auth` | Login/logout/me |
| Internal | `/api/internal` | KDS, admin CRUD, tables, sessions, upload |

**Bảo mật tối thiểu đã có:**

- Helmet security headers.
- CORS theo `FRONTEND_URL`, cho localhost trong dev.
- Rate limit riêng cho public/auth/internal.
- Auth middleware cho internal API.
- Role guard cho `ADMIN`, `MANAGER`, `KITCHEN`.
- Server-side validation với Zod.

### 4.4 Database và model dữ liệu

Database được quản lý bằng Prisma schema. Các entity chính:

| Entity | Vai trò |
|---|---|
| `Store` | Quán/thực thể kinh doanh |
| `Branch` | Chi nhánh |
| `User`, `UserRole_Rel` | Tài khoản và role |
| `DiningTable` | Bàn vật lý và QR token |
| `TableSession` | Phiên phục vụ của một bàn |
| `Category` | Danh mục menu |
| `MenuItem` | Món ăn |
| `MenuOptionGroup`, `MenuOption` | Option món |
| `Order` | Đơn hàng |
| `OrderItem` | Chi tiết món trong đơn, có snapshot |
| `OrderStatusHistory` | Lịch sử đổi trạng thái |

Hệ thống đã có nền tảng multi-store/multi-branch ở mức dữ liệu, dù MVP chủ yếu dùng cho demo/pilot.

## 5. Tiến độ thực hiện

### 5.1 Giai đoạn tài liệu và phân tích

Dự án đã có bộ tài liệu trong `docs_prototype`, gồm:

- Phân tích dự án và định hướng sản phẩm.
- Quy trình nghiệp vụ thống nhất.
- PRD MVP và backlog.
- Kiến trúc kỹ thuật.
- Data model và API spec.
- Requirement traceability matrix.
- UAT/QA checklist.
- Báo cáo tổng kết và báo cáo testing.

Đánh giá: phần nghiệp vụ và scope MVP đã được mô tả khá đầy đủ, có thể dùng làm cơ sở bảo vệ với giáo viên hướng dẫn.

### 5.2 Giai đoạn prototype UI

Frontend đã có các màn hình chính:

- Menu mobile cho khách.
- Item detail sheet.
- Cart page.
- Tracking page.
- Login page.
- KDS page.
- Admin layout, dashboard, menu management, table management.

Ban đầu prototype có dùng mock/localStorage để chứng minh flow UI. Sau Sprint 4, frontend đã được chuyển sang API thật.

### 5.3 Giai đoạn backend/API

Backend MVP đã có:

- Prisma schema và migration.
- Seed data.
- Auth login/logout/me.
- Public QR/menu/order/tracking.
- Internal KDS active orders và status update.
- Admin CRUD categories/menu items/tables.
- Reset table session.
- Upload image endpoint.
- Test backend bằng Vitest/Supertest.

### 5.4 Giai đoạn tích hợp Sprint 4

Theo tracking file Sprint 4, mục tiêu là thay mock data bằng real API calls. Các hạng mục đã được thực hiện:

- Cài `axios`, `@tanstack/react-query`.
- Tạo API layer.
- Tạo auth store dùng sessionStorage.
- Cập nhật type API.
- Bảo vệ `/kds` và `/admin` bằng route guard.
- MenuPage, CartPage, TrackingPage, KDSPage, Admin pages gọi API thật.
- KDS/tracking dùng polling 3-5 giây.

### 5.5 Trạng thái hiện tại sau khi chuẩn hóa test ngày 23/04/2026

Sau khi chốt lại nghiệp vụ KDS và sửa các test FE/E2E bị lệch implementation, số liệu kiểm thử mới nhất như sau:

| Lớp test | Framework | Tổng | Pass | Fail | Skip | Ghi chú |
|---|---:|---:|---:|---:|---:|---|
| Backend | Vitest + Supertest | 99 | 99 | 0 | 0 | Đã cập nhật `KDS-02` theo rule KDS giữ `SERVED` trong ngày |
| Frontend E2E | Playwright Chromium | 55 | 54 | 0 | 1 | Đã sửa endpoint, auth helper, selector, toast, quick-add và dashboard order row |

Nhận xét:

- Backend đã pass toàn bộ 99/99 test sau khi cập nhật expectation của `KDS-02` theo nghiệp vụ đã chốt.
- Frontend E2E đã pass toàn bộ các test chạy được: 54 pass, 1 skip có chủ đích, 0 fail.
- Rule KDS hiện tại: board hiển thị `NEW`, `PREPARING`, `READY` và `SERVED` trong ngày hiện tại; sang ngày mới, đơn `SERVED` cũ không còn hiện trên KDS.
- Không ghi nhận hệ thống "bug-free tuyệt đối", nhưng có thể ghi nhận core MVP đã có bằng chứng test tự động ổn định ở thời điểm 23/04/2026.

## 6. Kiểm thử và đánh giá

### 6.1 Backend testing

Backend có 6 nhóm test:

- `auth.test.ts`.
- `admin_crud.test.ts`.
- `orders.test.ts`.
- `public.test.ts`.
- `sessions.test.ts`.
- `e2e.test.ts`.

Lần chạy mới nhất trong phiên làm việc này:

```text
Test files: 6 passed, total 6
Tests: 99 passed, total 99
```

Điểm đã chuẩn hóa trong backend test:

- `KDS-02` được đổi từ kỳ vọng "active orders chỉ gồm `NEW/PREPARING/READY`" sang "KDS board hiển thị đơn đang xử lý và đơn `SERVED` trong ngày".
- `SESSION-06` được sửa dữ liệu test để chọn món `ACTIVE` không có required option, tránh gửi order thiếu option và nhận `400 INVALID_OPTION`.

Rule backend hiện tại của `/api/internal/orders/active`:

- `NEW`, `PREPARING`, `READY` không giới hạn ngày.
- `SERVED` trong ngày hiện tại.
- Không lấy `CANCELLED`.

Rule này khớp với nghiệp vụ KDS: bếp/quầy cần thấy cột "Đã phục vụ" trong ngày để đối soát cuối ca, nhưng không giữ đơn đã phục vụ từ ngày cũ.

### 6.2 Frontend E2E testing

Playwright test được chia theo nhóm:

- Admin.
- Customer.
- Kitchen/KDS.
- Full-flow.

Lần chạy mới nhất:

```text
55 tests
54 passed
0 failed
1 skipped
```

Các nhóm đã sửa để FE E2E xanh:

- Auth helper dùng đúng `/api/auth/login`, cache login để tránh rate limit và inject đúng `sessionStorage`.
- Test API menu dùng đúng `/api/public/branches/:branchId/menu`.
- Toast có class `.toast` để Playwright bắt được thông báo thao tác.
- Test tạo order đọc đúng response shape `data.order ?? data`.
- Quick-add customer flow chọn món active, tránh món sold out/required option không phù hợp.
- Dashboard Admin có selector ổn định `.order-history-row` và `.order-detail` thay cho selector table cũ.

| Nhóm kiểm thử | Trạng thái |
|---|---|
| Customer | Pass menu, cart, submit order, tracking, gọi thêm món, cancelled/served state |
| KDS | Pass login, board 4 cột, polling, state machine `NEW -> PREPARING -> READY -> SERVED`, cancel |
| Admin | Pass login/RBAC, dashboard, menu CRUD/status, table/reset session flow |
| Full-flow | Pass customer đặt món -> kitchen xử lý -> admin xem dashboard |

Kết luận kiểm thử frontend: bộ E2E hiện đã khớp implementation và pass theo lần chạy mới nhất. Một test skip còn lại là skip có điều kiện theo dữ liệu/chức năng phụ, không phải fail.

## 7. Đánh giá hiện trạng dự án

### 7.1 Điểm đã đạt

- Có bộ tài liệu nghiệp vụ và kỹ thuật khá đầy đủ cho một đồ án.
- MVP có scope rõ, tập trung vào core ordering thay vì mở rộng quá sớm.
- Frontend có đầy đủ 3 vùng trải nghiệm: Customer, KDS, Admin.
- Backend đã có data model, API, auth, RBAC và test automation.
- Đã có cấu hình deploy mẫu cho backend/frontend.
- Đã có ý thức bảo mật env qua `.env.example`, `.env.production.example` và tài liệu rotation.

### 7.2 Điểm cần hoàn thiện

- Cần chuẩn hóa README/hướng dẫn chạy local để người khác có thể dựng backend, frontend và database theo đúng thứ tự.
- Cần hoàn thiện tài liệu deploy production, đặc biệt là danh sách biến môi trường, nơi cấu hình secret và quy trình rotate secret.
- Cần giữ test evidence mới nhất trong repo để tránh nhầm với báo cáo test cũ.
- Cần kiểm tra lại dữ liệu seed/demo trước buổi báo cáo để đảm bảo flow QR -> Menu -> Cart -> Order -> KDS -> Tracking luôn có dữ liệu phù hợp.
- Cần chuẩn bị demo script ngắn cho giáo viên, gồm tài khoản admin/kitchen demo và QR token mẫu.

## 8. Rủi ro và hướng phát triển

### 8.1 Rủi ro

| Rủi ro | Mức độ | Tác động | Hướng giảm thiểu |
|---|---|---|---|
| Phụ thuộc Supabase/env credentials | Cao | Backend/test/deploy có thể fail nếu secret hết hạn | Quy trình rotation, không commit secret, dùng env production/staging riêng |
| E2E bị lệch implementation khi UI/API đổi | Trung bình | Có thể tạo fail giả nếu test không được cập nhật theo code | Duy trì selector ổn định, cập nhật helper test khi đổi API |
| Polling chưa tối ưu bằng realtime push | Trung bình | Có độ trễ 3-5 giây | Chấp nhận cho MVP, nâng cấp SSE/WebSocket sau |
| Test và spec có thể lệch khi nghiệp vụ thay đổi | Trung bình | Fail giả hoặc kết luận sai | Ghi rõ rule nghiệp vụ và cập nhật test cùng lúc với thay đổi spec |
| Deploy production cần bảo mật secret | Cao | Lộ token/database URL nếu thao tác sai | Dùng env trên hosting, không đưa `.env` vào tài liệu nộp |

### 8.2 Hướng phát triển tiếp theo

**Ngắn hạn:**

- Chuẩn hóa README chạy local/deploy.
- Hoàn thiện demo script cho giáo viên.
- Rà soát `.env.example`, `.env.production.example` và tài liệu rotation secret.
- Chốt dữ liệu seed/demo ổn định cho buổi trình bày.
- Nếu có thời gian, bổ sung ảnh chụp màn hình hoặc video ngắn làm bằng chứng demo.

**Trung hạn:**

- Tạo QR export thành ảnh/PDF để in dán lên bàn.
- Thêm thông báo âm thanh/push cho KDS khi có order mới.
- Thêm báo cáo doanh thu, top món bán chạy, thời gian xử lý trung bình.
- Cải thiện upload ảnh món và CDN/storage.

**Dài hạn:**

- Tích hợp thanh toán online.
- Tích hợp POS.
- Quản lý kho/nguyên liệu.
- Multi-branch đầy đủ.
- AI gợi ý món/upsell dựa trên lịch sử order.

## 9. Kết luận để báo cáo giáo viên hướng dẫn

Dự án "Bếp Nhà Mình" đang đi theo hướng đúng với mục tiêu đồ án: giải quyết một bài toán thực tế trong lĩnh vực F&B bằng một hệ thống web có quy trình nghiệp vụ rõ ràng. MVP không cố gắng làm đầy đủ tất cả chức năng của POS, mà tập trung vào luồng đặt món tại bàn bằng QR, truyền đơn đến bếp, cập nhật trạng thái và quản lý menu/bàn.

Về mặt kỹ thuật, dự án đã vượt qua mức prototype UI đơn thuần: backend Express/Prisma/PostgreSQL đã được xây dựng, frontend React đã tích hợp API thật, có auth/RBAC, có test backend và E2E frontend. Kết quả kiểm thử mới nhất cho thấy core MVP đã ổn định ở mức có thể demo/báo cáo: backend đạt 99/99 test pass, frontend E2E đạt 54 pass, 1 skip có chủ đích và 0 fail.

Hướng đi tiếp theo nên là đóng băng scope MVP, chuẩn hóa tài liệu chạy/deploy, chuẩn bị demo script và chỉ bổ sung các cải tiến nhỏ phục vụ báo cáo. Các tính năng lớn như payment, POS, kho và AI nên để ở phase sau để tránh làm phình scope và ảnh hưởng chất lượng core ordering.

## 10. Phụ lục: Nguồn đối chiếu trong repo

Báo cáo này được tổng hợp từ các nhóm file sau:

- `docs_prototype/01_phan_tich_du_an_va_dinh_huong_san_pham.md`.
- `docs_prototype/02_quy_trinh_nghiep_vu_thong_nhat.md`.
- `docs_prototype/03_prd_mvp_va_backlog_po.md`.
- `docs_prototype/05_kien_truc_ky_thuat_cto.md`.
- `docs_prototype/06_data_model_api_spec.md`.
- `docs_prototype/13_tong_ket_du_an_bao_cao_pm_po_ba.md`.
- `docs_prototype/15_final_testing_report.md`.
- `SPRINT4_PROGRESS.md`.
- `TEST_BUG_REPORT.md`.
- `FE_BUGFIX_REPORT_2026-04-23.md`.
- `backend-api/package.json`.
- `backend-api/prisma/schema.prisma`.
- `backend-api/src/app.ts`.
- `web-prototype-react/package.json`.
- `web-prototype-react/src/App.tsx`.
- `web-prototype-react/src/services/publicApi.ts`.
- `web-prototype-react/src/services/internalApi.ts`.
- Kết quả chạy lại `npm test` trong `backend-api` và `web-prototype-react` ngày 23/04/2026.
- Log kiểm chứng: `test_run_backend_after_kds_session_fix_raw.txt`, `test_run_playwright_after_dashboard_fix_raw.txt`.
