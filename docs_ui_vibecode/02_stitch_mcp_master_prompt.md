# Stitch MCP Master Prompt

## Cách dùng
Dán toàn bộ phần `Prompt chính` dưới đây vào Stitch MCP. Nếu Stitch cho phép upload/context file, đính kèm thêm:

- `docs_prototype/02_quy_trinh_nghiep_vu_thong_nhat.md`
- `docs_prototype/08_ux_flow_wireframe_scope.md`
- `docs_ui_vibecode/01_ui_design_brief.md`

## Prompt chính
```text
Bạn là Principal Product Designer cho một prototype web app F&B QR ordering tại bàn.

Hãy tạo high-fidelity UI design cho sản phẩm:
"Hệ thống đặt món online nội bộ tại quán cho cửa hàng F&B".

Mục tiêu prototype:
- Khách ngồi tại bàn, quét QR, vào đúng bàn.
- Khách xem menu số, xem chi tiết món, thêm món vào giỏ, ghi chú món, gửi order cho quán.
- Bếp/quầy nhận order trên KDS, xem bàn, món, số lượng, option, ghi chú và cập nhật trạng thái.
- Khách theo dõi trạng thái order.
- Admin/quản lý đổi trạng thái món tạm hết và reset bàn.

Visual direction:
- Concept: "Warm Counter, Fast Kitchen".
- Giao diện ấm, hiện đại, có cảm giác F&B Việt Nam nhẹ, không giống template SaaS tím-trắng.
- Không dùng dark mode mặc định.
- Nền có chiều sâu nhẹ: paper texture/subtle gradient/rice grain pattern, nhưng không gây rối.
- Tên quán hiển thị chính xác là "Bếp Nhà Mình". Không dùng "Bếp nhà mình".
- Typography phải hiện đại, chuyên nghiệp, trẻ trung và rất nhất quán.
- Chỉ dùng tối đa 2 font family: Be Vietnam Pro cho toàn bộ UI chính; Sora chỉ dùng hạn chế cho giá tiền, mã đơn, số bàn lớn trên KDS.
- Không dùng serif/decorative font, không trộn quá nhiều weight/style, không dùng uppercase/letter-spacing quá nhiều gây rối mắt.
- Tên quán "Bếp Nhà Mình" dùng Be Vietnam Pro SemiBold, sạch và dễ đọc.
- Palette: rice #FFF8EA, paper #F7E8C9, charcoal #25211B, soy #5A3928, chili #D83A2E, turmeric #F4A51C, leaf #2F7D4E, steam #E8DDCC.

Thiết kế các màn hình sau:

1. Customer mobile - Menu home
- Header có tên quán "Bếp Nhà Mình", số bàn rõ: "Bàn 05", icon giỏ.
- Search bar: "Tìm món yêu thích..."
- Category tabs: Món chính, Đồ uống, Combo, Tráng miệng.
- Menu cards có ảnh món, tên, mô tả ngắn, giá, badge bestseller/tạm hết, nút thêm.
- Sticky cart bar phía dưới: số món, tổng tạm tính, nút "Xem giỏ".

2. Customer mobile - Item detail bottom sheet/page
- Ảnh món lớn.
- Tên, giá, mô tả, tags.
- Option cơ bản: mức cay hoặc size.
- Ghi chú món: "Ví dụ: ít cay, không hành..."
- CTA "Thêm vào giỏ".
- State disabled nếu món tạm hết.

3. Customer mobile - Cart
- Header "Giỏ hàng - Bàn 05".
- Danh sách món với số lượng, option, ghi chú, giá dòng.
- Tăng/giảm/xóa item.
- Tổng tạm tính.
- Warning nhẹ: "Bạn có thể gọi thêm sau bằng order bổ sung."
- CTA chính: "Gửi order cho quán".
- Loading state khi đang gửi.

4. Customer mobile - Order success / Tracking
- Confirmation: "Đơn B05-001 đã được tiếp nhận".
- Timeline trạng thái: Đã tiếp nhận -> Đang chuẩn bị -> Sẵn sàng -> Đã phục vụ.
- Order summary.
- CTA "Gọi thêm món" và "Làm mới trạng thái".

5. Customer mobile - Error/empty states
- QR không hợp lệ.
- Giỏ rỗng.
- Món tạm hết.
- Kết nối không ổn định khi gửi order.

6. KDS tablet/desktop - Order board
- Board dạng cột: Mới nhận, Đang chuẩn bị, Sẵn sàng, Đã phục vụ/Hủy.
- Order card phải đọc nhanh trong bếp.
- Card có bàn rất lớn, mã order, thời gian, danh sách món, số lượng lớn, option, ghi chú nổi bật.
- CTA một chạm: "Bắt đầu chuẩn bị", "Sẵn sàng", "Đã phục vụ", "Hủy".
- Order mới có highlight/pulse nhẹ.

7. Admin desktop - Dashboard
- Summary cards: order mới, đang chuẩn bị, bàn đang mở, món tạm hết.
- Danh sách order theo bàn/trạng thái.
- Bàn đang mở có nút reset phiên.

8. Admin desktop - Menu management
- Bảng món: tên, danh mục, giá, trạng thái.
- Quick actions: "Tạm hết", "Bán lại", "Ẩn", "Sửa".
- Form tạo/sửa món cơ bản.

9. Admin desktop - Table/QR management
- Danh sách bàn: Bàn 01-05, trạng thái, QR URL/token.
- Action copy QR URL, xem QR, reset phiên.

Responsive requirements:
- Customer app thiết kế mobile first 360px-430px.
- KDS dùng tablet/desktop 1024px+.
- Admin desktop 1280px+.

Interaction states:
- Add to cart toast.
- Submit order loading/disabled state.
- Sold out disabled state.
- Status progress animation.
- KDS new order pulse.

Output mong muốn:
- High-fidelity screens.
- Component library/tokens nếu có thể.
- Ghi rõ screen name và state.
- Không tạo payment online, POS sync, loyalty hoặc inventory phức tạp.
```

## Prompt refine nếu output quá generic
```text
Thiết kế hiện tại vẫn quá giống SaaS template. Hãy tăng cảm giác F&B ấm và có bản sắc: dùng màu rice/paper/chili/turmeric/leaf rõ hơn, thêm texture giấy menu rất nhẹ, làm card món có cảm giác ngon miệng hơn, nhưng vẫn giữ UI sạch và dễ dùng. Không dùng purple gradient. KDS phải rõ và operational hơn, bàn/số lượng/ghi chú cần nổi bật hơn.
```

## Prompt refine cho KDS
```text
Tập trung refine KDS cho môi trường bếp bận rộn. Làm chữ lớn hơn, order card có hierarchy mạnh hơn: bàn lớn nhất, số lượng món lớn thứ hai, ghi chú có badge màu chili/turmeric. Mỗi card chỉ có một CTA chính theo trạng thái tiếp theo. Thiết kế phù hợp tablet/laptop đặt ở quầy.
```

## Prompt refine cho customer mobile
```text
Refine customer mobile để khách thao tác bằng một tay. Sticky cart bar rõ hơn, CTA lớn hơn, số bàn luôn thấy. Item detail nên có bottom sheet cảm giác mượt, option và ghi chú dễ nhập. Món tạm hết phải có text rõ và không thể bấm thêm.
```

## Prompt refine typography và tên quán
```text
Feedback cần sửa:
1. Typography hiện tại chưa thống nhất, còn rối mắt và chưa đủ hiện đại/chuyên nghiệp/trẻ trung.
2. Đang sử dụng quá nhiều kiểu font/weight/style trên cùng một màn.
3. Tên quán phải viết chính xác là "Bếp Nhà Mình", không phải "Bếp nhà mình".

Yêu cầu refine:
- Làm lại typography system theo hướng sạch, hiện đại, trẻ trung, dễ đọc.
- Chỉ dùng tối đa 2 font family: Be Vietnam Pro cho toàn bộ UI chính; Sora chỉ dùng cho giá tiền, mã đơn và số bàn lớn nếu cần accent.
- Không dùng serif/decorative font cho tên quán, tên món, heading, label.
- Giảm số lượng font weight: Regular 400, Medium 500, SemiBold 600, Bold 700 là đủ.
- Tên món như "Phở Bò Tái Chín" dùng Be Vietnam Pro Bold/SemiBold, không dùng serif kiểu báo giấy.
- Giá tiền dùng Sora hoặc Be Vietnam Pro SemiBold nhất quán, không quá đỏ/chói.
- Badge, option, tab và button dùng cùng một font/weight system.
- Header brand đổi thành "Bếp Nhà Mình" và căn chỉnh lại cho sạch, chuyên nghiệp.
- Giữ visual direction ấm áp F&B nhưng typography phải gọn, thoáng, có hierarchy rõ.
```
