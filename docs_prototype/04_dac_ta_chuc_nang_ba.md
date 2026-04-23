# Đặc tả chức năng BA

## 1. Mục tiêu
Tài liệu này mô tả chi tiết chức năng theo module để Dev, QA và BA cùng hiểu cách hệ thống cần hoạt động trong prototype.

## 2. Quyền truy cập
| Vai trò | Quyền chính | Màn hình |
|---|---|---|
| Khách | Xem menu, quản lý giỏ, chốt order, tracking | Customer web app |
| Bếp/quầy | Xem order, đổi trạng thái, hủy order nếu được cấp quyền | KDS |
| Phục vụ/quản lý ca | Xem order theo bàn, reset bàn, hỗ trợ trạng thái | Admin operation |
| Admin/chủ quán | Quản lý menu, danh mục, bàn, QR, người dùng nội bộ nếu có | Admin dashboard |

## 3. Module A: QR và định danh bàn
### 3.1. Input
| Trường | Mô tả | Bắt buộc |
|---|---|---|
| `qr_token` | Token duy nhất trong URL QR | Có |
| `store_id` | Cửa hàng/quán | Có ở DB |
| `branch_id` | Chi nhánh, có thể mặc định | Nên có để mở rộng |
| `table_id` | Bàn vật lý | Có |

### 3.2. Output
| Kết quả | Mô tả |
|---|---|
| Thành công | Mở customer app với số bàn và menu của quán |
| Token sai | Màn lỗi: QR không hợp lệ, vui lòng gọi nhân viên |
| Bàn bị khóa | Màn thông báo bàn chưa sẵn sàng hoặc cần gọi nhân viên |

### 3.3. Functional rules
| ID | Rule |
|---|---|
| QR-01 | Token không chứa thông tin nhạy cảm hoặc quyền admin. |
| QR-02 | Mỗi token chỉ map đến một bàn active. |
| QR-03 | Customer app luôn hiển thị số bàn ở header/cart/confirmation. |
| QR-04 | Không yêu cầu khách đăng nhập. |

## 4. Module B: Menu số
### 4.1. Trường dữ liệu món
| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | string/uuid | Có | Mã món |
| `name` | string | Có | Tên hiển thị |
| `category_id` | string/uuid | Có | Danh mục |
| `price` | number | Có | Giá bán hiện hành |
| `image_url` | string | Không | Có placeholder nếu thiếu |
| `short_description` | string | Nên có | Mô tả ngắn |
| `ingredients` | string/list | Không | Hữu ích cho AI phase sau |
| `tags` | string[] | Không | cay, chay, bestseller, trẻ em |
| `status` | enum | Có | ACTIVE, SOLD_OUT, HIDDEN |
| `sort_order` | number | Không | Sắp xếp menu |

### 4.2. Functional rules
| ID | Rule |
|---|---|
| MENU-01 | Món `HIDDEN` không hiển thị với khách. |
| MENU-02 | Món `SOLD_OUT` có thể hiển thị nhưng disabled. |
| MENU-03 | Món `ACTIVE` mới được thêm giỏ. |
| MENU-04 | Giá hiển thị là giá hiện hành, nhưng order lưu price snapshot. |
| MENU-05 | Danh mục không có món active có thể ẩn khỏi menu khách. |

### 4.3. Empty/error states
| Trạng thái | Nội dung gợi ý |
|---|---|
| Chưa có menu | `Menu đang được cập nhật, vui lòng gọi nhân viên.` |
| Không có kết quả tìm kiếm | `Không tìm thấy món phù hợp.` |
| Ảnh lỗi | Dùng ảnh placeholder theo brand/quán |

## 5. Module C: Giỏ hàng và cấu hình món
### 5.1. Cart item snapshot
| Trường | Mô tả |
|---|---|
| `menu_item_id` | Món gốc |
| `name_snapshot` | Tên món tại thời điểm thêm/chốt |
| `price_snapshot` | Giá tại thời điểm chốt |
| `quantity` | Số lượng |
| `selected_options` | Option khách chọn |
| `note` | Ghi chú riêng cho món |
| `line_total` | Tổng dòng tạm tính |

### 5.2. Functional rules
| ID | Rule |
|---|---|
| CART-01 | Giỏ lưu local trên thiết bị trước khi chốt. |
| CART-02 | Hai item cùng món nhưng khác option hoặc ghi chú là hai dòng riêng. |
| CART-03 | Giới hạn ghi chú đề xuất: 200 ký tự mỗi item. |
| CART-04 | Không cho số lượng <= 0. |
| CART-05 | Trước khi submit, hệ thống validate lại trạng thái món từ server. |

### 5.3. Validation
| Case | Message gợi ý |
|---|---|
| Giỏ rỗng | `Bạn chưa chọn món nào.` |
| Option bắt buộc thiếu | `Vui lòng chọn đủ tuỳ chọn cho món.` |
| Món tạm hết | `Một số món vừa tạm hết. Vui lòng cập nhật giỏ.` |
| Ghi chú quá dài | `Ghi chú tối đa 200 ký tự.` |

## 6. Module D: Chốt đơn
### 6.1. Order payload tối thiểu
| Trường | Mô tả |
|---|---|
| `table_id` | Bàn từ QR token |
| `table_session_id` | Phiên bàn hiện tại hoặc phiên mới |
| `items` | Danh sách món snapshot |
| `subtotal` | Tổng tạm tính |
| `customer_note` | Ghi chú chung nếu có |
| `idempotency_key` | Khóa chống trùng submit |

### 6.2. Functional rules
| ID | Rule |
|---|---|
| ORDER-01 | Order tạo thành công có trạng thái đầu là `NEW`. |
| ORDER-02 | Hệ thống trả về `order_code` thân thiện cho khách/KDS. |
| ORDER-03 | Nếu submit cùng idempotency key, hệ thống trả lại order đã tạo thay vì tạo order mới. |
| ORDER-04 | Order phải lưu `created_at` theo timezone hệ thống/quán. |
| ORDER-05 | Không yêu cầu thanh toán online. Tổng tiền là tạm tính để đối soát. |

## 7. Module E: KDS
### 7.1. Danh sách order
| Thông tin | Bắt buộc | Ghi chú |
|---|---|---|
| Mã order | Có | Ví dụ `B05-001` hoặc short code |
| Bàn | Có | Nổi bật nhất |
| Thời gian gửi | Có | Để ưu tiên |
| Danh sách món | Có | Tên, số lượng, option |
| Ghi chú | Có nếu có | Nổi bật bằng màu/label |
| Trạng thái | Có | NEW/PREPARING/READY/SERVED/CANCELLED |

### 7.2. Functional rules
| ID | Rule |
|---|---|
| KDS-01 | Order mới hiển thị theo thứ tự thời gian tăng dần hoặc cột `Mới nhận`. |
| KDS-02 | Chỉ cho chuyển trạng thái theo luồng hợp lệ. |
| KDS-03 | Ghi chú món phải nhìn thấy mà không cần mở quá nhiều lớp nếu không gian cho phép. |
| KDS-04 | Hủy order cần quyền phù hợp và lý do đơn giản. |
| KDS-05 | KDS cần auto-refresh/polling/realtime để tránh bỏ sót đơn. |

## 8. Module F: Tracking cho khách
| Chức năng | Mô tả |
|---|---|
| Xem order vừa gửi | Hiển thị order code, bàn, danh sách món, tổng tiền |
| Xem trạng thái | Map trạng thái nội bộ sang ngôn ngữ thân thiện |
| Gọi thêm món | CTA quay lại menu, giữ context bàn/session |
| Refresh | Có thể tự động hoặc có nút thủ công |

## 9. Module G: Admin menu, bàn, QR
### 9.1. Menu admin
| Chức năng | Must/Should |
|---|---|
| Tạo/sửa/xóa mềm món | Must |
| Đổi trạng thái ACTIVE/SOLD_OUT/HIDDEN | Must |
| Tạo/sửa danh mục | Must |
| Upload/nhập URL ảnh | Should |
| Sắp xếp món/danh mục | Should |

### 9.2. Bàn và QR
| Chức năng | Must/Should |
|---|---|
| Tạo/sửa bàn | Must |
| Tạo token QR duy nhất | Must |
| Xem/copy QR URL | Must |
| Reset phiên bàn | Should |
| Download QR image | Could |

## 10. Báo cáo và lịch sử tối thiểu
| Log | Mục đích |
|---|---|
| Order history | Đối soát đơn theo bàn/thời gian |
| Status history | Biết ai đổi trạng thái khi nào nếu có auth |
| Menu status change | Truy vết món tạm hết/bật lại |
| Session reset | Tránh tranh cãi lẫn phiên bàn |

## 11. Checklist QA nghiệp vụ
| ID | Scenario |
|---|---|
| QA-01 | Quét QR bàn 05 hiển thị đúng bàn 05. |
| QA-02 | Thêm món active vào giỏ thành công. |
| QA-03 | Không thêm được món tạm hết. |
| QA-04 | Chốt giỏ có 2 món, 1 ghi chú, KDS hiển thị đủ. |
| QA-05 | Bấm chốt nhiều lần không tạo order trùng. |
| QA-06 | KDS đổi trạng thái, khách thấy trạng thái mới. |
| QA-07 | Gọi thêm món tạo order bổ sung. |
| QA-08 | Admin đổi món thành tạm hết, menu khách phản ánh. |
| QA-09 | Reset bàn đóng session cũ. |
| QA-10 | QR token sai không vào được menu. |
