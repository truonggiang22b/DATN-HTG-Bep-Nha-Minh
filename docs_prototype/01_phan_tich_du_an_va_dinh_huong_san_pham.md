# Phân tích dự án và định hướng sản phẩm

## 1. Tóm tắt điều hành
Dự án hướng đến việc xây dựng hệ thống đặt món tại bàn cho cửa hàng F&B bằng web app. Khách dùng điện thoại cá nhân quét QR tại bàn để mở menu số, tự chọn món, gửi order trực tiếp đến màn hình vận hành của quán và theo dõi trạng thái đơn.

Ở giai đoạn prototype, sản phẩm cần chứng minh luồng vận hành end-to-end hơn là chứng minh toàn bộ năng lực quản trị F&B. Thành công của prototype nằm ở việc khách hàng nhìn thấy quy trình gọi món mới có thể thay thế phần lớn thao tác ghi order thủ công.

## 2. Bản chất bài toán
| Nhóm vấn đề | Hiện trạng | Hướng giải quyết |
|---|---|---|
| Tốc độ phục vụ | Khách phải đợi nhân viên đưa menu và ghi order | QR tại bàn và menu số tự phục vụ |
| Sai sót order | Nhân viên ghi nhầm, thiếu option, thiếu ghi chú | Khách nhập trực tiếp, order lưu dạng số |
| Đồng bộ bếp/quầy | Bếp nhận thông tin qua giấy/miệng/thao tác thủ công | KDS đơn giản nhận order theo thời gian thực/gần realtime |
| Menu khó cập nhật | Menu giấy chậm đổi, món hết vẫn được gọi | Admin bật/tắt món, đánh dấu tạm hết |
| Bán thêm | Phụ thuộc kỹ năng nhân viên | Phase sau có gợi ý món/AI, MVP chuẩn bị dữ liệu nền |

## 3. Định vị sản phẩm
| Không gian sản phẩm | Định vị cho MVP |
|---|---|
| Hình thức | Web app, không yêu cầu cài app |
| Bối cảnh dùng | Khách đang ngồi tại quán |
| Đơn vị order | Theo bàn và phiên phục vụ |
| Thanh toán | Ngoài phạm vi MVP |
| POS | Chưa thay thế POS, chỉ có thể xuất/xem danh sách order |
| AI | Giá trị cộng thêm, không nằm trên critical path của prototype |

## 4. Tuyên bố sản phẩm
Dành cho cửa hàng F&B muốn giảm tải thao tác gọi món thủ công, hệ thống đặt món tại bàn giúp khách tự xem menu và gửi đơn trực tiếp cho bếp/quầy qua QR, từ đó giảm thời gian chờ, giảm lỗi truyền đạt và tăng tính hiện đại của trải nghiệm tại quán.

## 5. North Star cho prototype
Hoàn thành một vòng đời order tại bàn trong dưới 3 phút:
1. Khách quét QR vào đúng bàn.
2. Khách chọn món và chốt đơn.
3. Bếp/quầy nhìn thấy order ngay.
4. Bếp/quầy cập nhật trạng thái.
5. Khách nhìn thấy trạng thái mới trên điện thoại.

## 6. Mục tiêu sản phẩm MVP
| ID | Mục tiêu | Cách đo trong prototype |
|---|---|---|
| OBJ-01 | Khách tự order không cần nhân viên ghi giấy | Demo flow từ QR đến gửi order thành công |
| OBJ-02 | Bếp nhận order rõ ràng | KDS hiển thị bàn, món, số lượng, option, ghi chú |
| OBJ-03 | Admin quản lý được menu cơ bản | Admin đổi trạng thái món và menu khách phản ánh ngay |
| OBJ-04 | Tránh lỗi nghiệp vụ nghiêm trọng | Chặn món tạm hết, chặn giỏ rỗng, chống trùng order |
| OBJ-05 | Có nền tảng mở rộng AI/POS về sau | Data model có tags, thành phần, option, price snapshot |

## 7. Actor và trách nhiệm chính
| Actor | Việc cần làm trong hệ thống | Thành công nghĩa là |
|---|---|---|
| Khách hàng | Quét QR, xem menu, đặt món, theo dõi đơn | Không cần hỏi nhân viên để hoàn tất order cơ bản |
| Nhân viên phục vụ | Hỗ trợ khách, mang món, xử lý ngoại lệ | Ít ghi order thủ công hơn, biết bàn nào có đơn |
| Bếp/quầy | Nhận order, chế biến, cập nhật trạng thái | Không bỏ sót đơn, đọc rõ ghi chú |
| Thu ngân/quản lý ca | Theo dõi bàn, reset phiên, đối soát order | Biết bàn đang mở và order phát sinh |
| Admin/chủ quán | Quản lý menu, bàn, QR, trạng thái món | Chủ động kiểm soát menu số |

## 8. Scope đề xuất theo MoSCoW
| Mức | Hạng mục |
|---|---|
| Must have | QR theo bàn, menu số, chi tiết món, giỏ hàng, chốt đơn, KDS, cập nhật trạng thái, admin món/bàn cơ bản |
| Should have | Gần realtime trạng thái, tìm kiếm món, lọc danh mục, order bổ sung, reset phiên bàn, ảnh món |
| Could have | Dashboard KPI đơn giản, in phiếu bếp, AI-lite demo, QR download |
| Won't have | Thanh toán online, POS sync, quản lý kho nguyên liệu, loyalty, đa chi nhánh đầy đủ, AI agent nâng cao |

## 9. Giả định quan trọng
| ID | Giả định | Tác động nếu sai |
|---|---|---|
| ASM-01 | Khách có smartphone và mạng đủ ổn định | Cần fallback gọi nhân viên/manual order |
| ASM-02 | Quán có thiết bị cho bếp/quầy xem KDS | Cần phương án in phiếu hoặc tablet chung |
| ASM-03 | Menu có dữ liệu ảnh/giá/mô tả đủ dùng | Cần sprint nhập liệu/chuẩn hóa menu trước demo |
| ASM-04 | Quán chấp nhận thanh toán ngoài hệ thống | Nếu không, scope thanh toán sẽ làm prototype phình lớn |
| ASM-05 | Nhân viên/quản lý có thể reset bàn thủ công | Nếu không, dễ lẫn order giữa các lượt khách |

## 10. Rủi ro sản phẩm cần xử lý sớm
| Rủi ro | Mức | Cách giảm thiểu |
|---|---|---|
| Scope bị kéo sang POS/payment/AI quá sớm | Cao | Chốt prototype chỉ demo core ordering; AI để phase 2/mock |
| Bếp không cập nhật trạng thái đều | Cao | Thiết kế KDS thao tác một chạm, trạng thái tối giản |
| Món tạm hết không cập nhật kịp | Trung bình | Admin có nút tạm hết nhanh, KDS/Admin dễ truy cập |
| Trùng order do khách bấm nhiều lần | Cao | Idempotency key, disable nút khi gửi, màn hình xác nhận rõ |
| Lẫn phiên bàn giữa khách cũ và mới | Cao | Quy trình reset bàn bắt buộc sau thanh toán/dọn bàn |

## 11. Nguyên tắc PO khi ra quyết định backlog
| Nguyên tắc | Diễn giải |
|---|---|
| Ưu tiên giảm friction cho khách | Mỗi màn hình khách phải ít bước, dễ hiểu, mobile-first |
| Ưu tiên rõ ràng cho bếp | KDS cần chữ to, tương phản tốt, ghi chú nổi bật |
| Ưu tiên tính đúng hơn tính nhiều | Đúng bàn, đúng món, đúng trạng thái quan trọng hơn dashboard đẹp |
| Giữ AI ở lớp hỗ trợ | AI không được thay thế xác nhận order của khách trong MVP |
| Dữ liệu phải snapshot | Order phải lưu giá/tên món tại thời điểm đặt để tránh đổi menu ảnh hưởng lịch sử |

## 12. Câu hỏi mở cần chốt với khách hàng
| ID | Câu hỏi | Đề xuất mặc định |
|---|---|---|
| Q-01 | Một bàn có nhiều khách cùng gọi bằng nhiều điện thoại thì gộp giỏ hay tách order? | Mỗi thiết bị có giỏ riêng, khi chốt thì tạo order theo cùng table session. |
| Q-02 | Bếp có được hủy order không? | Có, nhưng phải nhập/chọn lý do hủy ở mức đơn giản. |
| Q-03 | Có cần nhân viên phục vụ xác nhận món đã mang ra không? | Có nút `Đã phục vụ` trên KDS/Admin. |
| Q-04 | Admin có cần upload ảnh thật trong prototype không? | Có nếu có tài nguyên ảnh; nếu chưa, dùng ảnh placeholder nhất quán. |
| Q-05 | QR có hết hạn không? | QR cố định theo bàn; phiên phục vụ mới được reset trong hệ thống. |
