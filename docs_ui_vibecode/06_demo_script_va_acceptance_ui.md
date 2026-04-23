# Demo Script và Acceptance UI

## 1. Demo story trong 3 phút
Khách ngồi tại Bàn 05, quét QR, gọi 2 món có ghi chú. Bếp nhận đơn ngay trên KDS, đổi trạng thái. Khách thấy trạng thái cập nhật. Admin đánh dấu một món tạm hết và reset bàn khi kết thúc.

## 2. Demo routes
| Actor | Route | Mục đích |
|---|---|---|
| Khách | `/qr/table-05` | Bắt đầu flow |
| Bếp/quầy | `/kds` | Nhận và xử lý order |
| Admin | `/admin/menu` | Đánh dấu món tạm hết |
| Admin/quản lý | `/admin/tables` | Reset bàn |

## 3. Demo script chi tiết
| Bước | Actor | Hành động | Kỳ vọng |
|---:|---|---|---|
| 1 | Khách | Mở `/qr/table-05` | Menu hiện đúng `Bàn 05` |
| 2 | Khách | Chọn `Bún bò đặc biệt` | Mở item detail |
| 3 | Khách | Chọn option `Ít cay`, ghi chú `Không hành` | Option/note được lưu |
| 4 | Khách | Thêm `Trà đào cam sả` | Cart count tăng |
| 5 | Khách | Vào cart | Thấy 2 món, tổng tạm tính |
| 6 | Khách | Bấm `Gửi order cho quán` | Loading, sau đó tracking `B05-001` |
| 7 | Bếp | Mở `/kds` | Thấy order mới Bàn 05 |
| 8 | Bếp | Bấm `Bắt đầu chuẩn bị` | Order chuyển `Đang chuẩn bị` |
| 9 | Khách | Xem tracking | Timeline cập nhật `Đang chuẩn bị` |
| 10 | Bếp | Bấm `Sẵn sàng` | Order chuyển `Sẵn sàng` |
| 11 | Khách | Bấm `Gọi thêm món` | Quay lại menu cùng bàn |
| 12 | Admin | Vào `/admin/menu`, đánh dấu `Chè khúc bạch` tạm hết | Customer menu disabled món đó |
| 13 | Admin | Vào `/admin/tables`, reset Bàn 05 | Phiên bàn được reset cho lượt mới |

## 4. UI acceptance checklist
### 4.1. Customer mobile
| ID | Checklist | Pass/Fail |
|---|---|---|
| CUS-01 | Ở width 390px không bị vỡ layout |  |
| CUS-02 | Số bàn luôn rõ ở header/cart/tracking |  |
| CUS-03 | Sticky cart bar rõ và không che nội dung quan trọng |  |
| CUS-04 | Item ACTIVE add cart được |  |
| CUS-05 | Item SOLD_OUT không add cart được |  |
| CUS-06 | Cart hiển thị option/note/quantity/subtotal |  |
| CUS-07 | Submit có loading và disabled để tránh double click |  |
| CUS-08 | Tracking có timeline trạng thái thân thiện |  |
| CUS-09 | CTA `Gọi thêm món` hoạt động |  |

### 4.2. KDS
| ID | Checklist | Pass/Fail |
|---|---|---|
| KDS-01 | Order mới xuất hiện sau submit |  |
| KDS-02 | Bàn và số lượng món đọc rất rõ |  |
| KDS-03 | Ghi chú `Không hành` nổi bật |  |
| KDS-04 | Status transition đúng thứ tự |  |
| KDS-05 | KDS action một chạm, ít nhiễu |  |
| KDS-06 | Empty state rõ khi không có đơn |  |

### 4.3. Admin
| ID | Checklist | Pass/Fail |
|---|---|---|
| ADM-01 | Admin menu hiển thị danh sách món/trạng thái |  |
| ADM-02 | Đổi `ACTIVE -> SOLD_OUT` phản ánh sang customer menu |  |
| ADM-03 | Đổi `SOLD_OUT -> ACTIVE` phản ánh sang customer menu |  |
| ADM-04 | Table/QR screen có Bàn 05 và URL demo |  |
| ADM-05 | Reset bàn có warning và feedback thành công |  |

## 5. Business acceptance
| ID | Requirement | Pass/Fail |
|---|---|---|
| BA-01 | Không yêu cầu khách đăng nhập |  |
| BA-02 | Không có payment online trong core flow |  |
| BA-03 | Order sau khi chốt không sửa trực tiếp |  |
| BA-04 | Gọi thêm tạo order mới hoặc flow mới cùng bàn |  |
| BA-05 | KDS status sync sang customer tracking |  |
| BA-06 | Sold out chặn đặt món |  |
| BA-07 | Reset bàn đóng phiên hiện tại |  |

## 6. Visual acceptance
| ID | Requirement | Pass/Fail |
|---|---|---|
| UI-01 | Không giống template SaaS tím/trắng generic |  |
| UI-02 | Có palette ấm rice/paper/chili/turmeric/leaf |  |
| UI-03 | Typography có cá tính nhưng đọc tốt tiếng Việt |  |
| UI-04 | Menu card làm món ăn hấp dẫn |  |
| UI-05 | KDS operational, rõ hơn là trang trí |  |
| UI-06 | Motion có ý nghĩa, không lạm dụng |  |
| UI-07 | Tên quán hiển thị đúng `Bếp Nhà Mình` |  |

## 7. Nếu demo lỗi thì nói gì
| Lỗi | Cách xử lý trong demo |
|---|---|
| Realtime chưa sync ngay | Bấm refresh và nói prototype đang dùng polling/fallback |
| Ảnh món chưa có | Dùng placeholder, nhấn mạnh dữ liệu ảnh sẽ thay bằng assets thật |
| Admin chưa đủ CRUD | Tập trung quick action tạm hết/bán lại vì đó là rule vận hành chính |
| AI chưa có | Nói AI là phase 2, core ordering là phần cần validate trước |

## 8. Go/No-Go trước khi trình khách
Prototype chỉ nên demo khi pass tối thiểu:

- `CUS-02`, `CUS-05`, `CUS-07`, `CUS-08`.
- `KDS-01`, `KDS-03`, `KDS-04`.
- `ADM-02`, `ADM-05`.
- `BA-02`, `BA-05`, `BA-06`.
- `UI-01`, `UI-05`.
