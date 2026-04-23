# PRD MVP và Backlog cho PO

## 1. Mục tiêu PRD
Tài liệu này chuyển BRD thành yêu cầu sản phẩm có thể đưa vào backlog phát triển prototype. Mỗi hạng mục ưu tiên cho việc demo một luồng nghiệp vụ hoàn chỉnh với khách hàng.

## 2. Product goals
| ID | Goal | Metric demo |
|---|---|---|
| G-01 | Khách tự đặt món tại bàn | Hoàn tất order từ QR đến KDS trong một flow |
| G-02 | Bếp nhận và xử lý đơn rõ ràng | KDS hiển thị order mới và đổi được trạng thái |
| G-03 | Admin kiểm soát menu/bàn | Đổi trạng thái món và quản lý QR/bàn cơ bản |
| G-04 | Giảm lỗi gọi món | Validate món, option, ghi chú, chống trùng order |
| G-05 | Sẵn sàng mở rộng | Data model không khóa đường AI/POS/payment phase sau |

## 3. Personas chính
| Persona | Nhu cầu | Tiêu chí thành công |
|---|---|---|
| Khách hàng | Gọi món nhanh, rõ giá, ít chờ | Không cần tài khoản, thao tác ít, thấy trạng thái |
| Bếp/quầy | Nhận order rõ, ưu tiên đúng | Không bỏ sót order, ghi chú nổi bật |
| Quản lý ca | Theo dõi bàn và order | Biết bàn nào đang có đơn, reset được bàn |
| Admin/chủ quán | Quản lý menu linh hoạt | Đổi giá/trạng thái món dễ dàng |

## 4. MVP feature list
| ID | Feature | Priority | Ghi chú |
|---|---|---|---|
| F-01 | QR landing theo bàn | Must | Token bàn trong URL |
| F-02 | Menu danh mục | Must | Mobile-first |
| F-03 | Chi tiết món | Must | Ảnh, giá, mô tả, trạng thái |
| F-04 | Giỏ hàng | Must | Số lượng, ghi chú, option cơ bản |
| F-05 | Chốt đơn | Must | Validate và chống trùng |
| F-06 | Tracking trạng thái khách | Must | Gần realtime hoặc refresh/polling |
| F-07 | KDS danh sách order | Must | New/preparing/ready/served/cancelled |
| F-08 | Admin quản lý menu | Must | CRUD cơ bản và tạm hết |
| F-09 | Admin quản lý bàn/QR | Must | Tạo/xem token QR |
| F-10 | Reset phiên bàn | Should | Quan trọng cho demo vận hành |
| F-11 | Tìm kiếm/lọc menu | Should | Tốt cho menu nhiều món |
| F-12 | AI-lite gợi ý món | Could | Chỉ demo nếu cần |

## 5. Epics và user stories

### Epic E1: QR và phiên bàn
| Story ID | User story | Priority | Acceptance criteria |
|---|---|---|---|
| US-01 | Là khách, tôi muốn quét QR để vào đúng bàn để không cần chọn bàn thủ công. | Must | URL QR chứa token hợp lệ; hệ thống hiển thị đúng số bàn; QR sai hiển thị lỗi thân thiện. |
| US-02 | Là hệ thống, tôi muốn gắn order với table session để không lẫn order giữa các lượt khách. | Must | Order lưu `table_id` và `table_session_id`; session có trạng thái; admin reset được session. |
| US-03 | Là quản lý, tôi muốn reset bàn sau khi khách rời đi để bàn sẵn sàng cho lượt mới. | Should | Có nút reset; hệ thống đóng session cũ; order cũ vẫn xem được ở lịch sử. |

### Epic E2: Menu số
| Story ID | User story | Priority | Acceptance criteria |
|---|---|---|---|
| US-04 | Là khách, tôi muốn xem menu theo danh mục để tìm món nhanh. | Must | Danh mục hiển thị; món thuộc danh mục đúng; món ẩn không hiển thị. |
| US-05 | Là khách, tôi muốn xem chi tiết món để hiểu giá, ảnh và mô tả trước khi đặt. | Must | Chi tiết có tên, giá, ảnh/placeholder, mô tả, trạng thái, option nếu có. |
| US-06 | Là khách, tôi muốn biết món tạm hết để không đặt nhầm. | Must | Món tạm hết không thể thêm giỏ; trạng thái hiển thị rõ. |
| US-07 | Là khách, tôi muốn tìm kiếm/lọc món để menu lớn vẫn dễ dùng. | Should | Search theo tên/tags; kết quả rỗng có hướng dẫn. |

### Epic E3: Giỏ hàng và chốt đơn
| Story ID | User story | Priority | Acceptance criteria |
|---|---|---|---|
| US-08 | Là khách, tôi muốn thêm món vào giỏ với số lượng để chuẩn bị chốt đơn. | Must | Tăng/giảm số lượng; xóa món; tổng tiền cập nhật. |
| US-09 | Là khách, tôi muốn thêm ghi chú cho từng món để bếp làm đúng yêu cầu. | Must | Ghi chú lưu theo order item; có giới hạn ký tự; hiển thị trên KDS. |
| US-10 | Là khách, tôi muốn chọn option cơ bản để cấu hình món. | Must | Option bắt buộc phải chọn; option được lưu snapshot khi chốt. |
| US-11 | Là khách, tôi muốn chốt đơn an toàn để không bị gửi trùng. | Must | Nút submit disabled khi gửi; idempotency key; refresh không tạo thêm order nếu request cũ đã thành công. |
| US-12 | Là khách, tôi muốn gọi thêm món sau order đầu tiên. | Should | Gọi thêm tạo order mới cùng table session; KDS phân biệt order theo thời gian/mã. |

### Epic E4: KDS xử lý order
| Story ID | User story | Priority | Acceptance criteria |
|---|---|---|---|
| US-13 | Là bếp/quầy, tôi muốn thấy order mới ngay để bắt đầu chuẩn bị. | Must | KDS có danh sách order `NEW`; hiển thị bàn, thời gian, món, số lượng, option, ghi chú. |
| US-14 | Là bếp/quầy, tôi muốn đổi trạng thái order để khách và phục vụ biết tiến độ. | Must | Đổi được `NEW -> PREPARING -> READY -> SERVED`; trạng thái cập nhật cho khách. |
| US-15 | Là quản lý/bếp, tôi muốn hủy order khi có ngoại lệ để lịch sử rõ ràng. | Should | Order có trạng thái `CANCELLED`; có lý do hủy đơn giản; khách thấy trạng thái phù hợp. |
| US-16 | Là bếp/quầy, tôi muốn ghi chú món nổi bật để tránh làm sai. | Must | Ghi chú item có style nổi bật; nếu không có ghi chú thì không chiếm nhiều diện tích. |

### Epic E5: Tracking cho khách
| Story ID | User story | Priority | Acceptance criteria |
|---|---|---|---|
| US-17 | Là khách, tôi muốn thấy đơn đã được tiếp nhận để yên tâm không cần gọi nhân viên. | Must | Sau submit hiển thị order code, bàn, món, trạng thái. |
| US-18 | Là khách, tôi muốn trạng thái tự cập nhật/gần realtime để biết món đang tới đâu. | Must | Polling hoặc realtime cập nhật trong thời gian chấp nhận được; có nút refresh thủ công. |
| US-19 | Là khách, tôi muốn quay lại menu từ trang tracking để gọi thêm. | Should | CTA `Gọi thêm món`; order mới cùng session. |

### Epic E6: Admin quản trị menu và bàn
| Story ID | User story | Priority | Acceptance criteria |
|---|---|---|---|
| US-20 | Là admin, tôi muốn tạo/sửa món để cập nhật menu số. | Must | CRUD món cơ bản; validate tên/giá/danh mục/trạng thái. |
| US-21 | Là admin, tôi muốn đánh dấu món tạm hết để khách không đặt món đó. | Must | Đổi trạng thái phản ánh trên menu; chặn submit nếu món đã trong giỏ. |
| US-22 | Là admin, tôi muốn quản lý danh mục để sắp xếp menu. | Must | Tạo/sửa/ẩn danh mục; món liên kết danh mục. |
| US-23 | Là admin/quản lý, tôi muốn quản lý bàn và QR để triển khai tại quán. | Must | Tạo bàn; xem/copy QR URL; token duy nhất. |
| US-24 | Là quản lý ca, tôi muốn xem order theo bàn để theo dõi vận hành. | Should | Lọc theo bàn/trạng thái/thời gian; xem chi tiết order. |

## 6. Acceptance criteria cấp sản phẩm
| ID | Tiêu chí |
|---|---|
| AC-P01 | Demo được flow end-to-end trên ít nhất 1 bàn và 1 màn hình KDS. |
| AC-P02 | Không thể chốt order với giỏ rỗng hoặc món tạm hết. |
| AC-P03 | Order hiển thị trên KDS với đầy đủ món, số lượng, option, ghi chú và tổng tiền tạm tính. |
| AC-P04 | Trạng thái đổi trên KDS được phản ánh ở màn hình khách. |
| AC-P05 | Admin đánh dấu món tạm hết và khách thấy/chịu ảnh hưởng ngay. |
| AC-P06 | Gọi thêm món tạo order mới, không sửa order đã gửi. |
| AC-P07 | Reset bàn đóng session hiện tại và chuẩn bị cho lượt khách mới. |

## 7. Definition of Ready
| Điều kiện | Mô tả |
|---|---|
| Requirement rõ | Story có actor, mục tiêu, acceptance criteria |
| UI đủ hiểu | Có flow hoặc wireframe text tương ứng |
| Data rõ | Biết entity nào bị đọc/ghi |
| Rule rõ | Các validation và exception chính đã xác định |
| Demo impact rõ | Biết story phục vụ đoạn nào trong kịch bản demo |

## 8. Definition of Done
| Điều kiện | Mô tả |
|---|---|
| Chạy được end-to-end | Feature hoạt động qua UI, không chỉ API |
| Validate nghiệp vụ | Chặn được case lỗi chính |
| State nhất quán | DB, UI khách, KDS/Admin không mâu thuẫn |
| Có dữ liệu demo | Seed data đủ để PO/khách test |
| Có test tối thiểu | Unit/integration hoặc checklist manual cho story |
| Không lộ quyền admin | Link khách không truy cập được màn admin/KDS |

## 9. Backlog ưu tiên cho prototype 2 tuần
| Thứ tự | Hạng mục | Vai trò lead | Phụ thuộc |
|---:|---|---|---|
| 1 | Data model + seed menu/bàn | Backend | Chốt entity tối thiểu |
| 2 | QR landing + menu list/detail | Frontend | Seed menu |
| 3 | Cart + submit order | Fullstack | API order |
| 4 | KDS list + status update | Fullstack | Order status model |
| 5 | Customer tracking | Frontend | Status update API/realtime |
| 6 | Admin menu status + table reset | Fullstack | Auth/admin shell |
| 7 | Demo polish + UAT fixes | PO/QA/Dev | Flow end-to-end hoàn tất |

## 10. Out of scope rõ ràng
| Hạng mục | Lý do loại khỏi prototype |
|---|---|
| Thanh toán online | Tăng rủi ro tích hợp, pháp lý, reconciliation |
| POS sync | Phụ thuộc hệ thống ngoài, không cần để chứng minh core flow |
| Quản lý kho | Đòi hỏi nghiệp vụ sâu hơn món-nguyên liệu |
| AI agent đầy đủ | Core ordering chưa ổn thì AI không tạo giá trị bền |
| Đa chi nhánh nâng cao | Prototype có thể giữ field store/branch nhưng chưa build workflow đầy đủ |
