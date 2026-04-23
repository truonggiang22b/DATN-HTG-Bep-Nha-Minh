# UI Design Brief

## 1. Product one-liner
Web app đặt món tại bàn cho quán F&B: khách quét QR, gọi món nhanh, bếp nhận đơn rõ ràng, quản lý kiểm soát menu và trạng thái bàn.

## 2. Design objective
Tạo một prototype có cảm giác hiện đại nhưng không lạnh lẽo, nhanh nhưng vẫn thân thiện, đủ “wow” cho khách hàng nhìn thấy quán của họ có thể vận hành chuyên nghiệp hơn ngay sau khi áp dụng QR ordering.

## 3. Visual direction
Tên concept: `Warm Counter, Fast Kitchen`.

Tinh thần: quán ăn/cafe Việt Nam hiện đại, ấm, có nhịp vận hành nhanh. Không dùng kiểu SaaS tím-trắng chung chung. Không làm dark mode mặc định. Giao diện cần có không khí đồ ăn thật: màu ấm, card có chiều sâu nhẹ, texture tinh tế, CTA rõ.

Tên quán hiển thị chính xác: `Bếp Nhà Mình`. Không dùng `Bếp nhà mình`, `Bếp nhà Mình` hoặc biến thể viết thường khác.

## 4. Brand mood
| Thuộc tính | Hướng thiết kế |
|---|---|
| Ấm | Nền màu cơm trắng/kem, accent nghệ/chili |
| Nhanh | CTA sticky, transition gọn, state rõ |
| Tin cậy | Layout sạch, giá rõ, trạng thái order minh bạch |
| Có vị địa phương | Hoạ tiết nền nhẹ như giấy menu/quầy bếp, không lạm dụng minh hoạ |
| Operational | KDS dùng contrast mạnh, chữ lớn, action một chạm |

## 5. Color palette đề xuất
| Token | Màu | Hex | Dùng cho |
|---|---|---|---|
| `rice` | Cơm trắng ấm | `#FFF8EA` | App background |
| `paper` | Giấy menu | `#F7E8C9` | Card background phụ |
| `charcoal` | Than bếp | `#25211B` | Text chính |
| `soy` | Nâu nước tương | `#5A3928` | Text phụ, border đậm |
| `chili` | Đỏ ớt | `#D83A2E` | CTA chính, warning |
| `turmeric` | Vàng nghệ | `#F4A51C` | Badge, highlight |
| `leaf` | Xanh lá chuối | `#2F7D4E` | Success, active status |
| `steam` | Xám khói | `#E8DDCC` | Border, divider |

## 6. Typography
Typography cần được siết lại để giao diện hiện đại, chuyên nghiệp, trẻ trung và dễ nhìn. Không dùng nhiều font decorative/serif lẫn lộn như bản Stitch đầu tiên.

| Vai trò | Font | Weight | Ghi chú |
|---|---|---:|---|
| Primary UI font | `Be Vietnam Pro` | 400/500/600/700 | Dùng cho gần như toàn bộ UI: header, món, mô tả, form, button, tab |
| Accent numeric font | `Sora` | 500/600/700 | Chỉ dùng hạn chế cho giá tiền, mã đơn, số bàn lớn trên KDS |
| Fallback | `sans-serif` | Theo browser | Chỉ là fallback kỹ thuật |

Quy tắc typography bắt buộc:
- Tối đa 2 font family trong toàn bộ prototype: `Be Vietnam Pro` và `Sora`.
- Không dùng serif/decorative font cho tên món, tên quán, heading hoặc label.
- Không dùng quá nhiều kiểu chữ uppercase/letter spacing trong cùng một màn.
- Heading dùng `Be Vietnam Pro SemiBold/Bold`, line-height thoáng, không quá nặng.
- Body text dùng `Be Vietnam Pro Regular/Medium`, dễ đọc trên mobile.
- Price/order code/table number có thể dùng `Sora` để hiện đại hơn nhưng phải nhất quán.
- Tên quán `Bếp Nhà Mình` dùng `Be Vietnam Pro SemiBold`, không dùng font trang trí.

## 7. Layout principles
| Màn | Nguyên tắc |
|---|---|
| Customer mobile | Một tay dùng được, CTA dưới cùng, số bàn luôn thấy |
| Item detail | Ảnh món lớn, option rõ, ghi chú dễ nhập |
| Cart | Tổng tiền và nút gửi order luôn rõ |
| Tracking | Timeline trạng thái yên tâm, không dùng thuật ngữ nội bộ |
| KDS | Board dạng cột/card, bàn và số lượng món lớn |
| Admin | Bảng rõ, quick action trạng thái món nhanh |

## 8. Motion direction
| Motion | Dùng ở đâu | Ý nghĩa |
|---|---|---|
| Stagger reveal | Menu cards khi mở menu | Tạo cảm giác menu sống động |
| Bottom sheet spring nhẹ | Giỏ hàng/chi tiết món trên mobile | Tự nhiên, không quá game |
| Status pulse | Order mới trên KDS | Bếp chú ý order mới |
| Timeline progress | Tracking khách | Khách yên tâm đơn đang chạy |
| Toast slide | Add to cart/order sent | Feedback nhanh |

## 9. Core screens
| Nhóm | Screens |
|---|---|
| Customer | QR landing/menu, item detail, cart, submit loading, order success/tracking, sold-out state, QR error |
| KDS | Login/internal gate, order board, order detail drawer/card, cancel reason modal |
| Admin | Dashboard, menu management, table/QR management, table session reset |

## 10. UX non-negotiables
| ID | Rule |
|---|---|
| UX-01 | Số bàn hiển thị rõ trên mọi màn khách. |
| UX-02 | Món tạm hết không chỉ dùng màu; phải có text `Tạm hết`. |
| UX-03 | `Gửi order cho quán` có loading và không bấm lặp. |
| UX-04 | KDS card phải đọc được từ khoảng cách xa trên tablet/laptop. |
| UX-05 | Tracking dùng nhãn khách hiểu: `Đã tiếp nhận`, `Đang chuẩn bị`, `Sẵn sàng`, `Đã phục vụ`. |
| UX-06 | Prototype không hiển thị payment online như tính năng chính. |

## 11. Demo persona
| Persona | Câu chuyện demo |
|---|---|
| Khách bàn 05 | Muốn gọi bún bò và trà đào, ghi chú không hành, theo dõi món |
| Bếp/quầy | Nhận order bàn 05, thấy ghi chú, đổi trạng thái |
| Admin/quản lý | Tạm hết một món, reset bàn sau khi khách rời |

## 12. Role-based UI scope
Prototype cần mô tả rõ giao diện theo từng nhóm người dùng, vì mỗi role có mục tiêu, nhịp thao tác và thiết bị khác nhau.

| Role | Thiết bị chính | Mục tiêu UI | Màn hình cần có | Hành động chính |
|---|---|---|---|---|
| Khách hàng tại bàn | Điện thoại cá nhân | Gọi món nhanh, rõ bàn, rõ giá, không cần đăng nhập | QR/Menu, Chi tiết món, Giỏ hàng, Tracking trạng thái, Error states | Xem menu, thêm món, ghi chú, gửi order, gọi thêm món |
| Nhân viên bếp/quầy pha chế | Tablet/laptop tại bếp/quầy | Nhận order rõ, đọc nhanh trong môi trường bận, cập nhật trạng thái một chạm | KDS Order Board, Order Card, Cancel Modal | Bắt đầu chuẩn bị, đánh dấu sẵn sàng, đã phục vụ, hủy ngoại lệ |
| Nhân viên phục vụ | Điện thoại/tablet nội bộ hoặc xem chung Admin/KDS | Biết bàn nào có món sẵn sàng, hỗ trợ khách và mang món ra | KDS/Order list, trạng thái `READY`, order theo bàn | Xem bàn cần phục vụ, xác nhận đã phục vụ nếu được phân quyền |
| Quản lý ca / Thu ngân | Tablet/desktop quầy | Theo dõi bàn đang mở, order theo bàn, reset phiên sau khi khách rời | Admin Dashboard, Order theo bàn, Table/QR management | Lọc order, xem trạng thái bàn, reset bàn, hỗ trợ xử lý ngoại lệ |
| Chủ quán / Admin | Desktop/laptop | Kiểm soát menu, trạng thái món, bàn/QR và vận hành tổng quan | Admin Dashboard, Menu Management, Table/QR Management | Tạo/sửa món, tạm hết/bán lại món, xem tổng quan, quản lý bàn/QR |

### 12.1. Khách hàng tại bàn
Giao diện khách phải mobile-first và không giả định khách hiểu thuật ngữ vận hành. Header luôn hiển thị `Bàn 05`, vì đây là cơ chế giảm lỗi quét nhầm QR hoặc order nhầm bàn.

Ưu tiên thiết kế:
- Menu hấp dẫn, dễ quét mắt.
- CTA `Thêm vào giỏ` và `Gửi order cho quán` rõ.
- Tracking dùng ngôn ngữ thân thiện: `Đã tiếp nhận`, `Đang chuẩn bị`, `Sẵn sàng`, `Đã phục vụ`.
- Không hiển thị tính năng thanh toán online trong prototype.

### 12.2. Nhân viên bếp/quầy
Giao diện bếp/quầy là KDS, ưu tiên đọc nhanh hơn trang trí. Trong môi trường bếp, người dùng không có thời gian đọc nhiều text nhỏ.

Ưu tiên thiết kế:
- `Bàn` là thông tin lớn nhất trên order card.
- Số lượng món và ghi chú phải nổi bật.
- Mỗi trạng thái chỉ có một CTA chính.
- Order mới cần highlight/pulse nhẹ để tránh bỏ sót.

### 12.3. Nhân viên phục vụ
Nhân viên phục vụ không nhất thiết cần một app riêng trong prototype, nhưng UI cần hỗ trợ họ qua KDS hoặc Admin operation view.

Ưu tiên thiết kế:
- Dễ thấy order nào `Sẵn sàng`.
- Dễ biết món thuộc bàn nào.
- Có thể xác nhận `Đã phục vụ` nếu quy trình khách hàng yêu cầu.
- Không bắt nhân viên nhập liệu phức tạp.

### 12.4. Quản lý ca / Thu ngân
Quản lý ca cần góc nhìn vận hành theo bàn và phiên bàn. Đây là role chịu trách nhiệm reset bàn để tránh lẫn phiên khách cũ/khách mới.

Ưu tiên thiết kế:
- Dashboard có bàn đang mở và order theo trạng thái.
- Table/QR management có action `Reset phiên bàn`.
- Reset phải có warning: không xóa lịch sử order, chỉ đóng phiên hiện tại.
- Có thể hỗ trợ hủy order ngoại lệ nếu được phân quyền.

### 12.5. Chủ quán / Admin
Chủ quán/Admin cần kiểm soát menu và trạng thái món. Trong prototype, UI của chủ quán không cần là ERP/POS đầy đủ, nhưng phải chứng minh được việc vận hành menu số dễ hơn menu giấy.

Ưu tiên thiết kế:
- Bảng món có quick action `Tạm hết`, `Bán lại`, `Ẩn`, `Sửa`.
- Đổi trạng thái món phản ánh ngay trên menu khách.
- Quản lý bàn/QR đủ để tạo câu chuyện triển khai tại quán.
- Dashboard có số liệu vận hành cơ bản nhưng không cần analytics phức tạp.

## 13. Prototype success feeling
Sau 3 phút demo, khách hàng cần cảm thấy: “Quy trình này thực sự thay được việc nhân viên chạy qua chạy lại ghi order, và bếp nhìn đơn cũng rõ hơn.”
