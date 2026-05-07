# Phase 2 — Online Ordering (Đặt hàng giao tận nơi)
## Bếp Nhà Mình · Tài liệu kỹ thuật tổng hợp từ code thực tế

> **Trạng thái:** Đang triển khai  
> **Viết từ:** Phân tích trực tiếp source code BE + FE (28/04/2026)  
> **Audience:** PM, BA, Dev, QA

---

## 1. Bối cảnh và phạm vi Phase 2

Phase 1 hoàn thiện luồng **dine-in** (đặt món tại bàn qua QR). Phase 2 bổ sung kênh **online delivery** — khách đặt từ web, quán xử lý và giao hàng tận nơi.

### 1.1. So sánh Phase 1 và Phase 2

| Tiêu chí | Phase 1 — Dine-in | Phase 2 — Online Delivery |
|---|---|---|
| Kênh đặt | Quét QR tại bàn | Web app công khai `/order-online` |
| Xác định khách | Token bàn vô danh | Tên + SĐT + địa chỉ giao |
| Trạng thái đơn | NEW → PREPARING → READY → SERVED | + `deliveryStatus` riêng (6 bước) |
| Phí giao | Không có | Haversine, cấu hình per-branch |
| Thanh toán | Tiền mặt tại quán | COD — tiền mặt khi nhận |
| Table/Session | Bắt buộc | **Không có** (tableId = null) |
| Mã đơn | Format `B05-001` | Format `ONL-XXXXXXXX` |

---

## 2. Luồng nghiệp vụ — Phía Khách hàng

### 2.1. Tổng quan flow

```
/order-online (Landing)
  └─ Đặt ngay
      └─ Step 1: Chọn món
      └─ Step 2: Nhập địa chỉ + GPS → estimate phí ship
            ├─ Trong vùng → tiếp tục
            └─ Ngoài vùng → thông báo, dừng
      └─ Step 3: Xác nhận đơn
            └─ Submit → BE validate + tạo order
                  └─ /order-online/track/:orderId
                        └─ Polling 30s cập nhật trạng thái
```

### 2.2. Chi tiết 3 bước (OnlineOrderPage.tsx)

| Bước | Tên | Nội dung | Đầu ra |
|---:|---|---|---|
| 1 | Chọn món | Menu theo danh mục, thêm giỏ (option + ghi chú) | Giỏ hàng |
| 2 | Thông tin giao | Tên, SĐT, địa chỉ, GPS tự động, ước tính phí ship | Địa chỉ hợp lệ trong vùng |
| 3 | Xác nhận | Review món, địa chỉ, phí ship, tổng | Submit đơn |

### 2.3. Trang tracking (OnlineTrackingPage.tsx)

- Route: `/order-online/track/:orderId`
- Polling: 30 giây
- Stepper 4 bước cho khách: **Đã đặt → Đang nấu → Đang giao → Đã giao**
- CANCELLED: màn thông báo riêng với band màu đỏ

---

## 3. Luồng nghiệp vụ — Phía Admin

### 3.1. Vòng đời deliveryStatus

```
[Khách submit]
     ↓
  PENDING ──────────────────────────────────────→ CANCELLED
     ↓ Admin xác nhận
  ACCEPTED ─────────────────────────────────────→ CANCELLED
     ↓ Bếp bắt đầu
  PREPARING ────────────────────────────────────→ CANCELLED
     ↓ Shipper lấy hàng
  DELIVERING
     ↓ Giao xong
  DELIVERED (trạng thái cuối)
```

### 3.2. Đồng bộ trạng thái Admin ↔ Kitchen ↔ Khách

| deliveryStatus | Nhãn Admin | order.status | Khách thấy |
|---|---|---|---|
| PENDING | Chờ xác nhận | NEW | Đã đặt |
| ACCEPTED | Đã xác nhận | NEW | Đã đặt |
| PREPARING | Đang chuẩn bị | PREPARING | Đang nấu |
| DELIVERING | Đang giao | READY | Đang giao |
| DELIVERED | Đã giao | SERVED | Đã giao |
| CANCELLED | Đã hủy | giữ nguyên | Đơn bị hủy |

> **Cơ chế:** Khi Admin PATCH deliveryStatus, BE atomically cập nhật cả `deliveryInfo.deliveryStatus` và `order.status`, đồng thời tạo bản ghi `order_status_history`.

### 3.3. AdminDeliveryPage (`/admin/delivery`)

- Polling tự động 30 giây
- Tabs lọc: Tất cả / Chờ xác nhận / Đã xác nhận / Đang chuẩn bị / Đang giao / Đã giao / Đã hủy
- Mỗi card đơn hiển thị:
  - Mã đơn + giờ đặt
  - Tên + SĐT khách (tap-to-call)
  - Địa chỉ giao (phường, quận)
  - Khoảng cách km
  - Số món + phí ship + tổng thu
  - **Nút chuyển bước tiếp** (1 tap, màu theo trạng thái)
  - **Nút Hủy** (confirm dialog)

### 3.4. AdminBranchSettingsPage (`/admin/branch-settings`)

Admin cấu hình cho mỗi chi nhánh:
- Tọa độ quán (lat/lng) — dùng để tính khoảng cách đến khách
- Bán kính cơ bản (km) — phí cố định áp dụng trong bán kính này
- Phí cơ bản (VNĐ) — phí ship tối thiểu
- Phí mỗi km vượt (VNĐ/km)
- Bán kính giao tối đa (km) — từ chối đơn ngoài vùng
- Preview bảng phí trực tiếp khi chỉnh số

---

## 4. Bảng phí giao hàng

### 4.1. Công thức (geo.utils.ts — Haversine)

```
Nếu distance ≤ baseKm:
    phí = baseFee

Nếu baseKm < distance ≤ maxKm:
    phí = baseFee + ⌈(distance - baseKm) × feePerKm⌉

Nếu distance > maxKm:
    → Từ chối (OUT_OF_RANGE)
```

### 4.2. Cấu hình mặc định

| Tham số | Giá trị | Ghi chú |
|---|---|---|
| deliveryBaseKm | 2 km | Bán kính phí cố định |
| deliveryBaseFee | 15.000đ | Phí tối thiểu |
| deliveryFeePerKm | 5.000đ/km | Phí mỗi km vượt |
| deliveryMaxKm | 10 km | Bán kính giao tối đa |

### 4.3. Bảng phí mẫu

| Khoảng cách | Phí ship |
|---|---|
| 0 – 2 km | 15.000đ |
| 3 km | 20.000đ |
| 5 km | 30.000đ |
| 7 km | 40.000đ |
| 10 km | 55.000đ |
| > 10 km | Ngoài vùng giao |

> **Anti-tampering:** BE luôn tính lại phí ship từ tọa độ GPS thực tế và ghi đè giá trị FE gửi lên khi có đủ dữ liệu.

---

## 5. Data Model bổ sung Phase 2

### 5.1. Bảng `delivery_info` (1-1 với orders)

| Column | Type | Ghi chú |
|---|---|---|
| id | UUID | PK |
| orderId | UUID | FK unique → orders.id |
| customerName | String | Tên người nhận |
| phone | String | SĐT VN — regex `0[3-9]\d{8}` |
| address | String | Địa chỉ đầy đủ |
| ward | String? | Phường/Xã |
| district | String? | Quận/Huyện |
| customerLat | Float? | Vĩ độ GPS khách |
| customerLng | Float? | Kinh độ GPS khách |
| distanceKm | Float? | Khoảng cách tính được |
| shippingFee | Int | Phí ship đã xác nhận (VNĐ) |
| deliveryStatus | Enum | PENDING/ACCEPTED/PREPARING/DELIVERING/DELIVERED/CANCELLED |
| note | String? | Ghi chú giao hàng / lý do hủy |

### 5.2. Cột bổ sung bảng `orders`

| Column | Ghi chú |
|---|---|
| orderType | DINE_IN hoặc ONLINE |
| tableId | null với đơn online |
| tableSessionId | null với đơn online |

### 5.3. Cột bổ sung bảng `branches`

| Column | Ghi chú |
|---|---|
| latitude | Vĩ độ quán để tính phí |
| longitude | Kinh độ quán để tính phí |
| deliveryBaseKm | Bán kính phí cơ bản |
| deliveryBaseFee | Phí cơ bản (VNĐ) |
| deliveryFeePerKm | Phí mỗi km vượt |
| deliveryMaxKm | Bán kính giao tối đa |

---

## 6. API Contract Phase 2

### 6.1. Public (không cần xác thực)

#### POST /api/public/delivery/estimate-fee
Ước tính phí ship trước khi đặt.

```
Request:  { "branchId": "branch-bep-nha-minh-q1", "customerLat": 10.7769, "customerLng": 106.7009 }
Response: { "data": { "distanceKm": 3.4, "isDeliverable": true, "shippingFee": 22000, "estimatedMinutes": 17 } }
Lỗi:     BRANCH_NO_LOCATION nếu quán chưa cấu hình tọa độ
```

#### POST /api/public/online-orders
Tạo đơn hàng online. Idempotent theo idempotencyKey.

```
Request:
{
  "branchId": "branch-bep-nha-minh-q1",
  "clientSessionId": "cs_xxx",
  "idempotencyKey": "cs_xxx_1714999999_abc1",
  "items": [{ "menuItemId": "item_01", "quantity": 2, "selectedOptions": [], "note": "" }],
  "deliveryInfo": {
    "customerName": "Nguyễn Văn A",
    "phone": "0912345678",
    "address": "123 Nguyễn Huệ",
    "ward": "Bến Nghé",
    "district": "Quận 1",
    "customerLat": 10.7769,
    "customerLng": 106.7009,
    "shippingFee": 22000
  }
}

Response 201:
{ "data": { "order": { "orderCode": "ONL-LX2K9AB", "status": "NEW" }, "deliveryInfo": { "deliveryStatus": "PENDING" }, "isIdempotent": false } }
```

Error codes: INVALID_ITEM / ITEM_SOLD_OUT / INVALID_OPTION / OUT_OF_RANGE

#### GET /api/public/online-orders/:orderId
Tracking đơn cho khách. Trả về đầy đủ items + deliveryInfo.

#### GET /api/public/branches/:branchId/delivery-config
Config phí ship để FE ước tính phía client.

---

### 6.2. Internal Admin (cần JWT, role KITCHEN/MANAGER/ADMIN)

#### GET /api/internal/delivery-orders
Query params: `deliveryStatus`, `branchId`, `date` (YYYY-MM-DD), `pageSize`

#### PATCH /api/internal/delivery-orders/:id/status
```
Body: { "deliveryStatus": "ACCEPTED", "reason": null }
Lưu ý: reason bắt buộc khi deliveryStatus = CANCELLED
```

#### GET /api/internal/branches/:id/delivery-config
Lấy config phí ship cho trang AdminBranchSettings.

#### PATCH /api/internal/branches/:id/delivery-config
Cập nhật tọa độ và bảng phí của chi nhánh.

---

## 7. Business Rules Phase 2

| ID | Quy tắc |
|---|---|
| BR-P2-01 | Đơn online không có tableId / tableSessionId |
| BR-P2-02 | orderType = ONLINE bắt buộc để phân biệt với dine-in |
| BR-P2-03 | Mã đơn format: ONL-[timestamp_base36] |
| BR-P2-04 | Chỉ ACTIVE được đặt; SOLD_OUT → lỗi ITEM_SOLD_OUT; HIDDEN → lỗi INVALID_ITEM |
| BR-P2-05 | BE tính lại phí ship từ GPS khi có tọa độ (anti-tampering FE) |
| BR-P2-06 | Không có GPS → FE dùng địa chỉ text, không auto-estimate |
| BR-P2-07 | Submit idempotent theo idempotencyKey — đặt 2 lần trả đơn cũ |
| BR-P2-08 | Cập nhật deliveryStatus tự đồng bộ order.status và ghi history |
| BR-P2-09 | Thanh toán COD — hệ thống không xử lý payment online |
| BR-P2-10 | Hủy đơn ở bất kỳ bước nào (trừ DELIVERED) — cần lý do |
| BR-P2-11 | DELIVERED và CANCELLED là trạng thái cuối, không đổi thêm |

---

## 8. Tiến độ triển khai

### 8.1. Backend (backend-api/)

| Hạng mục | File | Trạng thái |
|---|---|---|
| Estimate Fee API | online-order.service.ts | ✅ Hoàn thành |
| Create Online Order | online-order.service.ts | ✅ Hoàn thành |
| Track Order public | online-order.service.ts | ✅ Hoàn thành |
| List Delivery Orders Admin | online-order.service.ts | ✅ Hoàn thành |
| Update Delivery Status Admin | online-order.service.ts | ✅ Hoàn thành |
| Branch Delivery Config Admin | online-order.service.ts | ✅ Hoàn thành |
| Geo Utilities Haversine | geo.utils.ts | ✅ Hoàn thành |
| Zod Validation Schemas | online-order.schema.ts | ✅ Hoàn thành |
| Router public + internal | online-order.router.ts | ✅ Hoàn thành |
| Unit / Integration Tests | (chưa có file) | ⬜ Chưa làm |

### 8.2. Frontend (web-prototype-react/)

| Màn hình | Route | Trạng thái |
|---|---|---|
| OnlineLandingPage | /order-online | ✅ Hoàn thành |
| OnlineOrderPage 3 bước | /order-online/menu | ✅ Hoàn thành |
| OnlineTrackingPage | /order-online/track/:id | ✅ Hoàn thành |
| AdminDeliveryPage | /admin/delivery | ✅ Hoàn thành |
| AdminBranchSettingsPage | /admin/branch-settings | ✅ Hoàn thành |
| deliveryApi.ts service | (service layer) | ✅ Hoàn thành |
| onlineApi.ts service | (service layer) | ✅ Hoàn thành |
| useOnlineCart store | (Zustand) | ✅ Hoàn thành |
| useGuestInfo store | (Zustand) | ✅ Hoàn thành |
| useGeolocation hook | (custom hook) | ✅ Hoàn thành |
| Mobile responsive tracking | - | ⚠️ Cần test thêm |
| Phân quyền AdminDelivery | - | ⚠️ Cần xác nhận KITCHEN có cập nhật được không |

### 8.3. Việc còn lại

| Hạng mục | Ưu tiên | Ghi chú |
|---|---|---|
| Unit test online-order.service.ts | High | Test estimate-fee, anti-tampering, idempotency |
| Seed tọa độ branch.latitude/longitude | High | Thiếu tọa độ → estimate-fee fail ngay |
| Integration test API online orders | High | Happy path + sold-out + out-of-range |
| Thông báo đơn mới real-time cho Admin | Medium | Hiện chỉ polling 30s |
| Google Maps embed trong trang tracking | Low | Nice-to-have |
| Assign Shipper | Out of scope | Chưa có trong data model |

---

## 9. Checklist Demo Phase 2

| # | Bước kiểm tra | Người |
|---|---|---|
| 1 | Cấu hình latitude/longitude cho chi nhánh | Admin |
| 2 | Vào /order-online → Landing → Đặt ngay | Khách |
| 3 | Chọn món, thêm giỏ hàng | Khách |
| 4 | Nhập địa chỉ hợp lệ → phí ship ước tính đúng | Khách |
| 5 | Submit → tracking hiện PENDING | Khách |
| 6 | /admin/delivery → thấy đơn trong tab Chờ xác nhận | Admin |
| 7 | Bấm Xác nhận đơn → ACCEPTED | Admin |
| 8 | Bấm Bắt đầu làm → PREPARING | Admin |
| 9 | Bấm Giao đi → DELIVERING | Admin |
| 10 | Bấm Đã giao → DELIVERED | Admin |
| 11 | Thử hủy đơn → confirm dialog + lý do | Admin |
| 12 | /admin/branch-settings → đổi phí → verify bảng preview | Admin |
| 13 | Nhập địa chỉ ngoài vùng → thông báo OUT_OF_RANGE | Khách |

---

## 10. Tài liệu tham chiếu

| Tài liệu | File |
|---|---|
| Quy trình nghiệp vụ Phase 1 | docs_prototype/02_quy_trinh_nghiep_vu_thong_nhat.md |
| PRD và Backlog Phase 1 | docs_prototype/03_prd_mvp_va_backlog_po.md |
| BE MVP Spec Phase 1 | docs_prototype/14_be_mvp_spec_node_express_ts.md |
| BE Online Order module | backend-api/src/modules/public/online-orders/ |
| BE Internal Router | backend-api/src/modules/internal/internal.router.ts |
| FE API service public | web-prototype-react/src/services/onlineApi.ts |
| FE API service admin | web-prototype-react/src/services/deliveryApi.ts |
