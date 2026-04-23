# Bộ tài liệu thống nhất dự án Prototype

## 1. Mục đích
Bộ tài liệu này được tạo dựa trên file `ba_brd_dat_do_an_noi_bo_fn_b_v_1.md` để giúp đội PO, PM, CTO, BA, UX/UI và Dev thống nhất trước khi làm prototype cho khách hàng.

Mục tiêu quan trọng nhất là chốt một quy trình nghiệp vụ đủ rõ cho vòng đời: khách quét QR tại bàn, xem menu, thêm món, chốt đơn, bếp nhận đơn, cập nhật trạng thái, khách theo dõi trạng thái và quán reset bàn khi kết thúc lượt phục vụ.

## 2. Định vị sản phẩm
Sản phẩm là web app đặt món tại bàn cho cửa hàng F&B, không phải app giao hàng, không phải hệ thống POS hoàn chỉnh và không phải hệ thống quản lý kho/phân tích doanh thu đầy đủ trong MVP.

Prototype nên chứng minh được giá trị cốt lõi: giảm phụ thuộc nhân viên ghi order thủ công và giúp bếp/quầy nhận đơn rõ ràng, nhanh, ít sai sót hơn.

## 3. Phạm vi chốt cho prototype
| Nhóm | Có trong prototype | Không làm trong prototype |
|---|---|---|
| Khách hàng | Quét QR, xem menu, xem chi tiết món, thêm giỏ, ghi chú, chốt đơn, theo dõi trạng thái | Đăng ký tài khoản, thanh toán online, loyalty |
| Bếp/quầy | Màn hình đơn mới, xem chi tiết món/ghi chú, đổi trạng thái đơn | Chia station bếp nâng cao, SLA phức tạp |
| Admin/quản lý | Quản lý món cơ bản, bật/tắt món, quản lý bàn/QR, xem order | Quản lý kho nguyên liệu realtime, kế toán, POS sync |
| AI | Ghi nhận như Phase 2 hoặc demo mock nếu cần kể câu chuyện | AI agent tự động chốt đơn, AI trả lời ngoài dữ liệu menu |

## 4. Danh sách tài liệu đã tạo
| File | Vai trò chính | Mục đích |
|---|---|---|
| `00_tong_quan_bo_tai_lieu.md` | PM/PO | Bản đồ bộ tài liệu và cách sử dụng |
| `01_phan_tich_du_an_va_dinh_huong_san_pham.md` | PO/PM/BA | Phân tích bài toán, định vị MVP, ranh giới sản phẩm |
| `02_quy_trinh_nghiep_vu_thong_nhat.md` | BA/PM/Operation | Single source of truth cho quy trình nghiệp vụ |
| `03_prd_mvp_va_backlog_po.md` | PO/BA | PRD, epics, user stories, acceptance criteria |
| `04_dac_ta_chuc_nang_ba.md` | BA/QA/Dev | Đặc tả chức năng chi tiết theo module |
| `05_kien_truc_ky_thuat_cto.md` | CTO/Tech Lead/Dev | Định hướng kiến trúc, stack, bảo mật, realtime |
| `06_data_model_api_spec.md` | CTO/Backend/Frontend | Data model, ERD, API high-level, event realtime |
| `07_ke_hoach_prototype_pm.md` | PM/Delivery | Kế hoạch prototype, timeline, demo, UAT |
| `08_ux_flow_wireframe_scope.md` | UX/UI/PO/BA | Sitemap, user flow, danh sách màn hình, wireframe text |
| `09_ai_phase_2_prompt_knowledge_design.md` | AI Engineer/PO | Định hướng AI assistant phase sau và mock prototype |
| `10_requirement_traceability_matrix.md` | BA/QA/PM | Traceability từ BRD sang scope prototype và test |

## 5. Cách dùng trong workshop với khách hàng
| Phần | Thời lượng | Tài liệu dùng |
|---|---:|---|
| Chốt bài toán và mục tiêu prototype | 15 phút | `01_phan_tich_du_an_va_dinh_huong_san_pham.md` |
| Walkthrough quy trình nghiệp vụ To-Be | 25 phút | `02_quy_trinh_nghiep_vu_thong_nhat.md` |
| Chốt phạm vi MVP/prototype | 20 phút | `03_prd_mvp_va_backlog_po.md` |
| Review màn hình và hành trình người dùng | 20 phút | `08_ux_flow_wireframe_scope.md` |
| Review kiến trúc và dữ liệu ở mức khách hàng hiểu được | 15 phút | `05_kien_truc_ky_thuat_cto.md`, `06_data_model_api_spec.md` |
| Chốt timeline, UAT và next steps | 15 phút | `07_ke_hoach_prototype_pm.md` |

## 6. Quyết định cần khách hàng xác nhận sớm
| ID | Quyết định | Khuyến nghị cho prototype |
|---|---|---|
| DEC-01 | Có cần nhân viên xác nhận đơn trước khi bếp làm không? | Không. Đơn vào trực tiếp KDS, bếp/quầy xử lý. |
| DEC-02 | Có cho khách sửa order sau khi đã chốt không? | Không sửa order cũ. Gọi thêm tạo order bổ sung. |
| DEC-03 | Trạng thái đơn nào cần hiển thị cho khách? | Tiếp nhận, đang chuẩn bị, sẵn sàng/đang mang ra, đã phục vụ. |
| DEC-04 | Khi khách mới ngồi vào bàn, ai reset phiên bàn? | Thu ngân/quản lý ca reset khi bàn được dọn hoặc thanh toán xong. |
| DEC-05 | Có cần thanh toán trong prototype không? | Không. Chỉ hiển thị tổng tạm tính. |
| DEC-06 | AI có phải tính năng demo bắt buộc không? | Không bắt buộc. Nếu cần, demo AI-lite bằng dữ liệu menu mẫu. |

## 7. Nguyên tắc triển khai prototype
| Nguyên tắc | Ý nghĩa |
|---|---|
| Core flow trước AI | QR -> menu -> giỏ -> order -> KDS phải mượt trước khi thêm AI. |
| Mobile-first cho khách | Khách dùng điện thoại cá nhân tại bàn. |
| KDS rõ hơn đẹp | Bếp cần đọc nhanh món, số lượng, ghi chú, bàn, thời gian. |
| Chống trùng đơn | Nút chốt đơn phải có loading/idempotency để tránh gửi nhiều lần. |
| Dữ liệu menu là nền | Menu sai hoặc thiếu làm prototype mất niềm tin ngay cả khi UI đẹp. |

## 8. Kết luận ngắn
Nếu chỉ được demo một câu chuyện, hãy demo câu chuyện này: khách ngồi bàn 05, quét QR, chọn 2 món có ghi chú, gửi order, bếp nhận ngay, bếp đổi trạng thái, khách thấy trạng thái thay đổi, admin đánh dấu một món tạm hết và khách không thể đặt món đó nữa.
