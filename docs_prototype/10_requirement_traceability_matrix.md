# Requirement Traceability Matrix

## 1. Mục tiêu
Traceability matrix giúp BA/PM/QA kiểm tra rằng yêu cầu trong BRD đã được chuyển thành phạm vi prototype, user story và test scenario tương ứng.

## 2. Ma trận traceability theo module
| BRD Module | Requirement chính | Prototype scope | User stories | Test/UAT |
|---|---|---|---|---|
| A - QR định danh bàn | QR map đúng cửa hàng/chi nhánh/bàn, session không cần login | Có | US-01, US-02, US-03 | QA-01, QA-10, UAT-01, UAT-07 |
| B - Menu số | Menu theo danh mục, món có giá/ảnh/mô tả/trạng thái | Có | US-04, US-05, US-06, US-07 | QA-02, QA-03, UAT-05 |
| C - Giỏ hàng | Thêm món, số lượng, option, ghi chú, tổng tạm tính | Có | US-08, US-09, US-10 | QA-04 |
| D - Chốt đơn | Tạo order, gắn bàn/session, đẩy tới KDS, không thanh toán online | Có | US-11, US-12 | QA-04, QA-05, UAT-02, UAT-06 |
| E - KDS | Bếp nhận order, xem món/ghi chú, cập nhật trạng thái | Có | US-13, US-14, US-15, US-16 | QA-06, UAT-03 |
| F - Tracking khách | Khách xem trạng thái order, order bổ sung | Có | US-17, US-18, US-19 | QA-06, QA-07, UAT-03, UAT-04 |
| G - Admin vận hành | Quản lý menu, bàn, QR, trạng thái món | Có | US-20, US-21, US-22, US-23, US-24 | QA-08, QA-09, UAT-05, UAT-07 |
| H - AI tư vấn món | Hỏi đáp/gợi ý/upsell dựa trên menu | Phase 2 hoặc mock | AI-lite optional | AI-QA-01 đến AI-QA-06 |

## 3. Ma trận business rule
| Rule BRD | Quyết định trong prototype | Nơi đặc tả | Cách kiểm thử |
|---|---|---|---|
| Một QR đại diện một bàn | Giữ nguyên | `02_quy_trinh_nghiep_vu_thong_nhat.md` | Quét QR bàn 05 hiển thị bàn 05 |
| Một bàn có nhiều order trong phiên | Giữ nguyên | `02`, `06` | Gọi thêm tạo order mới cùng session |
| Reset phiên khi khách mới | Giữ nguyên | `02`, `07` | Reset bàn, order mới không lẫn session cũ |
| Khách không đăng nhập | Giữ nguyên | `01`, `05` | Đặt món từ QR không cần account |
| Chỉ món đang bán được đặt | Giữ nguyên | `02`, `04` | SOLD_OUT bị disabled/chặn submit |
| Sau chốt không sửa order cũ | Giữ nguyên | `02`, `03` | Gọi thêm tạo order bổ sung |
| Trạng thái khách thân thiện | Giữ nguyên | `02`, `04`, `08` | Status mapping đúng trên tracking |
| AI không tự tạo order | Phase 2 | `09` | AI chỉ gợi ý, không submit order |

## 4. Coverage theo tài liệu
| Tài liệu | Bao phủ |
|---|---|
| `01_phan_tich_du_an_va_dinh_huong_san_pham.md` | Bối cảnh, định vị, scope, rủi ro, giả định |
| `02_quy_trinh_nghiep_vu_thong_nhat.md` | Quy trình To-Be, state machine, RACI, SOP |
| `03_prd_mvp_va_backlog_po.md` | Epics, user stories, acceptance criteria |
| `04_dac_ta_chuc_nang_ba.md` | Functional rules, validation, QA checklist |
| `05_kien_truc_ky_thuat_cto.md` | Kiến trúc, stack, bảo mật, NFR |
| `06_data_model_api_spec.md` | ERD, API, idempotency, realtime events |
| `07_ke_hoach_prototype_pm.md` | Timeline, demo script, UAT, risk register |
| `08_ux_flow_wireframe_scope.md` | Sitemap, screens, microcopy, wireframe text |
| `09_ai_phase_2_prompt_knowledge_design.md` | AI scope, guardrails, knowledge schema, evaluation |

## 5. Gap analysis từ BRD gốc
| Gap | Mức ảnh hưởng | Đề xuất xử lý |
|---|---|---|
| Chưa chốt session mở khi quét QR hay khi chốt order | Trung bình | Prototype mở session khi order đầu tiên được tạo; có thể tracking scan sau. |
| Chưa chốt quyền hủy order | Trung bình | Cho KDS/manager hủy với lý do; production tinh chỉnh RBAC sau. |
| Chưa chốt gộp giỏ nhiều thiết bị cùng bàn | Trung bình | Mỗi thiết bị giữ giỏ riêng; order cùng gắn session bàn. |
| Chưa có API/data model | Cao | Đã đề xuất trong `06_data_model_api_spec.md`. |
| Chưa có UAT/demo plan | Cao | Đã đề xuất trong `07_ke_hoach_prototype_pm.md`. |
| AI dễ bị hiểu là MVP bắt buộc | Trung bình | Đưa AI sang Phase 2/mock trong `09_ai_phase_2_prompt_knowledge_design.md`. |

## 6. Go/No-Go checklist cho prototype demo
| ID | Điều kiện | Status mặc định |
|---|---|---|
| GO-01 | QR vào đúng bàn | Required |
| GO-02 | Menu hiển thị ít nhất 15 món demo | Required |
| GO-03 | Chốt đơn hợp lệ vào KDS | Required |
| GO-04 | KDS đổi trạng thái và khách thấy cập nhật | Required |
| GO-05 | Admin đổi món tạm hết | Required |
| GO-06 | Gọi thêm món tạo order bổ sung | Required |
| GO-07 | Reset bàn hoạt động | Required |
| GO-08 | Auth Admin/KDS không bị bỏ trống hoàn toàn | Required |
| GO-09 | AI-lite demo nếu đã cam kết | Optional |
