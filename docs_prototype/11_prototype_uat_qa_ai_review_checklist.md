# Prototype UAT / QA / AI Review Checklist

## 1. Mục tiêu
Tài liệu này gom các tiêu chuẩn nghiệm thu prototype từ góc nhìn BA, PM, QA, UX/UI và CTO thành một checklist duy nhất để:

- Con người review nhanh trước buổi demo.
- AI agent review sau khi code xong.
- Đối chiếu prototype với nghiệp vụ đã chốt.

Đây là tài liệu nghiệm thu thực dụng cho prototype, không phải test plan production đầy đủ.

## 2. Source of truth theo thứ tự ưu tiên
Khi AI agent review prototype, nếu có xung đột giữa các mô tả, hãy ưu tiên theo thứ tự:

1. `docs_prototype/02_quy_trinh_nghiep_vu_thong_nhat.md`
2. `docs_prototype/03_prd_mvp_va_backlog_po.md`
3. `docs_prototype/04_dac_ta_chuc_nang_ba.md`
4. `docs_prototype/06_data_model_api_spec.md`
5. `docs_ui_vibecode/01_ui_design_brief.md`
6. `docs_ui_vibecode/03_screen_inventory_va_user_flow.md`
7. `docs_ui_vibecode/06_demo_script_va_acceptance_ui.md`

## 3. Mục tiêu nghiệm thu prototype
Prototype đạt khi chứng minh được các điểm sau:

1. Khách vào đúng bàn bằng QR.
2. Khách xem menu, thêm món, ghi chú và chốt đơn được.
3. Order hiện ở KDS.
4. Bếp đổi trạng thái, khách thấy trạng thái mới.
5. Admin đổi trạng thái món, menu khách phản ánh đúng.
6. Reset bàn đóng phiên cũ, không xóa lịch sử order.
7. Giao diện bám đúng brand và visual direction đã chốt.

## 4. Ma trận tiêu chuẩn nghiệm thu
### 4.1. Business flow
| ID | Tiêu chuẩn | Mức | Pass/Fail | Ghi chú |
|---|---|---|---|---|
| BF-01 | QR bàn hợp lệ mở đúng bàn, ví dụ `Bàn 05` | Critical |  |  |
| BF-02 | Khách không cần đăng nhập để đặt món | Critical |  |  |
| BF-03 | Menu hiển thị đúng danh mục và món theo seed data | Critical |  |  |
| BF-04 | Chỉ món `ACTIVE` mới thêm được vào giỏ | Critical |  |  |
| BF-05 | Món `SOLD_OUT` hiển thị rõ và bị disabled | Critical |  |  |
| BF-06 | Giỏ hàng lưu được số lượng, option, ghi chú | Critical |  |  |
| BF-07 | Submit order tạo order mới hợp lệ | Critical |  |  |
| BF-08 | Submit lặp không tạo order trùng | Critical |  |  |
| BF-09 | Gọi thêm món tạo order mới cùng `tableSession` | High |  |  |
| BF-10 | Order cũ không có flow chỉnh sửa trực tiếp sau khi submit | High |  |  |
| BF-11 | Reset bàn đóng session cũ và chuẩn bị session mới | Critical |  |  |
| BF-12 | Lịch sử order không mất sau reset bàn | High |  |  |

### 4.2. KDS / vận hành
| ID | Tiêu chuẩn | Mức | Pass/Fail | Ghi chú |
|---|---|---|---|---|
| KDS-01 | Order mới xuất hiện trên KDS sau khi khách submit | Critical |  |  |
| KDS-02 | KDS hiển thị rõ: bàn, mã order, thời gian, item, qty, note | Critical |  |  |
| KDS-03 | Trạng thái chuyển đúng luồng `NEW -> PREPARING -> READY -> SERVED` | Critical |  |  |
| KDS-04 | Chỉ cho hủy ở các trạng thái được phép | High |  |  |
| KDS-05 | Khi KDS đổi trạng thái, màn tracking khách cập nhật đúng | Critical |  |  |
| KDS-06 | KDS empty state rõ ràng khi chưa có đơn | Medium |  |  |

### 4.3. Admin / quản lý
| ID | Tiêu chuẩn | Mức | Pass/Fail | Ghi chú |
|---|---|---|---|---|
| ADM-01 | `/admin` có summary stats cơ bản | Medium |  |  |
| ADM-02 | `/admin/menu` hiển thị danh sách món đúng | High |  |  |
| ADM-03 | Đổi `ACTIVE -> SOLD_OUT` phản ánh về menu khách | Critical |  |  |
| ADM-04 | Đổi `SOLD_OUT -> ACTIVE` phản ánh về menu khách | High |  |  |
| ADM-05 | `/admin/tables` hiển thị danh sách bàn và QR | High |  |  |
| ADM-06 | Reset bàn có warning và feedback rõ | High |  |  |
| ADM-07 | Admin/KDS có internal gate hoặc auth tối thiểu | Critical |  |  |

### 4.4. Data / state model
| ID | Tiêu chuẩn | Mức | Pass/Fail | Ghi chú |
|---|---|---|---|---|
| DATA-01 | `tableSession` là entity riêng, không chỉ là field tạm | Critical |  |  |
| DATA-02 | Mỗi client/tab có `clientSessionId` riêng | Critical |  |  |
| DATA-03 | Cart là per-client-session, không dùng một cart global | Critical |  |  |
| DATA-04 | Order lưu snapshot tên món, giá, option, note tại thời điểm submit | Critical |  |  |
| DATA-05 | Order gắn `tableId`, `tableSessionId`, `clientSessionId` | Critical |  |  |
| DATA-06 | Idempotency key được check trước khi tạo order | Critical |  |  |
| DATA-07 | Reset bàn không làm mất orders/history cũ | High |  |  |

### 4.5. UI / UX
| ID | Tiêu chuẩn | Mức | Pass/Fail | Ghi chú |
|---|---|---|---|---|
| UI-01 | Brand name hiển thị đúng `Bếp Nhà Mình` | Critical |  |  |
| UI-02 | Typography bám spec: `Be Vietnam Pro` chính, `Sora` chỉ accent | High |  |  |
| UI-03 | Không xuất hiện font lộn xộn hoặc decorative font ngoài spec | High |  |  |
| UI-04 | Customer mobile usable ở width ~390px | Critical |  |  |
| UI-05 | Sticky cart rõ và không che nội dung quan trọng | High |  |  |
| UI-06 | Món `SOLD_OUT` không chỉ dùng màu, có text `Tạm hết` | High |  |  |
| UI-07 | Tracking dùng nhãn khách hiểu được | High |  |  |
| UI-08 | KDS đọc rõ từ xa, đặc biệt bàn / qty / note | Critical |  |  |
| UI-09 | Admin layout dễ thao tác, quick action rõ | Medium |  |  |

### 4.6. Demo readiness
| ID | Tiêu chuẩn | Mức | Pass/Fail | Ghi chú |
|---|---|---|---|---|
| DEMO-01 | `npm run dev` chạy không lỗi | Critical |  |  |
| DEMO-02 | `npm run build` pass không lỗi TypeScript | Critical |  |  |
| DEMO-03 | Các route chính render được | Critical |  |  |
| DEMO-04 | Có seed data đủ để demo 3 phút | Critical |  |  |
| DEMO-05 | Có ít nhất 1 món sold out để demo | High |  |  |
| DEMO-06 | Có thể demo customer + KDS + admin theo assumption đã chốt | Critical |  |  |
| DEMO-07 | Nếu sync chỉ same-browser-profile, limitation này được ghi rõ | Critical |  |  |

## 5. Kịch bản test bắt buộc
### Scenario 1: Happy path order
1. Mở `/qr/table-05`
2. Chọn `Bún bò đặc biệt`
3. Chọn option + ghi chú `Không hành`
4. Thêm `Trà đào cam sả`
5. Mở `/cart`
6. Submit order
7. Mở `/order/:id/tracking`
8. Mở `/kds`
9. Đổi trạng thái `NEW -> PREPARING -> READY`
10. Kiểm tra tracking đã cập nhật

Expected:
- Order tạo thành công
- KDS thấy order
- Tracking khách map đúng trạng thái

### Scenario 2: Sold out validation
1. Mở menu khách
2. Tìm món `Chè khúc bạch`
3. Xác nhận món hiện `Tạm hết`
4. Thử thêm vào giỏ

Expected:
- Không thêm được
- UI disabled và có text rõ

### Scenario 3: Admin đổi trạng thái món
1. Mở `/admin/menu`
2. Đổi `Gỏi cuốn tôm` từ `ACTIVE` sang `SOLD_OUT`
3. Quay về menu khách

Expected:
- Món hiển thị `Tạm hết`
- CTA bị disabled

### Scenario 4: Duplicate prevention
1. Vào `/cart`
2. Bấm submit nhiều lần nhanh

Expected:
- Chỉ tạo 1 order
- Không phát sinh 2 order giống nhau

### Scenario 5: Reset bàn
1. Có ít nhất 1 order ở `Bàn 05`
2. Mở `/admin/tables`
3. Bấm reset bàn

Expected:
- Session cũ đóng
- Lịch sử order vẫn còn
- Lượt mới không lẫn với session cũ

## 6. Prompt mẫu cho AI agent review
Bạn có thể đưa nguyên checklist này cho AI agent và dùng prompt sau:

```text
Hãy review prototype F&B QR Ordering theo checklist trong file `docs_prototype/11_prototype_uat_qa_ai_review_checklist.md`.

Yêu cầu:
1. Review theo mindset QA + BA + PM.
2. Ưu tiên tìm lỗi nghiệp vụ, lỗi state, lỗi flow, lỗi route, lỗi sync, lỗi UX ảnh hưởng demo.
3. Báo cáo findings theo thứ tự mức độ: Critical, High, Medium, Low.
4. Với mỗi finding, ghi rõ:
   - tiêu chuẩn nào bị fail (ví dụ BF-08, KDS-03, UI-01...)
   - route/màn hình bị ảnh hưởng
   - hành vi hiện tại
   - hành vi mong muốn
   - đề xuất sửa
5. Nếu không có lỗi ở một nhóm, ghi rõ nhóm đó pass.
6. Cuối cùng, kết luận:
   - Prototype có đủ điều kiện demo khách hàng chưa
   - Các blocker còn lại là gì
```

## 7. Tiêu chí Go / No-Go
Prototype được phép demo khi tất cả mục sau đều pass:

- BF-01 đến BF-08
- BF-11
- KDS-01 đến KDS-05
- ADM-03
- ADM-07
- DATA-01 đến DATA-06
- UI-01
- UI-04
- UI-08
- DEMO-01 đến DEMO-04
- DEMO-07

Nếu bất kỳ mục Critical nào fail, kết luận là `No-Go`.

## 8. Gợi ý cách dùng
| Giai đoạn | Cách dùng |
|---|---|
| Sau khi agent code xong | Đưa file này cho AI agent review |
| Trước demo khách hàng | PM/BA tick nhanh các mục Critical/High |
| Khi fix bug | Dùng ID checklist làm chuẩn đặt tên ticket, ví dụ `BF-08 Duplicate order issue` |
