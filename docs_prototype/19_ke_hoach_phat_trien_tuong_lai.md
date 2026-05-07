# Kế Hoạch Phát Triển Tương Lai — Bếp Nhà Mình

> **Phiên bản:** 1.0  
> **Ngày:** 29/04/2026  
> **Người tổng hợp:** Nhóm phát triển  
> **Nguồn tham chiếu:** `03_prd`, `09_ai_phase2`, `13_tong_ket`, `14_be_mvp_spec`, `16_staff_cleanup`, `17_phase2_online_ordering_spec`, `SPRINT4_PROGRESS`

---

## Trạng Thái Hiện Tại

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Prototype toàn bộ UI | ✅ Hoàn thành | Mock data Zustand/localStorage |
| Backend API + Database | ✅ Hoàn thành | 99/99 test pass, Supabase + Railway |
| Frontend tích hợp API | ✅ Hoàn thành | 54 E2E test pass |
| Online ordering (Phase 2) | ✅ Hoàn thành | Landing, Menu, Cart, Tracking, Shipper |
| Auth JWT + localStorage persist | ✅ Hoàn thành | Không hỏi lại khi mở tab mới |
| Admin Staff Management UI | ✅ Hoàn thành | `/admin/staff` — tạo/khóa nhân viên |

---

## Phase A — Admin Cleanup & Hoàn Thiện Vận Hành

> **Ưu tiên:** 🔴 Cao — nên làm ngay  
> **Ước tính:** 1–2 tuần  
> **Nguồn:** `16_staff_account_admin_cleanup_plan.md` — Sprint A

### A.1 Xóa Mềm Menu Item và Category

Hiện tại hệ thống chưa có nút "Xóa" rõ ràng trong Admin Menu. Nguyên tắc **không hard delete** bất kỳ dữ liệu nào có liên quan đến order history.

| Tính năng | Mô tả | UI |
|---|---|---|
| Ẩn món ăn | Set `status = HIDDEN`, không hard delete | Nút "Xóa khỏi menu" trong `AdminMenuPage` |
| Khôi phục món | Filter "Đã ẩn" → nút "Khôi phục" | Filter mới trong `AdminMenuPage` |
| Ẩn danh mục | Confirm ẩn cả món con nếu còn món hiển thị | Modal confirm |
| Khôi phục danh mục | Category về ACTIVE, món con giữ nguyên trạng thái | Nút "Khôi phục" |

**Trạng thái menu item:**

| Trạng thái | Khách thấy | Admin thấy |
|---|---|---|
| `ACTIVE` | ✅ Có | ✅ Có |
| `SOLD_OUT` | ✅ Có (disabled) | ✅ Có |
| `HIDDEN` | ❌ Không | ✅ Có (qua filter) |

**Rule quan trọng:**
- Không dùng chữ "Xóa vĩnh viễn" trong UI
- Tooltip phải ghi rõ: _"Dữ liệu lịch sử order không bị xóa"_
- Khi ẩn category còn món hiển thị → confirm: _"Danh mục này còn món đang hiển thị. Bạn muốn ẩn cả danh mục và toàn bộ món bên trong không?"_

---

### A.2 Xóa Mềm và Quản Lý Bàn/QR

| Tính năng | Mô tả | Điều kiện |
|---|---|---|
| Ngừng sử dụng bàn | Set `status = INACTIVE` | Bàn không có session/order đang xử lý |
| Khôi phục bàn | Set `ACTIVE` lại, QR cũ hoạt động ngay | Không cần in lại QR |
| Filter trạng thái bàn | Tab: Tất cả / Đang dùng / Ngừng sử dụng | `AdminTablesPage` |
| Export QR PDF | Xuất file QR image/PDF cho từng bàn để in dán | `AdminTablesPage` — phase A hoặc B |

**Chặn xóa bàn khi:**
- Bàn có `TableSession.status = OPEN`
- Bàn có order đang ở trạng thái `NEW`, `PREPARING`, `READY`

**Regenerate QR** (làm sau, chỉ ADMIN):
```
Đổi mã QR sẽ làm mã QR đã in trước đó không còn dùng được.
Bạn chắc chắn muốn đổi?
```

---

### A.3 Hoàn Thiện Staff Management

| Tính năng | Trạng thái | Ghi chú |
|---|---|---|
| Tạo tài khoản nhân viên | ✅ Done | Admin tạo, dùng temporary password |
| Khóa/mở tài khoản | ✅ Done | `isActive = false` |
| SMTP invite email | ⬜ Chưa làm | Gửi link reset password qua email thật |
| Rule không khóa admin cuối | ⬜ Chưa làm | Backend phải check còn ≥1 ADMIN active |
| Rollback atomic Supabase + DB | ⬜ Chưa làm | Nếu tạo DB fail → rollback Supabase auth |

**API bổ sung:**

```
POST /api/internal/users/:id/reset-password   ← Gửi link đặt lại mật khẩu
POST /api/internal/tables/:id/regenerate-qr  ← Đổi QR token (Phase sau)
```

---

## Phase B — Tính Năng Nâng Cao (Trung Hạn)

> **Ước tính:** 4–6 tuần  
> **Nguồn:** `13_tong_ket_du_an.md` — Phase 2 Roadmap

### B.1 WebSocket Thay Polling

Hiện tại KDS và Tracking đang dùng polling (15s và 3s). Khi quy mô tăng, nên chuyển sang realtime push.

| Thành phần | Hiện tại | Mục tiêu |
|---|---|---|
| KDS | Polling 15s | WebSocket — nhận đơn ngay khi tạo |
| Tracking | Polling 3s | WebSocket / SSE — push status update |
| Shipper | Polling 15s | WebSocket — nhận đơn DELIVERING ngay |
| Admin Delivery | Polling 15s | WebSocket — cập nhật bản đồ đơn |

**2 phương án:**

| Phương án | Ưu điểm | Nhược điểm |
|---|---|---|
| **Socket.io** (custom BE) | Linh hoạt, kiểm soát tốt | Phải tự maintain |
| **Supabase Realtime** (built-in) | Không cần thêm server, free tier rộng | Phụ thuộc Supabase |

> **Khuyến nghị:** Dùng Supabase Realtime nếu giữ Supabase làm database. Chuyển sang Socket.io khi scale lên nhiều quán.

---

### B.2 Web Push Notification

Bếp và server cần nhận alert ngay khi có đơn mới, không cần nhìn vào màn hình KDS liên tục.

| Use case | Mô tả |
|---|---|
| Đơn mới vào bếp | Push notification đến thiết bị KDS khi order = ACCEPTED |
| Đơn sẵn sàng giao | Notification đến shipper khi order = SERVING/DELIVERING |
| Đơn bị hủy | Alert bếp nếu đơn đang PREPARING bị cancel |

**Công nghệ:** Web Push API (browser) + Service Worker  
**Backend:** `web-push` npm package  
**Lưu:** Subscription token của thiết bị trong DB

---

### B.3 Thanh Toán Online

Đây là tính năng có yêu cầu pháp lý và tích hợp phức tạp nhất.

| Cổng thanh toán | Ưu điểm | Phí |
|---|---|---|
| **VNPay** | Phổ biến nhất tại VN, hỗ trợ tốt | ~1.1–1.5% per transaction |
| **Momo** | Người dùng trẻ, UX tốt | ~1.5% per transaction |
| **ZaloPay** | Phổ biến TP.HCM | ~1.2% per transaction |

**Luồng đề xuất:**
```
Khách chọn "Thanh toán online" → Redirect đến cổng thanh toán
→ Callback webhook → BE verify → Order status = PAID
→ KDS nhận đơn → Tiếp tục luồng bình thường
```

**Phải làm trước khi tích hợp:**
- Đăng ký tài khoản merchant với cổng thanh toán
- Cấu hình webhook URL production
- Test với sandbox environment đầy đủ
- Handle case: thanh toán thành công nhưng webhook lỗi (idempotency)

---

### B.4 In Hóa Đơn Nhiệt

| Hạng mục | Mô tả |
|---|---|
| Protocol | ESC/POS (chuẩn phổ biến nhất cho máy in nhiệt) |
| Kết nối | USB hoặc Network (IP) tùy máy in |
| Thư viện | `node-thermal-printer` hoặc `escpos` npm |
| Trigger | Admin bấm "In hóa đơn" trên đơn đã SERVED/DELIVERED |

**Nội dung hóa đơn tối thiểu:**
```
--- BẾP NHÀ MÌNH ---
Bàn: 03 | Mã đơn: B03-007
Thời gian: 12:30 - 28/04/2026

Bún bò đặc biệt (L)  ×2   120,000đ
Trà đào              ×1    35,000đ
─────────────────────────────
TỔNG:                       155,000đ
Cảm ơn quý khách!
```

---

### B.5 Báo Cáo Doanh Thu

Admin Dashboard hiện tại đã có lịch sử đơn theo ngày. Cần bổ sung biểu đồ trực quan.

| Tính năng | Mô tả | Thư viện |
|---|---|---|
| Biểu đồ doanh thu theo ngày/tuần/tháng | Bar chart | Recharts hoặc Chart.js |
| Top 10 món bán chạy | Horizontal bar | Recharts |
| Số đơn theo giờ trong ngày | Line chart | Recharts |
| Tỷ lệ hủy đơn | Pie chart | Recharts |
| Export báo cáo | Xuất CSV/Excel | `xlsx` npm |

---

### B.6 Nâng Cấp Tính Khoảng Cách Giao Hàng

Hiện tại hệ thống dùng **Haversine (đường chim bay)** — thuần toán học, miễn phí nhưng sai lệch ~20-30% so với đường đi thực tế.

**2 phương án nâng cấp:**

| Phương án | Độ chính xác | Chi phí | Yêu cầu |
|---|---|---|---|
| **Google Maps Distance Matrix API** | Cao (+20-30%) | Free đến 1.000 req/tháng, sau đó tính tiền | API key, billing enabled |
| **OSRM (Open Source Routing Machine)** | Tốt | Hoàn toàn miễn phí | Tự host, tải OpenStreetMap data |

**Khuyến nghị:** Bắt đầu với Google Maps API (đủ dùng cho quy mô nhỏ), chuyển OSRM khi lượng request vượt free tier.

---

### B.7 Quản Lý Option Groups Trong Admin

Hiện tại option groups (size, topping, mức đường...) chỉ có thể quản lý qua database trực tiếp. Cần thêm UI trong `AdminMenuPage`.

| Tính năng | Mô tả |
|---|---|
| Xem danh sách option groups | Theo từng món |
| Tạo option group mới | Tên, loại (single/multi), bắt buộc hay không |
| Thêm option vào group | Tên option, giá chênh lệch |
| Xóa mềm option | Ẩn khỏi menu, giữ lịch sử |
| Gắn option group vào món | Nhiều món dùng chung 1 group |

---

### B.8 Lịch Sử Đơn Cho Khách (Loyalty Prep)

Cho phép khách đặt hàng tùy chọn đăng nhập để xem lại đơn cũ.

| Tính năng | Mô tả |
|---|---|
| Đăng ký/đăng nhập bằng SĐT | OTP qua SMS |
| Xem lịch sử đơn | Tối thiểu 30 ngày gần nhất |
| Đặt lại đơn cũ | 1-click re-order |
| Chuẩn bị cho Loyalty | Tích lũy điểm theo giá trị đơn |

---

## Phase C — Mở Rộng Quy Mô (Dài Hạn)

> **Ước tính:** 3–6 tháng  
> **Nguồn:** `13_tong_ket_du_an.md` — Phase 3 Roadmap

### C.1 Multi-Cơ Sở

| Tính năng | Mô tả |
|---|---|
| Một tài khoản quản lý nhiều quán | Store hierarchy: Platform → Store → Branch |
| Dashboard tổng hợp nhiều chi nhánh | Doanh thu, đơn, nhân viên theo branch |
| Phân quyền cross-branch | Manager chỉ thấy branch mình phụ trách |
| Config riêng mỗi branch | Menu, giờ mở cửa, vùng giao hàng |

**Lý do chưa làm ngay:**
> Hệ thống đã có `storeId`/`branchId` trong data model, nhưng chưa có lớp "platform owner/onboarding". Mở sớm kéo theo nghiệp vụ billing, tenant isolation mạnh hơn, và platform admin dashboard.

---

### C.2 Self-Service Signup Chủ Quán

Cho phép chủ quán mới tự đăng ký online, không cần admin tạo tay.

**Luồng:**
```
Chủ quán truy cập trang đăng ký
→ Nhập thông tin quán (tên, địa chỉ, SĐT)
→ Tạo tài khoản admin đầu tiên
→ Hệ thống tự tạo Store + Branch mặc định
→ Xác thực email
→ (Tùy chọn) Chọn gói dịch vụ, thanh toán
→ Vào dashboard và bắt đầu setup menu/bàn
```

**Phải làm trước:**
- Thiết kế gói dịch vụ (free/pro/enterprise)
- Giới hạn số nhân viên, bàn theo gói
- SMTP email verification
- Platform Admin dashboard để duyệt/khóa store

---

### C.3 App KDS Native (React Native)

Màn hình KDS hiện tại là web app. Khi triển khai thực tế tại quán, tablet bếp cần trải nghiệm mượt mà hơn.

| Tính năng | Mô tả |
|---|---|
| App native Android/iOS | React Native (dùng lại logic + API) |
| Offline mode | Cache đơn khi mạng yếu, sync lại khi có mạng |
| Notification native | Push notification thay vì Web Push |
| Màn hình luôn bật | Giữ màn hình sáng, không timeout |
| Hỗ trợ landscape | Tối ưu tablet 10" nằm ngang |

---

### C.4 AI Gợi Ý Món

> Chi tiết đầy đủ trong: `09_ai_phase_2_prompt_knowledge_design.md`

**Use cases:**

| Use case | Mô tả | Phase |
|---|---|---|
| Hỏi thông tin món | Thành phần, mức cay, phù hợp trẻ em, chay | Phase 2 (B) |
| Gợi ý món | Dựa trên nhu cầu: ít cay, ăn nhanh, healthy | Phase 2 (B) |
| Upsell/cross-sell | Gợi ý đồ uống/món kèm | Phase 2 (B) |
| AI gợi ý nâng cao | Dựa trên lịch sử order + thời tiết/giờ | Phase 3 (C) |

**API đề xuất:**
```
POST /api/public/ai/menu-chat       ← Khách hỏi/gợi ý
GET  /api/admin/ai/knowledge-check  ← Kiểm tra menu thiếu data AI
POST /api/admin/ai/reindex-menu     ← Cập nhật sau khi đổi menu
```

**Guardrails bắt buộc (không được vi phạm):**

| ID | Rule |
|---|---|
| AI-01 | Chỉ trả lời dựa trên dữ liệu menu/quán được cung cấp |
| AI-02 | Không bịa giá, thành phần, tồn kho, khuyến mãi |
| AI-03 | Không tự thêm món vào giỏ nếu khách chưa xác nhận |
| AI-04 | Nói rõ khi không chắc hoặc thiếu dữ liệu |
| AI-05 | Không đưa lời khuyên y tế/dị ứng chắc chắn → khuyên hỏi nhân viên |
| AI-06 | Không gợi ý món `SOLD_OUT` như món có thể đặt |

**Điều kiện bắt đầu tích hợp AI thật:**
- [ ] Core ordering đã ổn định ✅
- [ ] Menu data đủ tags, ingredients, allergens
- [ ] Có UX vị trí AI hợp lý (không che CTA chính)
- [ ] Có tracking để đo AI tăng conversion không
- [ ] Guardrails đã được review kỹ

---

### C.5 Loyalty Program

| Tính năng | Mô tả |
|---|---|
| Tích điểm | 1 điểm / 1.000đ giá trị đơn |
| Đổi điểm | Voucher giảm giá, món miễn phí |
| Birthday offer | Voucher tự động vào sinh nhật |
| Tier hạng thành viên | Bạc / Vàng / Kim cương theo tổng chi tiêu |
| Referral | Giới thiệu bạn bè nhận điểm |

---

### C.6 POS Integration

| Hệ thống | Ghi chú |
|---|---|
| **KiotViet** | Phổ biến nhất tại VN — có open API |
| **MISA** | Phổ biến với kế toán/nhà hàng vừa |
| **Square** | Nếu mở rộng quốc tế |

**Dữ liệu cần sync hai chiều:**
- Menu items (giá, trạng thái)
- Orders (tạo đơn từ web → POS)
- Inventory (tồn kho món)

---

### C.7 Review & Rating

| Tính năng | Mô tả |
|---|---|
| Đánh giá sau bữa ăn | Link gửi sau khi order DELIVERED |
| Rating từng món | 1-5 sao, có thể kèm ảnh |
| Phản hồi công khai | Hiển thị trên landing page/menu |
| Alert đánh giá xấu | Notification admin khi ≤2 sao |

---

## Tóm Tắt Roadmap Theo Thứ Tự Ưu Tiên

```
┌─────────────────────────────────────────────────────┐
│  PHASE A — Ngay bây giờ (1–2 tuần)                  │
│  ├── Ẩn/xóa mềm món, category, bàn                  │
│  ├── Filter trạng thái trong Admin                   │
│  ├── Confirm modal xóa có hướng dẫn                 │
│  └── SMTP invite email nhân viên                     │
├─────────────────────────────────────────────────────┤
│  PHASE B — Trung hạn (1–3 tháng)                    │
│  ├── B.1 WebSocket thay polling                      │
│  ├── B.2 Web Push Notification                       │
│  ├── B.3 Thanh toán VNPay/Momo/ZaloPay              │
│  ├── B.4 In hóa đơn nhiệt (ESC/POS)                 │
│  ├── B.5 Báo cáo doanh thu + biểu đồ                │
│  ├── B.6 Google Maps / OSRM khoảng cách thực        │
│  ├── B.7 Quản lý Option Groups trong Admin           │
│  └── B.8 Lịch sử đơn cho khách (Loyalty prep)       │
├─────────────────────────────────────────────────────┤
│  PHASE C — Dài hạn (3–6 tháng)                      │
│  ├── C.1 Multi-cơ sở (nhiều quán)                   │
│  ├── C.2 Self-service signup chủ quán               │
│  ├── C.3 App KDS native (React Native)              │
│  ├── C.4 AI gợi ý món (LLM thật)                    │
│  ├── C.5 Loyalty Program                             │
│  ├── C.6 POS Integration (KiotViet/MISA)            │
│  └── C.7 Review & Rating                            │
└─────────────────────────────────────────────────────┘
```

---

## Những Thứ Cố Ý Không Làm Trong Phase Hiện Tại

> Các hạng mục dưới đây đã được quyết định **bỏ qua có chủ ý**, không phải bỏ sót.

| Hạng mục | Lý do | Phase phù hợp |
|---|---|---|
| Thanh toán online | Yêu cầu pháp lý, tích hợp merchant phức tạp | B.3 |
| In hóa đơn | Phụ thuộc phần cứng (máy in nhiệt) | B.4 |
| WebSocket | Polling đủ dùng ở quy mô hiện tại | B.1 |
| AI LLM thật | Core ordering chưa ổn thì AI không tạo giá trị bền | C.4 |
| Multi-cơ sở đầy đủ | Cần thiết kế DB và billing phức tạp hơn | C.1 |
| Self-service signup | Cần platform admin và email verification | C.2 |
| Regenerate QR | Nếu QR đã in → đổi token làm QR cũ chết | A.2 (cẩn thận) |
| Hard delete bất kỳ | Mất lịch sử order, báo cáo sai | Không làm |
| POS sync | Phụ thuộc hệ thống ngoài, cần API partner | C.6 |
| Quản lý kho nguyên liệu | Nghiệp vụ sâu hơn (món - nguyên liệu) | Ngoài phạm vi |

---

## Điều Kiện Deploy Production

Trước khi đưa bất kỳ phase nào lên production, phải đảm bảo:

- [ ] Tất cả Critical & High test cases trong `18_test_plan_toan_cuc.md` PASS
- [ ] CORS config đúng domain production
- [ ] ENV variables đầy đủ trên Railway & Vercel
- [ ] Database migrations đã chạy
- [ ] Rate limiting hoạt động
- [ ] Không có `console.error` unhandled trong FE
- [ ] Smoke test end-to-end trên staging trước

---

*Tài liệu này được tổng hợp từ toàn bộ docs_prototype và cập nhật sau Sprint 4 (23/04/2026).*  
*Cập nhật cuối: 29/04/2026*
