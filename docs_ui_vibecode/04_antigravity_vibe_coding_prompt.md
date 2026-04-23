# Antigravity Vibe Coding Prompt

## Cách dùng
Dán prompt dưới đây vào Antigravity. Nếu Antigravity cho phép thêm context, đính kèm các file:

- `docs_ui_vibecode/01_ui_design_brief.md`
- `docs_ui_vibecode/02_stitch_mcp_master_prompt.md`
- `docs_ui_vibecode/03_screen_inventory_va_user_flow.md`
- `docs_prototype/02_quy_trinh_nghiep_vu_thong_nhat.md`
- `docs_prototype/06_data_model_api_spec.md`

Nếu đã có output từ Stitch MCP, dán thêm ảnh/link hoặc mô tả design vào phần context trước khi chạy prompt.

## Prompt chính
```text
Bạn là Staff Frontend Engineer kiêm Product-minded Prototype Builder.

Hãy tạo một prototype web app cho dự án F&B QR ordering tại bàn, dựa trên tài liệu nghiệp vụ và design brief được cung cấp.

Mục tiêu:
- Build prototype chạy được, không chỉ mock tĩnh.
- Customer flow: QR bàn 05 -> menu -> item detail -> cart -> submit order -> tracking.
- KDS flow: order từ customer xuất hiện trên KDS, bếp đổi status.
- Tracking flow: status đổi ở KDS phản ánh ở màn khách.
- Admin flow: đổi món sang tạm hết/bán lại, reset phiên bàn.

Tech preference:
- Nếu chưa có codebase, tạo app React/Next.js hoặc Vite React đều được.
- Ưu tiên TypeScript.
- Có thể dùng local state/mock API/in-memory store/localStorage cho prototype.
- Không cần backend thật ở vòng đầu nếu mock state chạy end-to-end ổn.
- Nếu dùng CSS, tạo design tokens bằng CSS variables.
- Không dùng UI generic mặc định. Bám visual direction "Warm Counter, Fast Kitchen".

Visual style:
- Warm F&B, rice/paper/chili/turmeric/leaf palette.
- Brand name hiển thị chính xác: "Bếp Nhà Mình".
- Typography: dùng Be Vietnam Pro cho toàn bộ UI chính; chỉ dùng Sora hạn chế cho giá tiền, mã đơn, số bàn lớn. Không dùng serif/decorative font và không trộn nhiều font gây rối.
- Không dùng dark mode mặc định, không dùng purple SaaS style.
- Background có subtle gradient/texture nhẹ.
- Mobile customer app phải đẹp và dễ dùng.
- KDS phải rõ, chữ lớn, operational.

Routes/pages cần có:
1. /qr/table-05
   - Customer menu home cho Bàn 05.
   - Header tên quán, Bàn 05, cart count.
   - Search, category tabs, menu cards.
   - Sticky cart bar.

2. Item detail interaction
   - Có thể là modal/bottom sheet hoặc page.
   - Hiển thị ảnh, tên, giá, mô tả, tags, option, ghi chú.
   - Add to cart.
   - Sold out disabled state.

3. /cart
   - Giỏ hàng Bàn 05.
   - Quantity stepper, note, option, line total.
   - CTA "Gửi order cho quán".
   - Loading/disabled state khi submit.
   - Chống submit duplicate trong prototype.

4. /order/:orderId/tracking
   - Confirmation code B05-001.
   - Timeline: Đã tiếp nhận, Đang chuẩn bị, Sẵn sàng, Đã phục vụ.
   - Order summary.
   - CTA gọi thêm món.

5. /kds
   - Board cột: Mới nhận, Đang chuẩn bị, Sẵn sàng, Đã phục vụ/Hủy.
   - Order card có bàn lớn, order code, time, item qty, note.
   - Button status transition: NEW -> PREPARING -> READY -> SERVED.
   - Action hủy phụ.

6. /admin
   - Dashboard summary: order mới, đang chuẩn bị, bàn đang mở, món tạm hết.
   - Recent orders.

7. /admin/menu
   - Table món demo.
   - Quick action: Tạm hết/Bán lại/Ẩn/Sửa.
   - Khi đánh dấu sold out, customer menu phản ánh không thể đặt.

8. /admin/tables
   - Bàn 01-05, QR URL, copy URL, reset session.
   - Reset session xóa cart/order active cho demo hoặc đóng session mock, nhưng giữ lịch sử nếu dễ làm.

Mock data:
- Store: Bếp Nhà Mình.
- Table: Bàn 05.
- Categories: Món chính, Món nhẹ, Đồ uống, Combo, Tráng miệng.
- Items:
  - Bún bò đặc biệt, 65000, bestseller, ACTIVE.
  - Trà đào cam sả, 35000, refreshing, ACTIVE.
  - Cơm gà xối mỡ, 59000, ACTIVE.
  - Gỏi cuốn tôm, 45000, healthy, ACTIVE.
  - Chè khúc bạch, 39000, SOLD_OUT.
  - Combo gia đình, 199000, SOLD_OUT.
  - Thêm 8-12 món demo khác để menu nhìn thật.

Business rules:
- Không yêu cầu khách đăng nhập.
- Chỉ item ACTIVE được add cart.
- Item SOLD_OUT có thể hiển thị nhưng disabled.
- Order submit tạo order status NEW.
- Gọi thêm món tạo order mới cùng table/session.
- Không sửa order cũ sau khi submit.
- KDS đổi status phải cập nhật tracking.
- Order lưu snapshot name/price/options/note.
- Không làm payment online, chỉ subtotal/tạm tính.

Implementation guidance:
- Tạo structure rõ: components, data/mockStore, types, pages/routes.
- Dùng Zustand/React context/local state nếu cần share state giữa customer/KDS/admin.
- Nếu routing đơn giản hơn, vẫn phải có navigation demo rõ.
- Tạo responsive CSS mobile-first.
- Tạo README ngắn hướng dẫn chạy và demo routes.
- Tạo seed/reset demo button nếu tiện.

Acceptance:
- Có thể demo end-to-end trong 3 phút.
- Order gửi từ cart xuất hiện ở KDS.
- KDS đổi trạng thái, tracking đổi theo.
- Admin đánh dấu món tạm hết, customer không add được món đó.
- UI không generic, có visual direction riêng.
```

## Prompt follow-up sau khi code lần đầu
```text
Hãy rà soát prototype vừa tạo theo checklist:
1. Customer mobile có thể dùng tốt ở width 390px không?
2. Sticky cart bar có rõ không?
3. Món SOLD_OUT có bị chặn add cart không?
4. Submit order có loading và chống double click không?
5. KDS có đọc rõ bàn, số lượng, ghi chú không?
6. Status KDS có sync sang tracking không?
7. Admin đổi sold out có sync sang menu không?
8. Có route demo rõ trong README không?

Sau đó sửa các lỗi còn thiếu, không thêm payment/POS/AI thật.
```

## Prompt polish UI
```text
Prototype hoạt động rồi. Hãy polish UI theo hướng "Warm Counter, Fast Kitchen":
- Tăng cá tính typography nhưng vẫn đọc tốt tiếng Việt.
- Dùng palette rice/paper/chili/turmeric/leaf nhất quán qua CSS variables.
- Thêm background texture/gradient nhẹ.
- Thêm motion vừa đủ: menu card reveal, add-to-cart toast, KDS new order pulse, timeline progress.
- KDS tăng hierarchy: bàn lớn, qty lớn, note nổi bật.
- Đảm bảo mobile customer không bị overflow và CTA dễ bấm.
```
